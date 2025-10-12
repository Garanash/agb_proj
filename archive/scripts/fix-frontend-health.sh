#!/bin/bash

# 🔧 AGB Project - Исправление health check фронтенда
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

echo "🔧 Исправление health check фронтенда"
echo "====================================="

# Проверяем статус контейнеров
log_info "Проверяем статус контейнеров..."
docker-compose ps

echo ""

# Останавливаем проблемный контейнер
log_info "Останавливаем проблемный контейнер frontend..."
docker-compose stop frontend

# Удаляем контейнер
log_info "Удаляем контейнер frontend..."
docker-compose rm -f frontend

# Пересобираем только фронтенд
log_info "Пересобираем фронтенд..."
docker-compose build --no-cache frontend

# Запускаем фронтенд
log_info "Запускаем фронтенд..."
docker-compose up -d frontend

# Ждем запуска
log_info "Ожидаем запуска фронтенда (30 секунд)..."
sleep 30

# Проверяем статус
log_info "Проверяем статус контейнеров..."
docker-compose ps

echo ""

# Проверяем логи фронтенда
log_info "Проверяем логи фронтенда..."
docker-compose logs --tail=20 frontend

echo ""

# Проверяем доступность
log_info "Проверяем доступность фронтенда..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_success "Frontend: ✅ Работает (http://localhost:3000)"
else
    log_warning "Frontend: ⚠️  Недоступен"
fi

# Проверяем через nginx
if curl -f http://localhost > /dev/null 2>&1; then
    log_success "Nginx: ✅ Работает (http://localhost)"
else
    log_warning "Nginx: ⚠️  Недоступен"
fi

echo ""
log_success "Исправление завершено!"
echo ""
echo "🌐 Приложение доступно по адресу:"
echo "   • Главная страница: http://localhost"
echo "   • Frontend (прямой): http://localhost:3000"
echo ""
echo "🔧 Управление:"
echo "   • Статус: docker-compose ps"
echo "   • Логи: docker-compose logs -f frontend"
echo "   • Перезапуск: docker-compose restart frontend"
