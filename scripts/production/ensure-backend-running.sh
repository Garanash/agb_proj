#!/bin/bash

# Проверка и запуск backend
# Использование: ./ensure-backend-running.sh

set -e

echo "🔍 Проверка и запуск backend"
echo "=========================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

# Проверяем, запущен ли backend
echo "🔍 Проверка backend..."
if curl -s --connect-timeout 5 "http://$SERVER_IP:8000/api/v1/health" > /dev/null; then
    echo "✅ Backend уже запущен и доступен"
    curl -s "http://$SERVER_IP:8000/api/v1/health" | jq . || echo "   (ответ получен, но не JSON)"
else
    echo "❌ Backend недоступен, запускаем..."
    
    # Проверяем, есть ли процесс на порту 8000
    if lsof -i :8000 > /dev/null 2>&1; then
        echo "⚠️ Порт 8000 занят, но backend не отвечает"
        echo "   Останавливаем процессы на порту 8000..."
        lsof -ti :8000 | xargs kill -9 || true
        sleep 2
    fi
    
    # Запускаем backend
    echo "🚀 Запуск backend..."
    ./scripts/production/simple-start-backend.sh
    
    # Ждем запуска
    echo "⏳ Ожидание запуска backend..."
    for i in {1..30}; do
        if curl -s --connect-timeout 5 "http://$SERVER_IP:8000/api/v1/health" > /dev/null; then
            echo "✅ Backend запущен и доступен!"
            break
        fi
        echo "   Попытка $i/30..."
        sleep 2
    done
    
    # Финальная проверка
    if curl -s --connect-timeout 5 "http://$SERVER_IP:8000/api/v1/health" > /dev/null; then
        echo "✅ Backend успешно запущен!"
    else
        echo "❌ Не удалось запустить backend"
        echo "   Проверьте логи: tail -f backend.log"
        exit 1
    fi
fi

echo ""
echo "📋 Backend информация:"
echo "🌐 API URL: http://$SERVER_IP:8000/api"
echo "📚 Swagger: http://$SERVER_IP:8000/docs"
echo "❤️ Health: http://$SERVER_IP:8000/api/v1/health"

# Проверяем CORS настройки
echo ""
echo "🔍 Проверка CORS..."
CORS_RESPONSE=$(curl -s -H "Origin: http://$SERVER_IP" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS "http://$SERVER_IP:8000/api/v1/auth/login" -I)
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS настроен правильно"
else
    echo "⚠️ CORS может быть настроен неправильно"
    echo "   Ответ сервера:"
    echo "$CORS_RESPONSE"
fi

echo ""
echo "🎉 Backend готов к работе!"
