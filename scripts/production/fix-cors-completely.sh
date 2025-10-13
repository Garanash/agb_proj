#!/bin/bash

# Полное исправление CORS проблемы
# Использование: ./fix-cors-completely.sh

set -e

echo "🔧 Полное исправление CORS проблемы"
echo "==================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "📋 Шаг 1: Проверка и запуск backend"
echo "-----------------------------------"
./scripts/production/ensure-backend-running.sh

echo ""
echo "📋 Шаг 2: Принудительная пересборка frontend"
echo "------------------------------------------"
./scripts/production/force-rebuild-frontend.sh

echo ""
echo "📋 Шаг 3: Финальная проверка"
echo "---------------------------"

# Проверяем backend
if curl -s --connect-timeout 5 "http://$SERVER_IP:8000/api/v1/health" > /dev/null; then
    echo "✅ Backend доступен"
else
    echo "❌ Backend недоступен"
    exit 1
fi

# Проверяем frontend
if curl -s --connect-timeout 5 "http://$SERVER_IP:3000" > /dev/null; then
    echo "✅ Frontend доступен"
else
    echo "❌ Frontend недоступен"
    exit 1
fi

# Проверяем CORS
echo "🔍 Проверка CORS..."
CORS_TEST=$(curl -s -H "Origin: http://$SERVER_IP" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS "http://$SERVER_IP:8000/api/v1/auth/login" -I)
if echo "$CORS_TEST" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS настроен правильно"
else
    echo "⚠️ CORS может быть настроен неправильно"
fi

echo ""
echo "🎉 Исправление завершено!"
echo ""
echo "📋 Проверьте в браузере:"
echo "1. Откройте http://$SERVER_IP:3000"
echo "2. Откройте Developer Tools (F12)"
echo "3. Посмотрите в Console - должны быть логи с правильным API URL"
echo "4. Попробуйте войти в систему"
echo ""
echo "🔍 Если все еще есть проблемы:"
echo "1. Проверьте логи frontend в консоли браузера"
echo "2. Проверьте Network tab в Developer Tools"
echo "3. Убедитесь, что запросы идут на http://$SERVER_IP:8000/api"
