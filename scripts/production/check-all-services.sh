#!/bin/bash

# Проверка статуса всех сервисов
# Использование: ./check-all-services.sh

set -e

echo "🔍 Проверка статуса всех сервисов"
echo "================================="

# Получаем IPv4 IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IPv4 IP сервера: $SERVER_IP"

echo ""
echo "📋 Проверка портов:"
echo "------------------"

# Проверяем порты
check_port() {
    local port=$1
    local service=$2
    if ss -tuln | grep -q ":$port " || lsof -i :$port >/dev/null 2>&1; then
        echo "✅ Порт $port ($service) - открыт"
        # Показываем процесс
        local pid=$(lsof -ti :$port 2>/dev/null)
        if [ ! -z "$pid" ]; then
            echo "   PID: $pid"
        fi
    else
        echo "❌ Порт $port ($service) - закрыт"
    fi
}

check_port 3000 "Frontend"
check_port 8000 "Backend API"
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"
check_port 5678 "N8N"

echo ""
echo "📋 Проверка HTTP сервисов:"
echo "-------------------------"

# Проверяем HTTP доступность
check_http() {
    local url=$1
    local service=$2
    if curl -s --connect-timeout 5 "$url" > /dev/null; then
        echo "✅ $service ($url) - доступен"
    else
        echo "❌ $service ($url) - недоступен"
    fi
}

check_http "http://$SERVER_IP:3000" "Frontend"
check_http "http://$SERVER_IP:8000/api/v1/health" "Backend API"
check_http "http://$SERVER_IP:8000/docs" "Swagger"

echo ""
echo "📋 Проверка процессов:"
echo "--------------------"

# Проверяем процессы
check_process() {
    local pattern=$1
    local service=$2
    if pgrep -f "$pattern" > /dev/null; then
        echo "✅ $service - запущен"
        local pid=$(pgrep -f "$pattern")
        echo "   PID: $pid"
    else
        echo "❌ $service - не запущен"
    fi
}

check_process "uvicorn main:app" "Backend (uvicorn)"
check_process "npm start" "Frontend (npm)"
check_process "next start" "Frontend (next)"

echo ""
echo "📋 Проверка логов:"
echo "----------------"

# Проверяем логи
if [ -f "backend.log" ]; then
    echo "✅ backend.log найден"
    echo "📋 Последние 5 строк логов backend:"
    tail -5 backend.log
else
    echo "❌ backend.log не найден"
fi

echo ""
echo "📋 Проверка переменных окружения:"
echo "--------------------------------"

# Проверяем переменные окружения
if [ -f ".env.production" ]; then
    echo "✅ .env.production найден"
    if grep -q "NEXT_PUBLIC_API_URL" .env.production; then
        API_URL=$(grep "NEXT_PUBLIC_API_URL" .env.production | cut -d'=' -f2)
        echo "📋 NEXT_PUBLIC_API_URL: $API_URL"
    else
        echo "❌ NEXT_PUBLIC_API_URL не установлена в .env.production"
    fi
else
    echo "❌ .env.production не найден"
fi

echo ""
echo "📋 Проверка CORS:"
echo "---------------"

# Проверяем CORS
echo "🔍 Тестирование CORS..."
CORS_RESPONSE=$(curl -s -H "Origin: http://$SERVER_IP" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS "http://$SERVER_IP:8000/api/v1/auth/login" -I)
if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "✅ CORS настроен правильно"
    echo "📋 CORS заголовки:"
    echo "$CORS_RESPONSE" | grep -i "access-control"
else
    echo "❌ CORS настроен неправильно"
    echo "📋 Ответ сервера:"
    echo "$CORS_RESPONSE"
fi

echo ""
echo "📋 Рекомендации:"
echo "---------------"

# Проверяем, что нужно исправить
if ! curl -s --connect-timeout 5 "http://$SERVER_IP:8000/api/v1/health" > /dev/null; then
    echo "🔧 Запустите backend: ./scripts/production/minimal-backend.sh"
fi

if ! curl -s --connect-timeout 5 "http://$SERVER_IP:3000" > /dev/null; then
    echo "🔧 Запустите frontend: ./scripts/production/comprehensive-fix.sh"
fi

if ! echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "🔧 Исправьте CORS: ./scripts/production/comprehensive-fix.sh"
fi

echo ""
echo "✅ Проверка завершена!"
