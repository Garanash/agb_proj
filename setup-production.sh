#!/bin/bash

# 🚀 AGB Project - Настройка и запуск продакшн среды
# Автор: AI Assistant
# Версия: 1.0

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

echo "🚀 AGB Project - Настройка и запуск продакшн среды"
echo "================================================"

# Получаем IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
log_info "Шаг 1: Проверка системных требований"
echo "-----------------------------------"

# Проверяем Docker
if command -v docker >/dev/null 2>&1; then
    log_success "Docker установлен: $(docker --version)"
else
    log_error "Docker не установлен. Установите Docker для продолжения."
    exit 1
fi

# Проверяем Docker Compose
if command -v docker-compose >/dev/null 2>&1; then
    log_success "Docker Compose установлен: $(docker-compose --version)"
else
    log_error "Docker Compose не установлен. Установите Docker Compose для продолжения."
    exit 1
fi

# Проверяем Python
if command -v python3 >/dev/null 2>&1; then
    log_success "Python3 установлен: $(python3 --version)"
else
    log_error "Python3 не установлен. Установите Python3 для продолжения."
    exit 1
fi

# Проверяем Node.js
if command -v node >/dev/null 2>&1; then
    log_success "Node.js установлен: $(node --version)"
else
    log_error "Node.js не установлен. Установите Node.js для продолжения."
    exit 1
fi

echo ""
log_info "Шаг 2: Создание файла переменных окружения"
echo "------------------------------------------"

# Создаем production.env если его нет
if [ ! -f "config/env/production.env" ]; then
    log_info "Создание config/env/production.env..."
    
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
log_info "Шаг 3: Остановка существующих контейнеров"
echo "------------------------------------------"

# Останавливаем все контейнеры проекта
log_info "Остановка контейнеров..."
docker-compose -f config/docker/docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

echo ""
log_info "Шаг 4: Сборка и запуск сервисов"
echo "--------------------------------"

# Запускаем сервисы
log_info "Запуск PostgreSQL и Redis..."
docker-compose -f config/docker/docker-compose.prod.yml up -d postgres redis

# Ждем готовности БД
log_info "Ожидание готовности PostgreSQL (60 секунд)..."
sleep 60

# Проверяем статус БД
log_info "Проверка статуса PostgreSQL..."
if docker-compose -f config/docker/docker-compose.prod.yml exec -T postgres pg_isready -U felix_prod_user -d agb_felix_prod > /dev/null 2>&1; then
    log_success "PostgreSQL готов"
else
    log_error "PostgreSQL не готов"
    exit 1
fi

# Запускаем backend
log_info "Запуск backend..."
docker-compose -f config/docker/docker-compose.prod.yml up -d backend

# Ждем готовности backend
log_info "Ожидание готовности backend (120 секунд)..."
sleep 120

# Проверяем статус backend
log_info "Проверка статуса backend..."
if curl -s --connect-timeout 10 "http://$SERVER_IP:8000/docs" > /dev/null; then
    log_success "Backend готов"
else
    log_warning "Backend может быть еще не готов, продолжаем..."
fi

# Запускаем frontend
log_info "Запуск frontend..."
docker-compose -f config/docker/docker-compose.prod.yml up -d frontend

# Ждем готовности frontend
log_info "Ожидание готовности frontend (60 секунд)..."
sleep 60

# Запускаем nginx
log_info "Запуск nginx..."
docker-compose -f config/docker/docker-compose.prod.yml up -d nginx

echo ""
log_info "Шаг 5: Проверка статуса всех сервисов"
echo "--------------------------------------"

# Проверяем статус всех контейнеров
docker-compose -f config/docker/docker-compose.prod.yml ps

echo ""
log_info "Шаг 6: Проверка доступности сервисов"
echo "------------------------------------"

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

check_service "http://$SERVER_IP" "Frontend (через nginx)"
check_service "http://$SERVER_IP:8000/docs" "Backend API"
check_service "http://$SERVER_IP/api/health" "Backend Health"

echo ""
log_success "🎉 Продакшн среда успешно настроена и запущена!"
echo ""
echo "📋 Доступные сервисы:"
echo "• Главная страница: http://$SERVER_IP"
echo "• Backend API: http://$SERVER_IP:8000"
echo "• Swagger UI: http://$SERVER_IP:8000/docs"
echo "• Health Check: http://$SERVER_IP/api/health"
echo ""
echo "📋 Учетные данные администратора:"
echo "• Логин: admin"
echo "• Пароль: $(grep ADMIN_PASSWORD config/env/production.env | cut -d'=' -f2)"
echo ""
echo "🔧 Управление сервисами:"
echo "• Остановить: docker-compose -f config/docker/docker-compose.prod.yml down"
echo "• Перезапустить: docker-compose -f config/docker/docker-compose.prod.yml restart"
echo "• Логи: docker-compose -f config/docker/docker-compose.prod.yml logs -f"
echo ""
echo "📋 Мониторинг:"
echo "• Статус контейнеров: docker-compose -f config/docker/docker-compose.prod.yml ps"
echo "• Логи всех сервисов: docker-compose -f config/docker/docker-compose.prod.yml logs"
echo "• Логи конкретного сервиса: docker-compose -f config/docker/docker-compose.prod.yml logs -f [service_name]"
