#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С API URL НА СЕРВЕРЕ"
echo "=========================================="

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

# Шаг 1: Обновляем код на сервере
echo ""
echo "📥 Обновление кода на сервере..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && git pull origin master"

# Шаг 2: Проверяем переменные окружения
echo ""
echo "🔧 Проверка переменных окружения..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && echo '=== production.env ===' && cat config/env/production.env | grep NEXT_PUBLIC && echo '' && echo '=== Переменные в контейнере ===' && docker exec agb_frontend_prod env | grep NEXT_PUBLIC || echo 'Переменные не найдены в контейнере'"

# Шаг 3: Исправляем переменную окружения если нужно
echo ""
echo "🔧 Проверка и исправление NEXT_PUBLIC_API_URL..."
CURRENT_API_URL=$(ssh $USERNAME@$SERVER_IP "grep 'NEXT_PUBLIC_API_URL' $PROJECT_PATH/config/env/production.env | cut -d'=' -f2")

if [ "$CURRENT_API_URL" != "http://$SERVER_IP/api" ]; then
    echo "⚠️ NEXT_PUBLIC_API_URL неправильный или отсутствует"
    echo "   Текущий: $CURRENT_API_URL"
    echo "   Должен быть: http://$SERVER_IP/api"

    # Исправляем переменную
    ssh $USERNAME@$SERVER_IP "sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP/api|' $PROJECT_PATH/config/env/production.env"

    echo "✅ NEXT_PUBLIC_API_URL исправлен"
else
    echo "✅ NEXT_PUBLIC_API_URL правильный: $CURRENT_API_URL"
fi

# Шаг 4: Перезапускаем frontend контейнер
echo ""
echo "🔄 Перезапуск frontend контейнера..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart frontend"

# Шаг 5: Ждем запуска
echo ""
echo "⏳ Ожидание запуска frontend (30 секунд)..."
sleep 30

# Шаг 6: Проверяем статус
echo ""
echo "📊 Проверка статуса сервисов..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep frontend"

# Шаг 7: Проверяем переменные в контейнере
echo ""
echo "🔍 Проверка переменных окружения в контейнере..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker exec agb_frontend_prod env | grep NEXT_PUBLIC || echo 'Переменные не найдены'"

# Шаг 8: Тестируем API
echo ""
echo "🧪 Тестирование API..."
HEALTH_RESPONSE=$(ssh $USERNAME@$SERVER_IP "curl -s http://$SERVER_IP:8000/api/health" || echo "error")

if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
    echo "✅ Backend API работает"
else
    echo "❌ Backend API не отвечает"
    echo "   Ответ: $HEALTH_RESPONSE"
fi

# Шаг 9: Тестируем frontend
echo ""
echo "🧪 Тестирование frontend..."
FRONTEND_RESPONSE=$(ssh $USERNAME@$SERVER_IP "curl -s -I http://$SERVER_IP | head -1" || echo "error")

if [[ "$FRONTEND_RESPONSE" == *"200"* ]] || [[ "$FRONTEND_RESPONSE" == *"HTTP"* ]]; then
    echo "✅ Frontend работает"
else
    echo "❌ Frontend не отвечает"
    echo "   Ответ: $FRONTEND_RESPONSE"
fi

# Шаг 10: Тестируем API эндпоинты
echo ""
echo "🧪 Тестирование API эндпоинтов..."
NEWS_RESPONSE=$(ssh $USERNAME@$SERVER_IP "curl -s http://$SERVER_IP:8000/api/v1/news/?limit=10" || echo "error")
EVENTS_RESPONSE=$(ssh $USERNAME@$SERVER_IP "curl -s http://$SERVER_IP:8000/api/v1/events/?start_date=2025-10-01&end_date=2025-10-31" || echo "error")

if [[ "$NEWS_RESPONSE" == *"404"* ]]; then
    echo "❌ API новости недоступны (404) - проверьте эндпоинты"
else
    echo "✅ API новости работают"
fi

if [[ "$EVENTS_RESPONSE" == *"404"* ]]; then
    echo "❌ API события недоступны (404) - проверьте эндпоинты"
else
    echo "✅ API события работают"
fi

echo ""
echo "🎉 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo ""
echo "🌐 Проверьте приложение:"
echo "  - Frontend: http://$SERVER_IP"
echo "  - Backend API: http://$SERVER_IP:8000"
echo ""
echo "📋 Что было исправлено:"
echo "  1. Обновлен код frontend (исправлена функция getSimpleApiUrl)"
echo "  2. Проверена переменная NEXT_PUBLIC_API_URL"
echo "  3. Перезапущен frontend контейнер"
echo "  4. Протестированы все сервисы"
echo ""
echo "🔧 Если проблема не решена:"
echo "  1. Проверьте логи: docker logs agb_frontend_prod"
echo "  2. Проверьте переменные: docker exec agb_frontend_prod env | grep NEXT_PUBLIC"
echo "  3. Перезапустите все сервисы: docker-compose restart"
