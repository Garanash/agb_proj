#!/bin/bash

echo "🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С БОКОВЫМ МЕНЮ НА СЕРВЕРЕ"
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

# 1. Обновляем код на сервере
echo ""
echo "📥 Обновление кода на сервере..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && git fetch origin && git reset --hard origin/master"

# 2. Проверяем, что файлы обновились
echo ""
echo "🔍 Проверка обновленных файлов..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && echo 'AppLayout.tsx:' && grep -n 'getSimpleApiUrl' frontend/components/AppLayout.tsx && echo 'api.ts:' && grep -n 'getSimpleApiUrl' frontend/src/utils/api.ts"

# 3. Останавливаем контейнеры
echo ""
echo "🛑 Остановка контейнеров..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down"

# 4. Пересобираем frontend
echo ""
echo "🔨 Пересборка frontend..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build --no-cache frontend"

# 5. Запускаем все сервисы
echo ""
echo "🚀 Запуск всех сервисов..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d"

# 6. Ждем запуска
echo ""
echo "⏳ Ожидание запуска сервисов (60 секунд)..."
sleep 60

# 7. Проверяем статус
echo ""
echo "📊 Статус контейнеров после исправления:"
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

# 8. Проверяем health checks
echo ""
echo "🏥 Проверка health checks..."
for service in postgres redis backend frontend nginx; do
    container_name="agb_${service}_prod"
    health=$(ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker inspect --format='{{.State.Health.Status}}' $container_name 2>/dev/null || echo 'no-health-check'")
    echo "  $service: $health"
done

# 9. Тестируем API
echo ""
echo "🧪 Тестирование API..."
HEALTH_RESPONSE=$(ssh $USERNAME@$SERVER_IP "curl -s http://$SERVER_IP:8000/api/health" || echo "error")

if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
    echo "✅ Backend API работает"
else
    echo "❌ Backend API не отвечает"
    echo "   Ответ: $HEALTH_RESPONSE"
fi

# 10. Тестируем frontend
echo ""
echo "🧪 Тестирование frontend..."
FRONTEND_RESPONSE=$(ssh $USERNAME@$SERVER_IP "curl -s -I http://$SERVER_IP | head -1" || echo "error")

if [[ "$FRONTEND_RESPONSE" == *"200"* ]] || [[ "$FRONTEND_RESPONSE" == *"HTTP"* ]]; then
    echo "✅ Frontend работает"
else
    echo "❌ Frontend не отвечает"
    echo "   Ответ: $FRONTEND_RESPONSE"
fi

echo ""
echo "🎉 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo ""
echo "🌐 Проверьте приложение:"
echo "  - Frontend: http://$SERVER_IP"
echo "  - Backend API: http://$SERVER_IP:8000"
echo "  - API Docs: http://$SERVER_IP:8000/docs"
echo ""
echo "🔑 Данные для входа:"
echo "  - Администратор: admin / admin123"
echo "  - Менеджер 1: manager1 / ManagerPass123!"
echo "  - Менеджер 2: manager2 / ManagerPass123!"
echo "  - Сотрудник 1: employee1 / EmployeePass123!"
echo "  - Сотрудник 2: employee2 / EmployeePass123!"
echo "  - ВЭД специалист: ved_passport1 / VedPass123!"
echo "  - Пользователь: user1 / UserPass123!"
echo ""
echo "📝 Если проблема не решена, проверьте:"
echo "  1. Логи frontend: docker logs agb_frontend_prod"
echo "  2. Логи backend: docker logs agb_backend_prod"
echo "  3. Переменные окружения: docker exec agb_frontend_prod env | grep NEXT_PUBLIC"
