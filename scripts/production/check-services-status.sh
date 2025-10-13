#!/bin/bash

# Скрипт для проверки статуса всех сервисов
# Использование: ./check-services-status.sh

set -e

echo "🔍 Проверка статуса сервисов"
echo "============================"

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "📋 Проверка Docker сервисов:"
echo "----------------------------"

# Проверяем Docker контейнеры
if command -v docker &> /dev/null; then
    echo "🐳 Docker контейнеры:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep agb || echo "   Нет запущенных AGB контейнеров"
else
    echo "❌ Docker не установлен"
fi

echo ""
echo "📋 Проверка портов:"
echo "------------------"

# Проверяем порты
check_port() {
    local port=$1
    local service=$2
    if netstat -tuln | grep -q ":$port "; then
        echo "✅ Порт $port ($service) - открыт"
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
echo "📋 Проверка переменных окружения:"
echo "-------------------------------"

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
echo "📋 Рекомендации:"
echo "---------------"

# Проверяем, что нужно исправить
if ! curl -s --connect-timeout 5 "http://$SERVER_IP:8000/api/v1/health" > /dev/null; then
    echo "🔧 Запустите backend: ./scripts/production/start-backend.sh"
fi

if ! curl -s --connect-timeout 5 "http://$SERVER_IP:3000" > /dev/null; then
    echo "🔧 Запустите frontend: ./scripts/production/quick-fix-cors.sh"
fi

if ! grep -q "NEXT_PUBLIC_API_URL" .env.production 2>/dev/null; then
    echo "🔧 Исправьте CORS: ./scripts/production/deploy-with-cors-fix.sh"
fi

echo ""
echo "✅ Проверка завершена!"
