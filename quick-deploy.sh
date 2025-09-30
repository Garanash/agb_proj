#!/bin/bash
set -e

# 🚀 AGB Project - Скрипт быстрого деплоя на сервер
# Использование: ./quick-deploy.sh [domain] [admin_password]

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Проверка аргументов
DOMAIN=${1:-"localhost"}
ADMIN_PASSWORD=${2:-"admin123"}

log "🚀 Начинаем деплой AGB проекта на домен: $DOMAIN"

# Проверка зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен. Установите Docker и попробуйте снова."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    fi
    
    log "✅ Все зависимости установлены"
}

# Создание production.env
create_production_env() {
    log "Создание production.env..."
    
    # Генерируем случайный секретный ключ
    SECRET_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    # Генерируем случайный пароль для БД
    DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
    
    cat > config/env/production.env << EOF
# Production Environment Variables
# Database
POSTGRES_DB=agb_felix_prod
POSTGRES_USER=felix_prod_user
POSTGRES_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql+asyncpg://felix_prod_user:$DB_PASSWORD@postgres:5432/agb_felix_prod

# JWT Security
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Application Settings
DEBUG=false
ENVIRONMENT=production
AUTO_INIT_DATA=true

# Admin User
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_EMAIL=admin@$DOMAIN
ADMIN_FIRST_NAME=Администратор
ADMIN_LAST_NAME=Системы

# Frontend API URL
NEXT_PUBLIC_API_URL=https://$DOMAIN/api

# CORS Settings
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN
CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN

# File Upload Settings
MAX_UPLOAD_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,doc,docx,xls,xlsx,png,jpg,jpeg,gif

# Logging
LOG_LEVEL=WARNING
LOG_FILE=/app/logs/agb_prod.log

# Security
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=Lax

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60

# Backup Settings
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 4 * * *
BACKUP_RETENTION_DAYS=30

# n8n Settings
N8N_HOST=$DOMAIN
N8N_PROTOCOL=https
N8N_WEBHOOK_URL=https://$DOMAIN/n8n
N8N_DB_NAME=n8n_prod
N8N_DB_USER=n8n_prod_user
N8N_DB_PASSWORD=$DB_PASSWORD
N8N_USER=admin
N8N_PASSWORD=$ADMIN_PASSWORD
N8N_LOG_LEVEL=info

# Nginx Settings
NGINX_PORT=80
NGINX_SSL_PORT=443
EOF

    log "✅ production.env создан"
}

# Остановка существующих контейнеров
stop_existing() {
    log "Остановка существующих контейнеров..."
    
    docker-compose -f config/docker/docker-compose.prod.yml down 2>/dev/null || true
    
    log "✅ Существующие контейнеры остановлены"
}

# Сборка и запуск
build_and_start() {
    log "Сборка и запуск сервисов..."
    
    docker-compose -f config/docker/docker-compose.prod.yml up -d --build
    
    log "✅ Сервисы запущены"
}

# Проверка здоровья
check_health() {
    log "Проверка здоровья сервисов..."
    
    # Ждем запуска сервисов
    sleep 30
    
    # Проверяем каждый сервис
    local services=("postgres" "backend" "frontend" "nginx")
    for service in "${services[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$service"; then
            log "✅ $service: запущен"
        else
            warn "❌ $service: не запущен"
        fi
    done
}

# Показать информацию о доступе
show_access_info() {
    log "🎉 Деплой завершен!"
    echo ""
    echo "🌐 Доступ к системе:"
    echo "   Frontend: https://$DOMAIN"
    echo "   API: https://$DOMAIN/api"
    echo "   API Docs: https://$DOMAIN/api/docs"
    echo "   n8n: https://$DOMAIN/n8n"
    echo ""
    echo "👤 Учетные данные:"
    echo "   Администратор: admin / $ADMIN_PASSWORD"
    echo ""
    echo "📊 Статус сервисов:"
    docker-compose -f config/docker/docker-compose.prod.yml ps
    echo ""
    echo "📋 Полезные команды:"
    echo "   Статус: docker-compose -f config/docker/docker-compose.prod.yml ps"
    echo "   Логи: docker-compose -f config/docker/docker-compose.prod.yml logs -f"
    echo "   Остановка: docker-compose -f config/docker/docker-compose.prod.yml down"
    echo "   Перезапуск: docker-compose -f config/docker/docker-compose.prod.yml restart"
}

# Главная функция
main() {
    check_dependencies
    create_production_env
    stop_existing
    build_and_start
    check_health
    show_access_info
}

# Запуск
main "$@"
