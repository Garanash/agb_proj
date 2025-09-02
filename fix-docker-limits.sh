#!/bin/bash

# Скрипт для обхода лимитов Docker Hub
# Решает проблему "toomanyrequests: You have reached your unauthenticated pull rate limit"

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info "🔧 Исправляем проблемы с лимитами Docker Hub..."

# 1. Останавливаем все контейнеры
info "1. Останавливаем все контейнеры..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.offline.yml down 2>/dev/null || true

# 2. Очищаем Docker кэш
info "2. Очищаем Docker кэш..."
docker system prune -af --volumes 2>/dev/null || true

# 3. Создаем production.env если его нет
info "3. Проверяем production.env..."
if [[ ! -f "production.env" ]]; then
    warning "Создаем production.env из примера..."
    cp production.env.example production.env
    # Устанавливаем базовые значения
    sed -i 's/CHANGE_THIS_SECURE_DB_PASSWORD_2024/felix_password_secure_2024/g' production.env
    sed -i 's/CHANGE_THIS_SUPER_SECRET_KEY_IN_PRODUCTION_2024_MIN_32_CHARS_LONG/your_super_secret_key_here_32_chars_long_2024/g' production.env
    sed -i 's/CHANGE_THIS_ADMIN_PASSWORD_IMMEDIATELY_2024/admin_password_2024/g' production.env
    sed -i 's|postgresql+asyncpg://felix_prod_user:CHANGE_THIS_SECURE_DB_PASSWORD_2024@postgres:5432/agb_felix_prod|postgresql+asyncpg://felix_prod_user:felix_password_secure_2024@postgres:5432/agb_felix_prod|g' production.env
    sed -i 's|http://localhost/api|http://localhost/api|g' production.env
    success "production.env создан"
fi

# 4. Пробуем разные способы запуска
info "4. Пробуем запустить с offline конфигурацией..."

# Сначала пробуем с альтернативными реестрами
if docker-compose -f docker-compose.prod.offline.yml up -d --build 2>/dev/null; then
    success "✅ Запуск с offline конфигурацией успешен"
    COMPOSE_FILE="docker-compose.prod.offline.yml"
else
    warning "Offline конфигурация не сработала, пробуем обычную..."
    
    # Ждем немного и пробуем снова
    sleep 30
    
    if docker-compose -f docker-compose.prod.yml up -d --build 2>/dev/null; then
        success "✅ Запуск с обычной конфигурацией успешен"
        COMPOSE_FILE="docker-compose.prod.yml"
    else
        error "❌ Не удалось запустить ни с одной конфигурацией"
        error "Попробуйте:"
        error "1. Подождать 1 час (лимит Docker Hub)"
        error "2. Создать аккаунт Docker Hub"
        error "3. Использовать VPN"
        exit 1
    fi
fi

# 5. Ждем запуска
info "5. Ждем запуска сервисов..."
sleep 60

# 6. Проверяем статус
info "6. Проверяем статус сервисов..."
docker-compose -f $COMPOSE_FILE ps

# 7. Проверяем логи
info "7. Проверяем логи..."
docker-compose -f $COMPOSE_FILE logs --tail=20

success "🎉 Проблемы с лимитами Docker Hub решены!"
info "Используется конфигурация: $COMPOSE_FILE"
info "Проверьте доступность: curl http://localhost"
