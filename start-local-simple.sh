#!/bin/bash

echo "=== УПРОЩЕННАЯ ЛОКАЛЬНАЯ РАЗРАБОТКА В DOCKER ==="
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка Docker
print_status "Проверка Docker..."
if ! docker --version >/dev/null 2>&1; then
    print_error "Docker не запущен. Запустите Docker Desktop и попробуйте снова."
    exit 1
fi

# Остановка всех процессов
print_status "Остановка локальных процессов..."
pkill -f uvicorn 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Очистка портов
print_status "Освобождение портов..."
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:15432 | xargs kill -9 2>/dev/null || true

# Остановка старых контейнеров
print_status "Остановка старых контейнеров..."
docker stop agb_postgres_local agb_redis_local agb_backend_local agb_frontend_local agb_nginx_local 2>/dev/null || true
docker rm agb_postgres_local agb_redis_local agb_backend_local agb_frontend_local agb_nginx_local 2>/dev/null || true

# Запуск только PostgreSQL и Redis
print_status "Запуск PostgreSQL и Redis..."
docker run -d --name agb_postgres_local \
    -e POSTGRES_DB=agb_felix_dev \
    -e POSTGRES_USER=felix_dev_user \
    -e POSTGRES_PASSWORD=dev_password_123 \
    -p 15432:5432 \
    postgres:15-alpine

docker run -d --name agb_redis_local \
    -p 16379:6379 \
    redis:7-alpine

# Ожидание запуска БД
print_status "Ожидание запуска PostgreSQL..."
sleep 15

# Проверка PostgreSQL
if docker exec agb_postgres_local pg_isready -U felix_dev_user -d agb_felix_dev >/dev/null 2>&1; then
    print_success "PostgreSQL: ✅ Запущен"
else
    print_error "PostgreSQL: ❌ Не запущен"
    exit 1
fi

# Проверка Redis
if docker exec agb_redis_local redis-cli ping >/dev/null 2>&1; then
    print_success "Redis: ✅ Запущен"
else
    print_error "Redis: ❌ Не запущен"
    exit 1
fi

# Запуск backend локально
print_status "Запуск backend локально..."
cd backend
DATABASE_URL="postgresql://felix_dev_user:dev_password_123@localhost:15432/agb_felix_dev" python3 -c "
from database import async_engine, Base
from models import *
import asyncio

async def create_tables():
    try:
        print('Создание таблиц...')
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print('✅ Таблицы созданы')
    except Exception as e:
        print(f'❌ Ошибка: {e}')

asyncio.run(create_tables())
"

DATABASE_URL="postgresql://felix_dev_user:dev_password_123@localhost:15432/agb_felix_dev" python3 scripts/create_admin.py

DATABASE_URL="postgresql://felix_dev_user:dev_password_123@localhost:15432/agb_felix_dev" python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Запуск frontend локально
print_status "Запуск frontend локально..."
cd ../frontend
NEXT_PUBLIC_API_URL="http://localhost:8000" npm run dev &
FRONTEND_PID=$!

# Ожидание запуска
print_status "Ожидание запуска сервисов (30 секунд)..."
sleep 30

# Проверка сервисов
print_status "Проверка сервисов..."

# Backend
if curl -s http://localhost:8000/api/health | grep -q "healthy"; then
    print_success "Backend: ✅ Работает"
else
    print_error "Backend: ❌ Не работает"
fi

# Frontend
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    print_success "Frontend: ✅ Работает"
else
    print_error "Frontend: ❌ Не работает"
fi

# Тест логина
print_status "Тест логина..."
LOGIN_RESPONSE=$(curl -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}' \
    -s 2>/dev/null)

if [[ "$LOGIN_RESPONSE" == *"access_token"* ]]; then
    print_success "Login: ✅ Работает"
else
    print_error "Login: ❌ Не работает"
fi

echo ""
print_success "=== ЛОКАЛЬНАЯ РАЗРАБОТКА ЗАПУЩЕНА ==="
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🌐 Backend: http://localhost:8000"
echo "🌐 Database: localhost:15432"
echo "🔧 Логин: admin / admin123"
echo ""
echo "📋 Для остановки выполните:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  docker stop agb_postgres_local agb_redis_local"
echo "  docker rm agb_postgres_local agb_redis_local"
