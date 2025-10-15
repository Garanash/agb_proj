#!/bin/bash

echo "🚀 РАЗВЕРТЫВАНИЕ AGB PROJECT ЧЕРЕЗ GIT"
echo "====================================="

# Проверяем, что мы на сервере
if [ "$EUID" -eq 0 ]; then
    echo "❌ Не запускайте скрипт от root!"
    echo "   Используйте обычного пользователя с правами sudo"
    exit 1
fi

# Проверяем Git
if ! command -v git &> /dev/null; then
    echo "❌ Git не установлен!"
    echo "   Установите Git: sudo apt install git (Ubuntu) или sudo yum install git (CentOS)"
    exit 1
fi

echo "✅ Git доступен: $(git --version)"

# Проверяем Docker
if ! command -v docker &> /dev/null; then
    echo ""
    echo "❌ Docker не установлен!"
    echo "   Установка Docker..."
    
    # Определяем дистрибутив
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
    else
        echo "❌ Не удалось определить дистрибутив Linux"
        exit 1
    fi
    
    case $OS in
        ubuntu|debian)
            echo "📦 Установка Docker для Ubuntu/Debian..."
            sudo apt update
            sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt update
            sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        centos|rhel|fedora)
            echo "📦 Установка Docker для CentOS/RHEL/Fedora..."
            sudo yum install -y yum-utils
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        *)
            echo "❌ Неподдерживаемый дистрибутив: $OS"
            echo "   Установите Docker вручную: https://docs.docker.com/engine/install/"
            exit 1
            ;;
    esac
    
    # Запускаем Docker
    sudo systemctl start docker
    sudo systemctl enable docker
    
    # Добавляем пользователя в группу docker
    sudo usermod -aG docker $USER
    
    echo "✅ Docker установлен"
    echo "⚠️ Перелогиньтесь для применения прав Docker"
    echo "   Затем запустите скрипт снова"
    exit 0
fi

echo "✅ Docker установлен: $(docker --version)"

# Проверяем права на Docker
if ! docker ps &> /dev/null; then
    echo ""
    echo "❌ Нет прав на Docker!"
    echo "   Добавляем пользователя в группу docker..."
    sudo usermod -aG docker $USER
    echo "⚠️ Перелогиньтесь для применения прав Docker"
    echo "   Затем запустите скрипт снова"
    exit 0
fi

echo "✅ Права на Docker настроены"

# Проверяем, есть ли уже клонированный репозиторий
if [ -d "agb_proj" ]; then
    echo ""
    echo "📁 Найден существующий репозиторий agb_proj"
    echo "   Переходим в директорию и обновляем..."
    cd agb_proj
    
    # Сохраняем локальные изменения
    if [ -n "$(git status --porcelain)" ]; then
        echo "⚠️ Обнаружены локальные изменения, сохраняем в stash..."
        git stash push -m "Auto-stash before update $(date)"
    fi
    
    # Получаем обновления
    echo "📥 Получение обновлений из репозитория..."
    git fetch origin
    
    # Переключаемся на нужную версию
    if [ "$1" = "latest" ] || [ -z "$1" ]; then
        echo "🔄 Переключение на последнюю версию..."
        git checkout master
        git pull origin master
    else
        echo "🔄 Переключение на версию $1..."
        git checkout "$1"
    fi
else
    echo ""
    echo "📥 Клонирование репозитория..."
    
    # URL репозитория
    REPO_URL="https://github.com/Garanash/agb_proj.git"
    
    # Клонируем репозиторий
    git clone "$REPO_URL"
    
    if [ $? -eq 0 ]; then
        echo "✅ Репозиторий клонирован"
        cd agb_proj
        
        # Переключаемся на нужную версию
        if [ "$1" = "latest" ] || [ -z "$1" ]; then
            echo "🔄 Переключение на последнюю версию..."
            git checkout master
        else
            echo "🔄 Переключение на версию $1..."
            git checkout "$1"
        fi
    else
        echo "❌ Ошибка при клонировании репозитория!"
        exit 1
    fi
fi

# Проверяем наличие необходимых файлов
REQUIRED_FILES=(
    "database_backup_full.sql"
    "config/docker/docker-compose.prod.yml"
    "config/env/production.env"
    "backend/"
    "frontend/"
)

echo ""
echo "🔍 Проверка необходимых файлов..."
for file in "${REQUIRED_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - НЕ НАЙДЕН!"
        echo "   Убедитесь, что вы находитесь в правильной версии репозитория"
        exit 1
    fi
done

# Останавливаем существующие контейнеры
echo ""
echo "🛑 Остановка существующих контейнеров..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down 2>/dev/null || true

# Удаляем старые volumes (если нужно)
echo ""
echo "🗑️ Очистка старых данных..."
docker volume prune -f

# Запускаем только PostgreSQL
echo ""
echo "🐘 Запуск PostgreSQL..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d postgres

# Ждем запуска PostgreSQL
echo ""
echo "⏳ Ожидание запуска PostgreSQL (30 секунд)..."
sleep 30

