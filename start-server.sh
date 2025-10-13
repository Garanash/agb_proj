#!/bin/bash

# Скрипт для запуска приложения на сервере
# Использование: ./start-server.sh

set -e

echo "🚀 Запуск AGB приложения на сервере"
echo "=================================="

# Проверяем наличие .env файла
if [ ! -f ".env" ]; then
    echo "❌ Файл .env не найден!"
    echo "   Создайте файл .env на основе .env.production"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env | grep -v '^#' | xargs)

echo "📋 Конфигурация:"
echo "   - База данных: $POSTGRES_DB на $POSTGRES_HOST:$POSTGRES_PORT"
echo "   - Backend: порт 8000"
echo "   - Frontend: порт 3000"
echo ""

# Проверяем Docker сервисы
echo "🐳 Проверка Docker сервисов..."
if ! docker ps | grep -q "agb_postgres_local"; then
    echo "❌ PostgreSQL контейнер не запущен!"
    echo "   Запустите: docker-compose -f docker-compose.local.yml up -d"
    exit 1
fi

if ! docker ps | grep -q "agb_redis_local"; then
    echo "❌ Redis контейнер не запущен!"
    echo "   Запустите: docker-compose -f docker-compose.local.yml up -d"
    exit 1
fi

# Проверяем подключение к базе данных
echo "🗄️  Проверка подключения к базе данных..."
until docker exec agb_postgres_local pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; do
    echo "   Ожидание PostgreSQL..."
    sleep 2
done

# Проверяем подключение к Redis
echo "🔴 Проверка подключения к Redis..."
until docker exec agb_redis_local redis-cli ping 2>/dev/null | grep -q "PONG"; do
    echo "   Ожидание Redis..."
    sleep 2
done

# Останавливаем существующие процессы
echo "🛑 Остановка существующих процессов..."
pkill -f "python.*main.py" || true
pkill -f "next.*dev" || true
sleep 2

# Создаем директории для логов
mkdir -p logs

# Запускаем Backend
echo "🌐 Запуск Backend сервера..."
cd backend
if [ ! -d "venv" ]; then
    echo "📦 Создание виртуального окружения..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

echo "   Backend запускается на порту 8000..."
echo "   Логи: ../logs/backend.log"
python3 main.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Ждем запуска backend
echo "⏳ Ожидание запуска Backend..."
sleep 10

# Проверяем, что backend запустился
BACKEND_TIMEOUT=30
BACKEND_COUNT=0
until curl -f http://localhost:8000/api/health 2>/dev/null; do
    if [ $BACKEND_COUNT -ge $BACKEND_TIMEOUT ]; then
        echo "❌ Backend не запустился в течение $BACKEND_TIMEOUT секунд!"
        echo "   Проверьте логи: tail -f logs/backend.log"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    echo "   Ожидание Backend... ($BACKEND_COUNT/$BACKEND_TIMEOUT)"
    sleep 2
    BACKEND_COUNT=$((BACKEND_COUNT + 2))
done

# Запускаем Frontend
echo "🌐 Запуск Frontend сервера..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

echo "   Frontend запускается на порту 3000..."
echo "   Логи: ../logs/frontend.log"
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Ждем запуска frontend
echo "⏳ Ожидание запуска Frontend..."
sleep 15

# Проверяем, что frontend запустился
FRONTEND_TIMEOUT=60
FRONTEND_COUNT=0
until curl -f http://localhost:3000 2>/dev/null; do
    if [ $FRONTEND_COUNT -ge $FRONTEND_TIMEOUT ]; then
        echo "❌ Frontend не запустился в течение $FRONTEND_TIMEOUT секунд!"
        echo "   Проверьте логи: tail -f logs/frontend.log"
        kill $FRONTEND_PID 2>/dev/null || true
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    echo "   Ожидание Frontend... ($FRONTEND_COUNT/$FRONTEND_TIMEOUT)"
    sleep 3
    FRONTEND_COUNT=$((FRONTEND_COUNT + 3))
done

echo ""
echo "✅ Приложение успешно запущено!"
echo ""
echo "🌐 Доступные сервисы:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:8000/api"
echo "   - Health check: http://localhost:8000/api/health"
echo ""
echo "📊 Для мониторинга:"
echo "   - Backend логи: tail -f logs/backend.log"
echo "   - Frontend логи: tail -f logs/frontend.log"
echo ""
echo "🛑 Для остановки:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Сохраняем PID для остановки
echo "$BACKEND_PID $FRONTEND_PID" > logs/pids.txt
echo "PID сохранены в logs/pids.txt"
