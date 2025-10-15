#!/bin/bash

echo "🔍 ДИАГНОСТИКА ПРОБЛЕМЫ С БОКОВЫМ МЕНЮ НА СЕРВЕРЕ"
echo "==============================================="

# Проверяем аргументы
if [ $# -eq 0 ]; then
    echo "❌ Не указан адрес сервера!"
    echo ""
    echo "Использование:"
    echo "  $0 <server_ip> [username]"
    echo ""
    echo "Примеры:"
    echo "  $0 89.23.99.86"
    echo "  $0 89.23.99.86 root"
    echo ""
    exit 1
fi

SERVER_IP=$1
USERNAME=${2:-root}
PROJECT_PATH="/root/agb_proj"

echo "🌐 Сервер: $SERVER_IP"
echo "👤 Пользователь: $USERNAME"
echo "📁 Путь: $PROJECT_PATH"

# Проверяем подключение к серверу
echo ""
echo "🔍 Проверка подключения к серверу..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $USERNAME@$SERVER_IP "echo 'Подключение успешно'" 2>/dev/null; then
    echo "❌ Не удается подключиться к серверу $SERVER_IP"
    exit 1
fi

echo "✅ Подключение к серверу успешно"

# Проверяем статус контейнеров
echo ""
echo "📊 Статус контейнеров на сервере:"
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

# Проверяем версию кода на сервере
echo ""
echo "📋 Версия кода на сервере:"
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && git log --oneline -5"

# Проверяем AppLayout.tsx на сервере
echo ""
echo "🔍 Проверка AppLayout.tsx на сервере:"
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && grep -n 'getSimpleApiUrl\|getApiUrl' frontend/components/AppLayout.tsx 2>/dev/null || echo 'Файл не найден'"

# Проверяем api.ts на сервере
echo ""
echo "🔍 Проверка api.ts на сервере:"
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && grep -n 'getSimpleApiUrl\|getApiUrl' frontend/src/utils/api.ts 2>/dev/null || echo 'Файл не найден'"

# Проверяем логи frontend
echo ""
echo "📄 Логи frontend контейнера:"
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker logs agb_frontend_prod --tail 20"

# Проверяем логи backend
echo ""
echo "📄 Логи backend контейнера:"
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker logs agb_backend_prod --tail 20"

# Проверяем доступность API
echo ""
echo "🌐 Проверка доступности API:"
ssh $USERNAME@$SERVER_IP "curl -s http://localhost:8000/api/health || echo 'API недоступен'"

# Проверяем доступность frontend
echo ""
echo "🌐 Проверка доступности frontend:"
ssh $USERNAME@$SERVER_IP "curl -s -I http://localhost:3000 | head -1 || echo 'Frontend недоступен'"

# Проверяем переменные окружения
echo ""
echo "🔧 Проверка переменных окружения frontend:"
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker exec agb_frontend_prod env | grep -E 'NEXT_PUBLIC|API' || echo 'Переменные не найдены'"

echo ""
echo "🎯 РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ:"
echo ""
echo "1. Обновите код на сервере:"
echo "   ssh $USERNAME@$SERVER_IP 'cd $PROJECT_PATH && git pull && docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart'"
echo ""
echo "2. Пересоберите frontend:"
echo "   ssh $USERNAME@$SERVER_IP 'cd $PROJECT_PATH && docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build frontend && docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d frontend'"
echo ""
echo "3. Проверьте переменные окружения:"
echo "   ssh $USERNAME@$SERVER_IP 'cd $PROJECT_PATH && cat config/env/production.env | grep NEXT_PUBLIC'"
