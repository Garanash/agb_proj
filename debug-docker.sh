#!/bin/bash

# Скрипт для диагностики проблем с Docker
# Подключается к контейнерам и проверяет их состояние

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

info "🔍 Диагностика Docker контейнеров..."

# 1. Проверяем статус всех контейнеров
info "1. Статус всех контейнеров:"
docker ps -a

echo ""

# 2. Проверяем логи всех сервисов
info "2. Логи всех сервисов:"
docker-compose -f docker-compose.prod.yml logs --tail=50

echo ""

# 3. Проверяем переменные окружения
info "3. Переменные окружения в контейнерах:"

# Проверяем backend
if docker ps | grep -q "agb_backend_prod"; then
    info "Backend переменные:"
    docker exec agb_backend_prod env | grep -E "(DATABASE_URL|SECRET_KEY|NEXT_PUBLIC_API_URL)" || echo "Переменные не найдены"
else
    warning "Backend контейнер не запущен"
fi

# Проверяем frontend
if docker ps | grep -q "agb_frontend_prod"; then
    info "Frontend переменные:"
    docker exec agb_frontend_prod env | grep -E "(NEXT_PUBLIC_API_URL|NODE_ENV)" || echo "Переменные не найдены"
else
    warning "Frontend контейнер не запущен"
fi

echo ""

# 4. Проверяем файл production.env
info "4. Содержимое production.env:"
if [[ -f "production.env" ]]; then
    cat production.env | grep -E "(DATABASE_URL|NEXT_PUBLIC_API_URL|POSTGRES_PASSWORD)" || echo "Ключевые переменные не найдены"
else
    error "Файл production.env не найден!"
fi

echo ""

# 5. Проверяем доступность сервисов
info "5. Проверка доступности сервисов:"

# Проверяем фронтенд
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    success "✅ Фронтенд доступен на порту 3000"
else
    warning "⚠️ Фронтенд недоступен на порту 3000"
fi

# Проверяем бекенд
if curl -f http://localhost:8000/api/health >/dev/null 2>&1; then
    success "✅ Бекенд доступен на порту 8000"
else
    warning "⚠️ Бекенд недоступен на порту 8000"
fi

# Проверяем Nginx
if curl -f http://localhost >/dev/null 2>&1; then
    success "✅ Nginx доступен на порту 80"
else
    warning "⚠️ Nginx недоступен на порту 80"
fi

echo ""

# 6. Команды для подключения к контейнерам
info "6. Команды для подключения к контейнерам:"
echo ""
echo "Для подключения к контейнерам используйте:"
echo ""
echo "🔧 Backend (FastAPI):"
echo "   docker exec -it agb_backend_prod /bin/bash"
echo "   docker exec -it agb_backend_prod /bin/sh"
echo ""
echo "🌐 Frontend (Next.js):"
echo "   docker exec -it agb_frontend_prod /bin/sh"
echo ""
echo "🗄️ PostgreSQL:"
echo "   docker exec -it agb_postgres_prod psql -U felix_prod_user -d agb_felix_prod"
echo ""
echo "🌍 Nginx:"
echo "   docker exec -it agb_nginx_prod /bin/sh"
echo ""

# 7. Полезные команды для диагностики
info "7. Полезные команды для диагностики:"
echo ""
echo "📊 Мониторинг в реальном времени:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🔄 Перезапуск сервиса:"
echo "   docker-compose -f docker-compose.prod.yml restart frontend"
echo "   docker-compose -f docker-compose.prod.yml restart backend"
echo ""
echo "🗑️ Полная очистка и перезапуск:"
echo "   docker-compose -f docker-compose.prod.yml down"
echo "   docker-compose -f docker-compose.prod.yml up -d --build"
echo ""
echo "💾 Проверка места на диске:"
echo "   df -h"
echo "   docker system df"
echo ""

success "🎉 Диагностика завершена!"
info "Используйте команды выше для подключения к контейнерам и дальнейшей диагностики"
