#!/bin/bash

# 🚀 AGB Project - Локальная разработка
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

echo "🚀 AGB Project - Локальная разработка"
echo "===================================="

# 1. Останавливаем все контейнеры
log_info "Останавливаем все контейнеры..."
docker-compose down 2>/dev/null || true

# 2. Запускаем только БД и Redis
log_info "Запускаем PostgreSQL и Redis..."
docker-compose -f docker-compose.local.yml up -d

# 3. Ждем готовности БД
log_info "Ожидаем готовности PostgreSQL (30 секунд)..."
sleep 30

# 4. Проверяем статус
log_info "Проверяем статус контейнеров..."
docker-compose -f docker-compose.local.yml ps

# 5. Проверяем подключение к БД
log_info "Проверяем подключение к PostgreSQL..."
if docker-compose -f docker-compose.local.yml exec -T postgres pg_isready -U agb_user -d agb_prod > /dev/null 2>&1; then
    log_success "PostgreSQL: ✅ Доступен"
else
    log_error "PostgreSQL: ❌ Недоступен"
fi

# 6. Проверяем подключение к Redis
log_info "Проверяем подключение к Redis..."
if docker-compose -f docker-compose.local.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    log_success "Redis: ✅ Доступен"
else
    log_error "Redis: ❌ Недоступен"
fi

echo ""
log_success "Локальная разработка настроена!"
echo ""
echo "📋 Информация для подключения:"
echo "   • PostgreSQL: localhost:5432"
echo "   • База данных: agb_prod"
echo "   • Пользователь: agb_user"
echo "   • Пароль: secure_password_2024"
echo ""
echo "   • Redis: localhost:6379"
echo ""
echo "🔧 Следующие шаги:"
echo "   1. Установите зависимости бекенда:"
echo "      cd backend && pip install -r requirements.txt"
echo ""
echo "   2. Запустите бекенд:"
echo "      cd backend && python main.py"
echo ""
echo "   3. Установите зависимости фронтенда:"
echo "      cd frontend && npm install"
echo ""
echo "   4. Запустите фронтенд:"
echo "      cd frontend && npm run dev"
echo ""
echo "🌐 После запуска приложение будет доступно:"
echo "   • Фронтенд: http://localhost:3000"
echo "   • Бекенд: http://localhost:8000"
echo ""
echo "🛑 Для остановки БД и Redis:"
echo "   docker-compose -f docker-compose.local.yml down"
