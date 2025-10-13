#!/bin/bash

# 🔧 AGB Project - Исправление проблем бекенда
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

echo "🔧 AGB Project - Исправление проблем бекенда"
echo "==========================================="

# 1. Останавливаем бекенд
log_info "Останавливаем бекенд..."
docker-compose stop backend

# 2. Удаляем контейнер бекенда
log_info "Удаляем контейнер бекенда..."
docker-compose rm -f backend

# 3. Пересобираем бекенд
log_info "Пересобираем бекенд..."
docker-compose build --no-cache backend

# 4. Запускаем бекенд
log_info "Запускаем бекенд..."
docker-compose up -d backend

# 5. Ждем запуска
log_info "Ожидаем запуска бекенда (60 секунд)..."
sleep 60

# 6. Проверяем статус
log_info "Проверяем статус бекенда..."
docker-compose ps backend

# 7. Проверяем логи
log_info "Проверяем логи бекенда..."
echo "Последние 20 строк логов:"
docker-compose logs --tail=20 backend

# 8. Проверяем доступность API
log_info "Проверяем доступность API..."
sleep 10

if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    log_success "API Health: ✅ Доступен"
    echo "Ответ API:"
    curl -s http://localhost:8000/api/health
else
    log_error "API Health: ❌ Недоступен"
    echo ""
    log_warning "Проверяем подробные логи..."
    docker-compose logs --tail=50 backend
fi

# 9. Проверяем подключение к БД
log_info "Проверяем подключение к базе данных..."
if docker-compose exec -T postgres pg_isready -U felix_prod_user -d agb_felix_prod > /dev/null 2>&1; then
    log_success "PostgreSQL: ✅ Доступен"
else
    log_error "PostgreSQL: ❌ Недоступен"
fi

echo ""
log_success "Исправление бекенда завершено!"

if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    echo ""
    echo "🎉 Бекенд работает!"
    echo "🌐 API доступен по адресу: http://localhost:8000"
else
    echo ""
    log_warning "Бекенд может иметь проблемы. Проверьте логи:"
    echo "docker-compose logs -f backend"
fi
