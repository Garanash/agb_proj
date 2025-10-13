#!/bin/bash

# Быстрое исправление CORS - пересборка frontend с правильным API URL
# Использование: ./quick-fix-cors.sh

set -e

echo "🔧 Быстрое исправление CORS"
echo "=========================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

# Устанавливаем правильный API URL
export NEXT_PUBLIC_API_URL="http://$SERVER_IP:8000/api"
echo "📋 NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"

# Переходим в директорию frontend
cd frontend

echo "🧹 Очистка предыдущей сборки..."
rm -rf .next

echo "🔨 Пересборка frontend..."
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" npm run build

echo "🚀 Запуск frontend..."
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" npm start &

echo ""
echo "✅ Frontend пересобран и запущен!"
echo "🌐 Доступен по адресу: http://$SERVER_IP:3000"
echo "🔗 API: http://$SERVER_IP:8000/api"
