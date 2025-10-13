#!/bin/bash

# Принудительный пересбор frontend с правильным API URL
# Использование: ./force-rebuild-frontend-with-correct-api.sh

set -e

echo "🔨 Принудительный пересбор frontend с правильным API URL"
echo "====================================================="

# Получаем IPv4 IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IPv4 IP сервера: $SERVER_IP"

echo ""
echo "📋 Шаг 1: Остановка frontend"
echo "-------------------------"

# Останавливаем все процессы на порту 3000
echo "🛑 Остановка процессов на порту 3000..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || echo "   Порт 3000 свободен"

echo ""
echo "📋 Шаг 2: Переход в директорию frontend"
echo "------------------------------------"

cd frontend

echo ""
echo "📋 Шаг 3: Полная очистка"
echo "---------------------"

# Полная очистка
echo "🧹 Полная очистка..."
rm -rf .next
rm -rf out
rm -rf node_modules/.cache

echo ""
echo "📋 Шаг 4: Установка зависимостей"
echo "-----------------------------"

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
npm install

echo ""
echo "📋 Шаг 5: Пересборка с правильным API URL"
echo "--------------------------------------"

# Устанавливаем правильный API URL
export NEXT_PUBLIC_API_URL="http://$SERVER_IP:8000/api"
echo "📋 NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"

# Собираем frontend
echo "🔨 Пересборка frontend..."
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" npm run build

# Проверяем сборку
if [ $? -eq 0 ]; then
    echo "✅ Frontend успешно пересобран"
else
    echo "❌ Ошибка пересборки frontend"
    exit 1
fi

echo ""
echo "📋 Шаг 6: Запуск frontend"
echo "----------------------"

# Запускаем frontend
echo "🚀 Запуск frontend..."
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" npm start &

FRONTEND_PID=$!
echo "📋 Frontend запущен с PID: $FRONTEND_PID"

# Ждем запуска frontend
echo "⏳ Ожидание запуска frontend..."
sleep 10

# Проверяем доступность frontend
if curl -s --connect-timeout 5 "http://$SERVER_IP:3000" > /dev/null; then
    echo "✅ Frontend доступен на http://$SERVER_IP:3000"
else
    echo "⚠️ Frontend может быть еще не готов, подождите еще немного..."
    sleep 5
    if curl -s --connect-timeout 5 "http://$SERVER_IP:3000" > /dev/null; then
        echo "✅ Frontend теперь доступен"
    else
        echo "❌ Проблема с запуском frontend"
    fi
fi

echo ""
echo "🎉 Frontend успешно пересобран и запущен!"
echo ""
echo "📋 Проверьте в браузере:"
echo "1. Frontend: http://$SERVER_IP:3000"
echo "2. Backend API: http://$SERVER_IP:8000/api/v1/health"
echo "3. Swagger UI: http://$SERVER_IP:8000/docs"
echo ""
echo "📋 Логи:"
echo "Frontend: npm start (в терминале)"
echo "Backend: tail -f ../backend.log"
