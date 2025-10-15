#!/bin/bash

echo "=== ЛОКАЛЬНАЯ РАЗРАБОТКА В DOCKER ==="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода с цветом
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Остановка всех процессов
print_status "Остановка локальных процессов..."
pkill -f uvicorn 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
docker stop agb_postgres_local 2>/dev/null || true

# Очистка старых контейнеров
print_status "Очистка старых контейнеров..."
docker-compose -f docker-compose.local.yml down 2>/dev/null || true

# Запуск сервисов
print_status "Запуск сервисов в Docker..."
docker-compose -f docker-compose.local.yml up -d

# Ожидание запуска
print_status "Ожидание запуска сервисов (60 секунд)..."
sleep 60

# Проверка статуса контейнеров
print_status "Проверка статуса контейнеров:"
docker ps | grep agb

echo ""

# Проверка health checks
print_status "Проверка health checks:"

# PostgreSQL
if docker exec agb_postgres_local pg_isready -U felix_dev_user -d agb_felix_dev >/dev/null 2>&1; then
    print_success "PostgreSQL: ✅ Healthy"
else
    print_error "PostgreSQL: ❌ Unhealthy"
fi

# Redis
if docker exec agb_redis_local redis-cli ping >/dev/null 2>&1; then
    print_success "Redis: ✅ Healthy"
else
    print_error "Redis: ❌ Unhealthy"
fi

# Backend
BACKEND_HEALTH=$(curl -s http://localhost:8000/api/health 2>/dev/null | grep -o '"status":"healthy"' || echo "")
if [ "$BACKEND_HEALTH" = '"status":"healthy"' ]; then
    print_success "Backend: ✅ Healthy"
else
    print_error "Backend: ❌ Unhealthy"
fi

# Frontend
FRONTEND_RESPONSE=$(curl -s http://localhost:3000 2>/dev/null | head -1 || echo "")
if [[ "$FRONTEND_RESPONSE" == *"<!DOCTYPE html>"* ]]; then
    print_success "Frontend: ✅ Healthy"
else
    print_error "Frontend: ❌ Unhealthy"
fi

# Nginx
NGINX_RESPONSE=$(curl -s http://localhost 2>/dev/null | head -1 || echo "")
if [[ "$NGINX_RESPONSE" == *"<!DOCTYPE html>"* ]]; then
    print_success "Nginx: ✅ Healthy"
else
    print_error "Nginx: ❌ Unhealthy"
fi

echo ""

# Создание таблиц и админа
print_status "Создание таблиц и администратора..."
docker exec agb_backend_local python3 -c "
from database import async_engine, Base
from models import *
import asyncio

async def create_tables():
    try:
        print('Создание таблиц...')
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print('✅ Таблицы созданы успешно')
    except Exception as e:
        print(f'❌ Ошибка создания таблиц: {e}')

asyncio.run(create_tables())
"

docker exec agb_backend_local python3 scripts/create_admin.py

echo ""

# Тест логина
print_status "Тест логина:"
LOGIN_RESPONSE=$(curl -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}' \
    -s 2>/dev/null)

if [[ "$LOGIN_RESPONSE" == *"access_token"* ]]; then
    print_success "Login: ✅ Работает"
else
    print_error "Login: ❌ Не работает"
    echo "Response: $LOGIN_RESPONSE"
fi

echo ""

# Финальная проверка
print_status "Финальная проверка приложения:"

echo "🌐 Frontend: http://localhost:3000"
echo "🌐 Backend: http://localhost:8000"
echo "🌐 Nginx: http://localhost"
echo "🌐 Database: localhost:15432"
echo ""

# Проверка доступности
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    print_success "Frontend доступен по адресу: http://localhost:3000"
fi

if curl -s http://localhost:8000/api/health >/dev/null 2>&1; then
    print_success "Backend доступен по адресу: http://localhost:8000"
fi

if curl -s http://localhost >/dev/null 2>&1; then
    print_success "Nginx доступен по адресу: http://localhost"
fi

echo ""
print_success "=== ЛОКАЛЬНАЯ РАЗРАБОТКА В DOCKER ЗАПУЩЕНА ==="
echo ""
echo "📋 Полезные команды:"
echo "  docker-compose -f docker-compose.local.yml logs -f [service]  # Логи сервиса"
echo "  docker-compose -f docker-compose.local.yml restart [service]  # Перезапуск сервиса"
echo "  docker-compose -f docker-compose.local.yml down               # Остановка всех сервисов"
echo "  docker-compose -f docker-compose.local.yml up -d              # Запуск всех сервисов"
echo ""
echo "🔧 Логин: admin / admin123"
