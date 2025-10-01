#!/bin/bash

# 🔍 AGB Project - Диагностика проблем бекенда
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

echo "🔍 AGB Project - Диагностика проблем бекенда"
echo "==========================================="

# 1. Проверяем статус контейнеров
log_info "Проверяем статус всех контейнеров..."
docker-compose ps

echo ""
log_info "Проверяем статус контейнера backend..."
docker-compose ps backend

# 2. Проверяем логи бекенда
echo ""
log_info "Последние 50 строк логов бекенда:"
echo "====================================="
docker-compose logs --tail=50 backend

# 3. Проверяем подключение к базе данных
echo ""
log_info "Проверяем подключение к PostgreSQL..."
if docker-compose exec -T postgres pg_isready -U felix_prod_user -d agb_felix_prod > /dev/null 2>&1; then
    log_success "PostgreSQL: ✅ Доступен"
else
    log_error "PostgreSQL: ❌ Недоступен"
fi

# 4. Проверяем переменные окружения
echo ""
log_info "Проверяем переменные окружения бекенда..."
docker-compose exec backend env | grep -E "(DATABASE|REDIS|SECRET)" | head -10

# 5. Проверяем доступность API
echo ""
log_info "Проверяем доступность API бекенда..."
if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    log_success "API Health: ✅ Доступен"
    curl -s http://localhost:8000/api/health | head -5
else
    log_error "API Health: ❌ Недоступен"
fi

# 6. Проверяем порты
echo ""
log_info "Проверяем открытые порты..."
netstat -tlnp | grep -E "(8000|5432|6379)" || echo "Порты не найдены"

# 7. Проверяем ресурсы
echo ""
log_info "Проверяем использование ресурсов контейнером backend..."
docker stats --no-stream backend

# 8. Проверяем файлы конфигурации
echo ""
log_info "Проверяем файлы конфигурации..."
if [ -f "config/env/production.env" ]; then
    log_success "production.env: ✅ Найден"
    echo "Первые 10 строк:"
    head -10 config/env/production.env
else
    log_error "production.env: ❌ Не найден"
fi

# 9. Проверяем зависимости
echo ""
log_info "Проверяем зависимости в requirements.txt..."
if [ -f "backend/requirements.txt" ]; then
    log_success "requirements.txt: ✅ Найден"
    echo "Первые 10 зависимостей:"
    head -10 backend/requirements.txt
else
    log_error "requirements.txt: ❌ Не найден"
fi

# 10. Предложения по исправлению
echo ""
log_warning "Возможные решения:"
echo "====================="
echo "1. Перезапустить бекенд:"
echo "   docker-compose restart backend"
echo ""
echo "2. Пересобрать бекенд:"
echo "   docker-compose build --no-cache backend"
echo "   docker-compose up -d backend"
echo ""
echo "3. Проверить логи в реальном времени:"
echo "   docker-compose logs -f backend"
echo ""
echo "4. Зайти в контейнер для отладки:"
echo "   docker-compose exec backend bash"
echo ""
echo "5. Проверить подключение к БД из контейнера:"
echo "   docker-compose exec backend python -c \"import psycopg2; print('DB OK')\""

log_info "Диагностика завершена!"
