#!/bin/bash

# Полная диагностика и исправление всех проблем
# Использование: ./full-diagnosis-and-fix.sh

set -e

echo "🔍 Полная диагностика и исправление всех проблем"
echo "==============================================="

# Получаем IPv4 IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IPv4 IP сервера: $SERVER_IP"

echo ""
echo "📋 Шаг 1: Проверка статуса всех сервисов"
echo "-------------------------------------"

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

echo ""
echo "📋 Шаг 2: Проверка процессов"
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
echo "📋 Шаг 3: Проверка логов backend"
echo "-----------------------------"

# Проверяем логи backend
if [ -f "backend.log" ]; then
    echo "✅ backend.log найден"
    echo "📋 Последние 10 строк логов backend:"
    tail -10 backend.log
else
    echo "❌ backend.log не найден"
fi

echo ""
echo "📋 Шаг 4: Проверка переменных окружения"
echo "------------------------------------"

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
echo "📋 Шаг 5: Исправление проблем"
echo "-------------------------"

# Если backend не запущен, запускаем его
if ! curl -s --connect-timeout 5 "http://$SERVER_IP:8000/api/v1/health" > /dev/null; then
    echo "🔧 Backend не запущен, запускаем..."
    ./scripts/production/start-backend-if-needed.sh
else
    echo "✅ Backend уже запущен"
fi

# Если frontend не запущен, запускаем его
if ! curl -s --connect-timeout 5 "http://$SERVER_IP:3000" > /dev/null; then
    echo "🔧 Frontend не запущен, запускаем..."
    ./scripts/production/start-frontend-simple.sh
else
    echo "✅ Frontend уже запущен"
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
echo "📋 Шаг 7: Тест входа в систему"
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
echo "📋 Шаг 8: Проверка API URL в frontend"
echo "----------------------------------"

# Проверяем, какой API URL использует frontend
echo "🔍 Проверка API URL в frontend..."
if curl -s "http://$SERVER_IP:3000" | grep -q "localhost:8000"; then
    echo "❌ Frontend все еще использует localhost:8000"
    echo "🔧 Пересобираем frontend с правильным API URL..."
    cd frontend
    export NEXT_PUBLIC_API_URL="http://$SERVER_IP:8000/api"
    npm run build
    cd ..
    echo "✅ Frontend пересобран"
else
    echo "✅ Frontend использует правильный API URL"
fi

echo ""
echo "✅ Диагностика завершена!"
echo ""
echo "📋 Статус сервисов:"
echo "Frontend: http://$SERVER_IP:3000"
echo "Backend: http://$SERVER_IP:8000/api/v1/health"
echo "Swagger: http://$SERVER_IP:8000/docs"
echo ""
echo "📋 Если все работает, откройте в браузере:"
echo "http://$SERVER_IP:3000"
echo ""
echo "📋 Логи:"
echo "Frontend: npm start (в терминале)"
echo "Backend: tail -f backend.log"
