#!/bin/bash

# Принудительная пересборка frontend с исправлением CORS
# Использование: ./force-rebuild-frontend.sh

set -e

echo "🔧 Принудительная пересборка frontend"
echo "===================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

# Устанавливаем правильный API URL
export NEXT_PUBLIC_API_URL="http://$SERVER_IP:8000/api"
echo "📋 NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"

# Переходим в директорию frontend
cd frontend

echo "🧹 Полная очистка frontend..."
# Удаляем все кэши и сборки
rm -rf .next
rm -rf out
rm -rf node_modules/.cache
rm -rf .npm

echo "📦 Переустановка зависимостей..."
npm install

echo "🔨 Принудительная пересборка..."
# Принудительно устанавливаем переменные окружения
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" npm run build

# Проверяем, что сборка прошла успешно
if [ $? -eq 0 ]; then
    echo "✅ Frontend успешно пересобран!"
else
    echo "❌ Ошибка пересборки frontend!"
    exit 1
fi

echo "🚀 Запуск frontend..."
# Останавливаем предыдущие процессы
pkill -f "npm start" || true
pkill -f "next start" || true

# Запускаем frontend
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" npm start &

FRONTEND_PID=$!
echo "📋 Frontend запущен с PID: $FRONTEND_PID"

# Ждем запуска
echo "⏳ Ожидание запуска frontend..."
sleep 10

# Проверяем доступность
if curl -s --connect-timeout 5 "http://$SERVER_IP:3000" > /dev/null; then
    echo "✅ Frontend доступен на http://$SERVER_IP:3000"
else
    echo "⚠️ Frontend может быть еще не готов, подождите еще немного..."
    sleep 5
    if curl -s --connect-timeout 5 "http://$SERVER_IP:3000" > /dev/null; then
        echo "✅ Frontend теперь доступен!"
    else
        echo "❌ Проблема с запуском frontend"
    fi
fi

echo ""
echo "🎉 Принудительная пересборка завершена!"
echo ""
echo "📋 Проверьте в браузере:"
echo "1. Откройте http://$SERVER_IP:3000"
echo "2. Откройте Developer Tools (F12)"
echo "3. Посмотрите в Console - должны быть логи с API URL"
echo "4. Попробуйте войти в систему"
echo ""
echo "🔍 Если все еще есть проблемы:"
echo "1. Проверьте, что backend запущен: curl http://$SERVER_IP:8000/api/v1/health"
echo "2. Проверьте логи frontend: pm2 logs"
echo "3. Проверьте логи backend: tail -f backend.log"
