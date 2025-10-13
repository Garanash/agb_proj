#!/bin/bash

# Скрипт для исправления CORS проблемы на сервере
# Использование: ./fix-cors-issue.sh

set -e

echo "🔧 Исправление CORS проблемы"
echo "============================"

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

# Проверяем backend CORS настройки
echo "🔍 Проверка CORS настроек в backend..."

# Проверяем, есть ли файл с CORS настройками
if [ -f "backend/main.py" ]; then
    echo "📋 Настройки CORS в backend/main.py:"
    grep -n "CORS\|cors\|origin" backend/main.py || echo "   CORS настройки не найдены"
fi

echo ""
echo "🎉 CORS проблема исправлена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Перезапустите frontend с новыми переменными окружения:"
echo "   cd frontend && npm run build && npm start"
echo ""
echo "2. Или перезапустите все сервисы:"
echo "   ./scripts/production/start-frontend.sh"
echo ""
echo "3. Проверьте, что backend доступен:"
echo "   curl http://$SERVER_IP:8000/api/v1/health"
echo ""
echo "⚠️  ВАЖНО: Убедитесь, что backend запущен на порту 8000!"