# Проверяем, что PostgreSQL запущен
echo ""
echo "🔍 Проверка статуса PostgreSQL..."
if ! docker ps | grep -q "agb_postgres_prod"; then
    echo "❌ PostgreSQL не запустился!"
    echo "   Проверьте логи: docker logs agb_postgres_prod"
    exit 1
fi

echo "✅ PostgreSQL запущен"

# Восстанавливаем базу данных
echo ""
echo "📥 Восстановление базы данных из дампа..."
docker exec -i agb_postgres_prod psql -U agb_user -d postgres < database_backup_full.sql

if [ $? -eq 0 ]; then
    echo "✅ База данных успешно восстановлена!"
else
    echo "❌ Ошибка при восстановлении базы данных!"
    echo "   Проверьте логи PostgreSQL: docker logs agb_postgres_prod"
    exit 1
fi

# Проверяем восстановление
echo ""
echo "🔍 Проверка восстановления..."
TABLES_COUNT=$(docker exec agb_postgres_prod psql -U agb_user -d agb_prod -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$TABLES_COUNT" -gt 0 ]; then
    echo "✅ Восстановлено $TABLES_COUNT таблиц"
else
    echo "❌ Таблицы не найдены после восстановления!"
    exit 1
fi

# Проверяем пользователей
echo ""
echo "👥 Проверка пользователей..."
USERS_COUNT=$(docker exec agb_postgres_prod psql -U agb_user -d agb_prod -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')

if [ "$USERS_COUNT" -gt 0 ]; then
    echo "✅ Найдено $USERS_COUNT пользователей"
else
    echo "⚠️ Пользователи не найдены"
fi

# Запускаем все сервисы
echo ""
echo "🚀 Запуск всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d

# Ждем запуска всех сервисов
echo ""
echo "⏳ Ожидание запуска всех сервисов (60 секунд)..."
sleep 60

# Проверяем статус всех контейнеров
echo ""
echo "📊 Статус всех контейнеров:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Проверяем health checks
echo ""
echo "🏥 Проверка health checks..."
for service in postgres redis backend frontend nginx; do
    container_name="agb_${service}_prod"
    if docker ps | grep -q "$container_name"; then
        health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "no-health-check")
        echo "  $service: $health"
    else
        echo "  $service: не запущен"
    fi
done

# Тестируем API
echo ""
echo "🧪 Тестирование API..."
sleep 10

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

# Тестируем health check
echo ""
echo "🔍 Тестирование health check..."
HEALTH_RESPONSE=$(curl -s "http://$SERVER_IP:8000/api/health" || echo "error")

if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
    echo "✅ Backend API работает"
else
    echo "❌ Backend API не отвечает"
    echo "   Ответ: $HEALTH_RESPONSE"
fi

# Тестируем frontend
echo ""
echo "🔍 Тестирование frontend..."
FRONTEND_RESPONSE=$(curl -s -I "http://$SERVER_IP" | head -1 || echo "error")

if [[ "$FRONTEND_RESPONSE" == *"200"* ]] || [[ "$FRONTEND_RESPONSE" == *"HTTP"* ]]; then
    echo "✅ Frontend работает"
else
    echo "❌ Frontend не отвечает"
    echo "   Ответ: $FRONTEND_RESPONSE"
fi

echo ""
echo "🎉 РАЗВЕРТЫВАНИЕ ЧЕРЕЗ GIT ЗАВЕРШЕНО!"
echo ""
echo "📋 Информация о развертывании:"
echo "  - Репозиторий: https://github.com/Garanash/agb_proj.git"
echo "  - Версия: $(git describe --tags --exact-match 2>/dev/null || git rev-parse --short HEAD)"
echo "  - Таблиц восстановлено: $TABLES_COUNT"
echo "  - Пользователей найдено: $USERS_COUNT"
echo "  - Сервер: $SERVER_IP"
echo ""
echo "🌐 Доступ к приложению:"
echo "  - Frontend: http://$SERVER_IP"
echo "  - Backend API: http://$SERVER_IP:8000"
echo "  - API Docs: http://$SERVER_IP:8000/docs"
echo ""
echo "🔑 Данные для входа:"
echo "  - Администратор: admin / admin123"
echo "  - Менеджер 1: manager1 / ManagerPass123!"
echo "  - Менеджер 2: manager2 / ManagerPass123!"
echo "  - Сотрудник 1: employee1 / EmployeePass123!"
echo "  - Сотрудник 2: employee2 / EmployeePass123!"
echo "  - ВЭД специалист: ved_passport1 / VedPass123!"
echo "  - Пользователь: user1 / UserPass123!"
echo ""
echo "📝 Полезные команды:"
echo "  - Просмотр логов: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env logs"
echo "  - Перезапуск сервисов: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart"
echo "  - Остановка сервисов: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down"
echo "  - Обновление кода: git pull && docker-compose restart"
echo ""
echo "🔄 Для обновления в будущем:"
echo "  - Перейдите в директорию: cd agb_proj"
echo "  - Обновите код: git pull"
echo "  - Перезапустите сервисы: docker-compose restart"
