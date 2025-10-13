#!/bin/bash

# 🚀 AGB Project - Универсальный запуск продакшн среды одной командой
# Автор: AI Assistant
# Версия: 2.0

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🚀 AGB Project - Универсальный запуск продакшн среды"
echo "=================================================="

# Получаем IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
log_info "Шаг 1: Проверка системных требований"
echo "-----------------------------------"

# Проверяем Docker
if ! command -v docker >/dev/null 2>&1; then
    log_error "Docker не установлен. Установите Docker для продолжения."
    exit 1
fi

# Проверяем Docker Compose
if ! command -v docker-compose >/dev/null 2>&1; then
    log_error "Docker Compose не установлен. Установите Docker Compose для продолжения."
    exit 1
fi

log_success "Все системные требования выполнены"

echo ""
log_info "Шаг 2: Создание конфигурации"
echo "-----------------------------"

# Создаем директории если их нет
mkdir -p scripts/setup
mkdir -p config/env

# Создаем скрипт инициализации БД если его нет
if [ ! -f "scripts/setup/init-production-db.sh" ]; then
    log_info "Создание скрипта инициализации БД..."
    cat > scripts/setup/init-production-db.sh << 'EOF'
#!/bin/bash
set -e
echo "🔧 Инициализация базы данных для продакшн..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
    GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;
EOSQL
echo "✅ Инициализация базы данных завершена!"
EOF
    chmod +x scripts/setup/init-production-db.sh
fi

# Создаем production.env если его нет
if [ ! -f "config/env/production.env" ]; then
    log_info "Создание файла переменных окружения..."
    
    # Генерируем случайные пароли
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    SECRET_KEY=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)
    
    cat > config/env/production.env << EOF
# База данных PostgreSQL
POSTGRES_DB=agb_felix_prod
POSTGRES_USER=felix_prod_user
POSTGRES_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://felix_prod_user:$DB_PASSWORD@postgres:5432/agb_felix_prod

# Безопасность
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Администратор системы
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_EMAIL=admin@$SERVER_IP
ADMIN_FIRST_NAME=Администратор
ADMIN_LAST_NAME=Системы

# API конфигурация
NEXT_PUBLIC_API_URL=http://$SERVER_IP/api

# Nginx
NGINX_PORT=80
NGINX_SSL_PORT=443

# Redis
REDIS_URL=redis://redis:6379/0

# Логирование
LOG_LEVEL=INFO
LOG_FILE=backend.log

# Файлы
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=xlsx,xls,pdf,doc,docx,txt,jpg,jpeg,png

# Мониторинг
ENABLE_METRICS=true
METRICS_PORT=9090
EOF
    
    log_success "Файл config/env/production.env создан"
    log_warning "Сохраните пароли:"
    echo "   • Пароль БД: $DB_PASSWORD"
    echo "   • Пароль админа: $ADMIN_PASSWORD"
    echo "   • SECRET_KEY: $SECRET_KEY"
else
    log_success "Файл config/env/production.env уже существует"
fi

echo ""
log_info "Шаг 3: Очистка и подготовка"
echo "-----------------------------"

# Останавливаем все контейнеры и очищаем volumes
log_info "Остановка существующих контейнеров..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down -v 2>/dev/null || true

# Очищаем Docker сети
log_info "Очистка Docker сетей..."
docker network prune -f 2>/dev/null || true

echo ""
log_info "Шаг 4: Запуск всех сервисов"
echo "----------------------------"

# Запускаем все сервисы одной командой
log_info "Запуск всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d

echo ""
log_info "Шаг 5: Ожидание готовности сервисов"
echo "------------------------------------"

# Ждем готовности сервисов
log_info "Ожидание готовности сервисов (180 секунд)..."
sleep 180

echo ""
log_info "Шаг 6: Проверка статуса"
echo "------------------------"

# Проверяем статус всех контейнеров
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

echo ""
log_info "Шаг 7: Проверка доступности"
echo "---------------------------"

# Проверяем доступность сервисов
check_service() {
    local url=$1
    local service=$2
    if curl -s --connect-timeout 10 "$url" > /dev/null; then
        log_success "$service доступен: $url"
    else
        log_error "$service недоступен: $url"
    fi
}

check_service "http://localhost" "Frontend (через nginx)"
check_service "http://localhost:8000/docs" "Backend API"
check_service "http://localhost/api/health" "Backend Health"

echo ""
log_success "🎉 Продакшн среда успешно запущена!"
echo ""
echo "📋 Доступные сервисы:"
echo "• Главная страница: http://localhost"
echo "• Backend API: http://localhost:8000"
echo "• Swagger UI: http://localhost:8000/docs"
echo "• Health Check: http://localhost/api/health"
echo ""
echo "📋 Учетные данные администратора:"
echo "• Логин: admin"
echo "• Пароль: $(grep ADMIN_PASSWORD config/env/production.env | cut -d'=' -f2)"
echo ""
echo "🔧 Управление сервисами:"
echo "• Остановить: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down"
echo "• Перезапустить: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart"
echo "• Логи: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env logs -f"
echo ""
echo "📋 Мониторинг:"
echo "• Статус контейнеров: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps"
echo "• Логи всех сервисов: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env logs"
echo "• Логи конкретного сервиса: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env logs -f [service_name]"
