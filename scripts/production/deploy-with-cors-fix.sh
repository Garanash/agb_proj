#!/bin/bash

# Скрипт для правильного деплоя с исправлением CORS
# Использование: ./deploy-with-cors-fix.sh

set -e

echo "🚀 Деплой с исправлением CORS"
echo "============================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

echo "📝 Обновление .env.production с правильным API URL..."

# Создаем резервную копию
cp .env.production .env.production.backup

# Обновляем NEXT_PUBLIC_API_URL в .env.production
if grep -q "NEXT_PUBLIC_API_URL" .env.production; then
    # Заменяем существующую строку
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP:8000/api|" .env.production
else
    # Добавляем новую строку после FRONTEND_URL
    sed -i "/FRONTEND_URL=/a\\n# API Configuration - ВАЖНО для CORS!\\nNEXT_PUBLIC_API_URL=http://$SERVER_IP:8000/api" .env.production
fi

echo "✅ Обновлен NEXT_PUBLIC_API_URL: http://$SERVER_IP:8000/api"

# Проверяем, что backend запущен
echo "🔍 Проверка backend..."
if curl -s "http://$SERVER_IP:8000/api/v1/health" > /dev/null; then
    echo "✅ Backend доступен на http://$SERVER_IP:8000"
else
    echo "❌ Backend недоступен на http://$SERVER_IP:8000"
    echo "   Запустите backend: ./scripts/production/start-backend.sh"
    exit 1
fi

# Переходим в директорию frontend
cd frontend

echo "🔧 Пересборка frontend с правильными переменными окружения..."

# Загружаем переменные окружения
export $(cat ../.env.production | grep -v '^#' | xargs)

# Проверяем, что переменная установлена
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo "❌ NEXT_PUBLIC_API_URL не установлена!"
    exit 1
fi

echo "📋 NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"

# Очищаем предыдущую сборку
echo "🧹 Очистка предыдущей сборки..."
rm -rf .next
rm -rf out

# Устанавливаем зависимости
echo "📦 Установка зависимостей..."
npm install

# Собираем frontend с правильными переменными окружения
echo "🔨 Сборка frontend..."
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" npm run build

# Проверяем, что сборка прошла успешно
if [ $? -eq 0 ]; then
    echo "✅ Frontend успешно собран!"
else
    echo "❌ Ошибка сборки frontend!"
    exit 1
fi

# Запускаем frontend
echo "🚀 Запуск frontend..."
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" npm start &

FRONTEND_PID=$!
echo "📋 Frontend запущен с PID: $FRONTEND_PID"

# Ждем немного для запуска
sleep 5

# Проверяем, что frontend запустился
if curl -s "http://$SERVER_IP:3000" > /dev/null; then
    echo "✅ Frontend доступен на http://$SERVER_IP:3000"
else
    echo "⚠️ Frontend может быть еще не готов, подождите немного..."
fi

echo ""
echo "🎉 Деплой завершен!"
echo ""
echo "📋 Проверьте:"
echo "1. Frontend: http://$SERVER_IP:3000"
echo "2. Backend API: http://$SERVER_IP:8000/api/v1/health"
echo "3. Swagger: http://$SERVER_IP:8000/docs"
echo ""
echo "🔧 Если есть проблемы:"
echo "1. Проверьте логи backend: tail -f backend.log"
echo "2. Проверьте логи frontend: pm2 logs"
echo "3. Перезапустите backend: ./scripts/production/start-backend.sh"
