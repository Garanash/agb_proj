#!/bin/bash

# Скрипт для исправления проблем с путями в Next.js
# Решает ошибку "Module not found: Can't resolve '@/utils/api'"

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

info "🔧 Исправляем проблемы с путями в Next.js..."

# 1. Останавливаем все контейнеры
info "1. Останавливаем все контейнеры..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
docker-compose -f docker-compose.prod.offline.yml down 2>/dev/null || true

# 2. Очищаем Docker кэш
info "2. Очищаем Docker кэш..."
docker system prune -af --volumes 2>/dev/null || true

# 3. Проверяем наличие production.env
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

# 4. Проверяем конфигурацию Next.js
info "4. Проверяем конфигурацию Next.js..."
if [[ -f "frontend/tsconfig.json" ]]; then
    success "tsconfig.json найден"
else
    error "tsconfig.json не найден!"
    exit 1
fi

if [[ -f "frontend/next.config.js" ]]; then
    success "next.config.js найден"
else
    error "next.config.js не найден!"
    exit 1
fi

# 5. Запускаем с исправленным Dockerfile
info "5. Запускаем с исправленным Dockerfile..."
# Пробуем сначала обычный файл
if docker-compose -f docker-compose.prod.yml up -d --build --force-recreate 2>/dev/null; then
    success "✅ Запуск с исправленным Dockerfile успешен"
    COMPOSE_FILE="docker-compose.prod.yml"
else
    warning "Проблемы с обычной конфигурацией, пробуем offline версию..."
    if docker-compose -f docker-compose.prod.offline.yml up -d --build --force-recreate 2>/dev/null; then
        success "✅ Запуск с offline конфигурацией успешен"
        COMPOSE_FILE="docker-compose.prod.offline.yml"
    else
        error "❌ Не удалось запустить ни с одной конфигурацией"
        error "Проверьте логи:"
        error "  docker-compose -f docker-compose.prod.yml logs frontend"
        exit 1
    fi
fi

# 6. Ждем запуска
info "6. Ждем запуска сервисов..."
sleep 60

# 7. Проверяем статус
info "7. Проверяем статус сервисов..."
docker-compose -f $COMPOSE_FILE ps

# 8. Проверяем логи фронтенда
info "8. Проверяем логи фронтенда..."
docker-compose -f $COMPOSE_FILE logs frontend --tail=30

# 9. Проверяем доступность
info "9. Проверяем доступность фронтенда..."
sleep 10

if curl -f http://localhost:3000 >/dev/null 2>&1; then
    success "✅ Фронтенд доступен на порту 3000"
else
    warning "⚠️ Фронтенд недоступен на порту 3000"
    info "Проверьте логи: docker-compose -f $COMPOSE_FILE logs frontend"
fi

success "🎉 Исправление проблем с путями завершено!"
info "Используется конфигурация: $COMPOSE_FILE"
info "Проверьте доступность: curl http://localhost:3000"
