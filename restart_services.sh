#!/bin/bash

echo "🔄 Перезапуск сервисов на портах 3000 и 8000..."

# Убиваем все процессы на портах 3000 и 8000
echo "🔪 Останавливаем все процессы на портах 3000 и 8000..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "python main.py" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

# Ждем немного
sleep 2

echo "🚀 Запускаем бэкенд на порту 8000..."
cd /Users/andreydolgov/Desktop/programming/agb_proj/backend
python3 main.py &
BACKEND_PID=$!

echo "🚀 Запускаем фронтенд на порту 3000..."
cd /Users/andreydolgov/Desktop/programming/agb_proj/frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Сервисы запущены:"
echo "   - Бэкенд (PID: $BACKEND_PID) на http://localhost:8000"
echo "   - Фронтенд (PID: $FRONTEND_PID) на http://localhost:3000"

# Ждем немного для запуска
sleep 5

echo "🔍 Проверяем статус сервисов..."

# Проверяем бэкенд
if curl -s http://localhost:8000/ > /dev/null; then
    echo "✅ Бэкенд работает на http://localhost:8000"
else
    echo "❌ Бэкенд не отвечает"
fi

# Проверяем фронтенд
if curl -s http://localhost:3000/ > /dev/null; then
    echo "✅ Фронтенд работает на http://localhost:3000"
else
    echo "❌ Фронтенд не отвечает"
fi

echo "🎉 Готово! Сервисы перезапущены."
