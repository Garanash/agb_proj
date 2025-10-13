#!/bin/bash

# Комплексное исправление всех проблем с CORS и backend
# Использование: ./comprehensive-fix.sh

set -e

echo "🔧 Комплексное исправление всех проблем"
echo "======================================"

# Получаем IPv4 IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IPv4 IP сервера: $SERVER_IP"

echo ""
echo "📋 Шаг 1: Проверка и запуск backend"
echo "-----------------------------------"

# Останавливаем все процессы на порту 8000
echo "🛑 Остановка процессов на порту 8000..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || echo "   Порт 8000 свободен"

# Запускаем backend без проблемных зависимостей
echo "🚀 Запуск backend без проблемных зависимостей..."
./scripts/production/start-backend-no-pandas.sh

# Ждем запуска backend
echo "⏳ Ожидание запуска backend..."
sleep 10

# Проверяем доступность backend
if curl -s --connect-timeout 5 "http://$SERVER_IP:8000/api/v1/health" > /dev/null; then
    echo "✅ Backend доступен на http://$SERVER_IP:8000"
else
    echo "❌ Backend недоступен, проверяем логи..."
    if [ -f "backend.log" ]; then
        echo "📋 Последние 10 строк логов backend:"
        tail -10 backend.log
    fi
    echo "❌ Не удалось запустить backend"
    exit 1
fi

echo ""
echo "📋 Шаг 2: Исправление frontend"
echo "------------------------------"

# Переходим в директорию frontend
cd frontend

echo "🧹 Очистка предыдущей сборки..."
rm -rf .next
rm -rf out

echo "📦 Установка зависимостей..."
npm install

echo "🔨 Пересборка frontend с правильным API URL..."
# Устанавливаем правильный API URL
export NEXT_PUBLIC_API_URL="http://$SERVER_IP:8000/api"
echo "📋 NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"

# Собираем frontend
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" npm run build

# Проверяем сборку
if [ $? -eq 0 ]; then
    echo "✅ Frontend успешно собран"
else
    echo "❌ Ошибка сборки frontend"
    exit 1
fi

echo "🚀 Запуск frontend..."
# Останавливаем предыдущие процессы
pkill -f "npm start" 2>/dev/null || true
pkill -f "next start" 2>/dev/null || true

# Запускаем frontend
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
echo "📋 Шаг 3: Проверка CORS"
echo "----------------------"

# Проверяем CORS
echo "🔍 Проверка CORS..."
CORS_TEST=$(curl -s -H "Origin: http://$SERVER_IP" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS "http://$SERVER_IP:8000/api/v1/auth/login" -I)
if echo "$CORS_TEST" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS настроен правильно"
else
    echo "⚠️ CORS может быть настроен неправильно"
    echo "📋 Ответ сервера:"
    echo "$CORS_TEST"
fi

echo ""
echo "🎉 Комплексное исправление завершено!"
echo ""
echo "📋 Проверьте в браузере:"
echo "1. Откройте http://$SERVER_IP:3000"
echo "2. Откройте Developer Tools (F12)"
echo "3. Посмотрите в Console - должны быть логи с правильным API URL"
echo "4. Попробуйте войти в систему"
echo ""
echo "🔍 Если все еще есть проблемы:"
echo "1. Проверьте логи backend: tail -f backend.log"
echo "2. Проверьте логи frontend в консоли браузера"
echo "3. Убедитесь, что запросы идут на http://$SERVER_IP:8000/api"
echo ""
echo "📋 Статус сервисов:"
echo "Backend: http://$SERVER_IP:8000/api/v1/health"
echo "Frontend: http://$SERVER_IP:3000"
echo "Swagger: http://$SERVER_IP:8000/docs"
