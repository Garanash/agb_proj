#!/bin/bash

# Скрипт для запуска приложения на продакшн сервере
# Использование: ./start-production.sh

set -e

echo "🚀 Запуск AGB приложения на продакшн сервере"
echo "============================================="

# Проверяем наличие .env.production файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Создайте файл .env.production с правильными настройками"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

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
python3 main.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Ждем запуска backend
echo "⏳ Ожидание запуска Backend..."
sleep 10

# Проверяем backend
if curl -f http://localhost:8000/api/health 2>/dev/null; then
    echo "✅ Backend запущен успешно"
else
    echo "❌ Backend не запустился!"
    echo "   Проверьте логи: tail -f logs/backend.log"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Запускаем Frontend
echo "🌐 Запуск Frontend сервера..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

echo "   Frontend запускается на порту 3000..."
echo "   NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Ждем запуска frontend
echo "⏳ Ожидание запуска Frontend..."
sleep 15

# Проверяем frontend
if curl -f http://localhost:3000 2>/dev/null; then
    echo "✅ Frontend запущен успешно"
else
    echo "⚠️  Frontend может иметь проблемы, но процесс запущен"
    echo "   Проверьте логи: tail -f logs/frontend.log"
fi

echo ""
echo "✅ Приложение запущено!"
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

# Сохраняем PID для остановки
echo "$BACKEND_PID $FRONTEND_PID" > logs/pids.txt
echo "PID сохранены в logs/pids.txt"
