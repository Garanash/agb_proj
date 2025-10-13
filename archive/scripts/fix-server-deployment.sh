#!/bin/bash

# 🚀 AGB Project - Полное исправление развертывания на сервере
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

echo "🚀 AGB Project - Полное исправление развертывания"
echo "================================================"

# 1. Обновляем код
log_info "Обновляем код с GitHub..."
git pull origin master

# 2. Останавливаем все контейнеры
log_info "Останавливаем все контейнеры..."
docker-compose down -v

# 3. Очищаем Docker
log_info "Очищаем Docker..."
docker system prune -f

# 4. Пересобираем все сервисы поэтапно
log_info "Начинаем поэтапную пересборку..."

# PostgreSQL
log_info "Сборка PostgreSQL..."
docker-compose build postgres
docker-compose up -d postgres
log_info "Ожидаем готовности PostgreSQL (30 сек)..."
sleep 30

# Redis
log_info "Сборка Redis..."
docker-compose build redis
docker-compose up -d redis
log_info "Ожидаем готовности Redis (15 сек)..."
sleep 15

# Backend
log_info "Сборка Backend..."
docker-compose build backend
docker-compose up -d backend
log_info "Ожидаем готовности Backend (60 сек)..."
sleep 60

# Frontend
log_info "Сборка Frontend..."
docker-compose build --no-cache frontend
docker-compose up -d frontend
log_info "Ожидаем готовности Frontend (120 сек)..."
sleep 120

# Nginx
log_info "Сборка Nginx..."
docker-compose build nginx
docker-compose up -d nginx
log_info "Ожидаем готовности Nginx (30 сек)..."
sleep 30

# 5. Проверяем статус
log_info "Проверяем статус всех сервисов..."
echo ""
echo "📊 Статус контейнеров:"
docker-compose ps

echo ""
echo "🔍 Проверка доступности сервисов:"

# Проверка PostgreSQL
if docker-compose exec -T postgres pg_isready -U felix_prod_user -d agb_felix_prod > /dev/null 2>&1; then
    log_success "PostgreSQL: ✅ Работает"
else
    log_warning "PostgreSQL: ⚠️  Недоступен"
fi

# Проверка Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    log_success "Redis: ✅ Работает"
else
    log_warning "Redis: ⚠️  Недоступен"
fi

# Проверка Backend
if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    log_success "Backend: ✅ Работает (http://localhost:8000)"
else
    log_warning "Backend: ⚠️  Недоступен"
fi

# Проверка Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    log_success "Frontend: ✅ Работает (http://localhost:3000)"
else
    log_warning "Frontend: ⚠️  Недоступен"
fi

# Проверка Nginx
if curl -f http://localhost > /dev/null 2>&1; then
    log_success "Nginx: ✅ Работает (http://localhost)"
else
    log_warning "Nginx: ⚠️  Недоступен"
fi

echo ""
echo "🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
echo "=================================="
echo ""
echo "🌐 Доступ к приложению:"
echo "   • Главная страница: http://localhost"
echo "   • API: http://localhost/api"
echo "   • Backend (прямой): http://localhost:8000"
echo "   • Frontend (прямой): http://localhost:3000"
echo ""
echo "👤 Данные для входа:"
echo "   • Логин: admin"
echo "   • Пароль: $(grep ADMIN_PASSWORD config/env/production.env | cut -d'=' -f2)"
echo ""
echo "🔧 Управление:"
echo "   • Статус: docker-compose ps"
echo "   • Логи: docker-compose logs -f"
echo "   • Остановка: docker-compose down"
echo "   • Перезапуск: docker-compose restart"
echo ""

# Показываем логи если есть проблемы
if ! curl -f http://localhost > /dev/null 2>&1; then
    echo ""
    log_warning "Есть проблемы с доступностью. Проверяем логи..."
    echo ""
    echo "📋 Логи фронтенда:"
    docker-compose logs --tail=10 frontend
    echo ""
    echo "📋 Логи nginx:"
    docker-compose logs --tail=10 nginx
fi

log_success "Развертывание завершено!"
