#!/bin/bash

# Проверка статуса и исправление проблем
# Использование: ./check-and-fix.sh

set -e

echo "🔍 Проверка статуса и исправление проблем"
echo "========================================"

# Получаем IPv4 IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IPv4 IP сервера: $SERVER_IP"

echo ""
echo "📋 Шаг 1: Проверка файла .env.production"
echo "-------------------------------------"

# Проверяем файл .env.production
if [ -f ".env.production" ]; then
    echo "✅ Файл .env.production найден"
    
    # Проверяем на проблемные строки
    if grep -q "^n#" .env.production; then
        echo "❌ Найдена проблемная строка 'n#' в .env.production"
        echo "🔧 Исправление..."
        
        # Создаем резервную копию
        cp .env.production .env.production.backup
        
        # Удаляем проблемные строки
        sed -i '/^n#/d' .env.production
        
        echo "✅ Проблемные строки удалены"
    else
        echo "✅ Проблемных строк не найдено"
    fi
    
    # Проверяем NEXT_PUBLIC_API_URL
    if grep -q "NEXT_PUBLIC_API_URL" .env.production; then
        API_URL=$(grep "NEXT_PUBLIC_API_URL" .env.production | cut -d'=' -f2)
        echo "📋 NEXT_PUBLIC_API_URL: $API_URL"
    else
        echo "⚠️ NEXT_PUBLIC_API_URL не установлена"
    fi
else
    echo "❌ Файл .env.production не найден"
fi

echo ""
echo "📋 Шаг 2: Проверка портов"
echo "----------------------"

# Проверяем порты
check_port() {
    local port=$1
    local service=$2
    if ss -tuln | grep -q ":$port " || lsof -i :$port >/dev/null 2>&1; then
        echo "✅ Порт $port ($service) - открыт"
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

echo ""
echo "📋 Шаг 3: Проверка HTTP сервисов"
echo "-----------------------------"

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
echo "📋 Шаг 4: Проверка процессов"
echo "-------------------------"

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
echo "📋 Шаг 5: Проверка логов backend"
echo "-----------------------------"

# Проверяем логи backend
if [ -f "backend.log" ]; then
    echo "✅ backend.log найден"
    echo "📋 Последние 5 строк логов backend:"
    tail -5 backend.log
else
    echo "❌ backend.log не найден"
fi

echo ""
echo "📋 Шаг 6: Проверка CORS"
echo "-------------------"

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
echo "📋 Шаг 7: Рекомендации"
echo "-------------------"

# Проверяем, что нужно исправить
if ! curl -s --connect-timeout 5 "http://$SERVER_IP:8000/api/v1/health" > /dev/null; then
    echo "🔧 Запустите backend: ./scripts/production/clean-restart-backend.sh"
fi

if ! curl -s --connect-timeout 5 "http://$SERVER_IP:3000" > /dev/null; then
    echo "🔧 Запустите frontend: ./scripts/production/start-frontend-simple.sh"
fi

if ! echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "🔧 Исправьте CORS: перезапустите backend"
fi

echo ""
echo "📋 Шаг 8: Тест входа в систему"
echo "---------------------------"

# Тестируем вход в систему
echo "🔍 Тестирование входа в систему..."
LOGIN_TEST=$(curl -s -X POST "http://$SERVER_IP:8000/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -H "Origin: http://$SERVER_IP" \
    -d '{"username":"admin","password":"admin"}' 2>/dev/null)

if echo "$LOGIN_TEST" | grep -q "access_token"; then
    echo "✅ Тест входа в систему прошел успешно"
else
    echo "❌ Тест входа в систему не прошел"
    echo "📋 Ответ сервера:"
    echo "$LOGIN_TEST"
fi

echo ""
echo "✅ Проверка завершена!"
echo ""
echo "📋 Статус сервисов:"
echo "Frontend: http://$SERVER_IP:3000"
echo "Backend: http://$SERVER_IP:8000/api/v1/health"
echo "Swagger: http://$SERVER_IP:8000/docs"
echo ""
echo "📋 Если все работает, откройте в браузере:"
echo "http://$SERVER_IP:3000"
