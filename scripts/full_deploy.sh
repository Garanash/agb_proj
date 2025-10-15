#!/bin/bash

echo "🚀 ПОЛНОЕ РАЗВЕРТЫВАНИЕ AGB PROJECT С НУЛЯ"
echo "=========================================="

# Проверяем, что мы на сервере
if [ "$EUID" -eq 0 ]; then
    echo "❌ Не запускайте скрипт от root!"
    echo "   Используйте обычного пользователя с правами sudo"
    exit 1
fi

# Проверяем наличие архива
ARCHIVE_FILE=$(ls agb_deployment_*.tar.gz 2>/dev/null | head -1)

if [ -z "$ARCHIVE_FILE" ]; then
    echo "❌ Архив развертывания не найден!"
    echo "   Убедитесь, что файл agb_deployment_*.tar.gz находится в текущей директории"
    exit 1
fi

echo "✅ Найден архив: $ARCHIVE_FILE"

# Проверяем checksum
CHECKSUM_FILE="${ARCHIVE_FILE}.sha256"
if [ -f "$CHECKSUM_FILE" ]; then
    echo ""
    echo "🔐 Проверка целостности архива..."
    if sha256sum -c "$CHECKSUM_FILE"; then
        echo "✅ Архив не поврежден"
    else
        echo "❌ Архив поврежден!"
        exit 1
    fi
else
    echo "⚠️ Файл checksum не найден, пропускаем проверку"
fi

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

# Распаковываем архив
echo ""
echo "📦 Распаковка архива..."
tar -xzf "$ARCHIVE_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Архив распакован"
else
    echo "❌ Ошибка при распаковке архива!"
    exit 1
fi

# Переходим в директорию развертывания
DEPLOYMENT_DIR="deployment_package"
if [ -d "$DEPLOYMENT_DIR" ]; then
    cd "$DEPLOYMENT_DIR"
    echo "✅ Перешли в директорию развертывания"
else
    echo "❌ Директория развертывания не найдена!"
    exit 1
fi

# Запускаем восстановление базы данных
echo ""
echo "🔄 Запуск восстановления базы данных..."
./restore_database.sh

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 ПОЛНОЕ РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
    echo ""
    echo "📋 Результат развертывания:"
    echo "  - Docker установлен и настроен"
    echo "  - Архив распакован"
    echo "  - База данных восстановлена"
    echo "  - Все сервисы запущены"
    echo ""
    
    SERVER_IP=$(curl -s ifconfig.me || echo "YOUR_SERVER_IP")
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
    echo "  - Просмотр статуса: docker ps"
    echo "  - Просмотр логов: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env logs"
    echo "  - Перезапуск сервисов: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart"
    echo "  - Остановка сервисов: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down"
    echo ""
    echo "🔄 Для обновления кода в будущем:"
    echo "  - Скопируйте новый архив"
    echo "  - Запустите: ./update_server.sh"
else
    echo ""
    echo "❌ ОШИБКА ПРИ РАЗВЕРТЫВАНИИ!"
    echo "   Проверьте логи выше для диагностики проблемы"
    exit 1
fi
