#!/bin/bash

echo "🔄 ОБНОВЛЕНИЕ КОДА НА СЕРВЕРЕ"
echo "============================"

# Проверяем, что мы на сервере
if [ ! -f "config/docker/docker-compose.prod.yml" ]; then
    echo "❌ Скрипт должен запускаться в корневой директории проекта на сервере!"
    echo "   Убедитесь, что вы находитесь в директории с docker-compose.prod.yml"
    exit 1
fi

echo "✅ Находимся в правильной директории"

# Проверяем Git
if ! command -v git &> /dev/null; then
    echo "❌ Git не установлен!"
    echo "   Установите Git: sudo apt install git (Ubuntu) или sudo yum install git (CentOS)"
    exit 1
fi

echo "✅ Git доступен"

# Проверяем статус Git
echo ""
echo "📊 Текущий статус Git:"
git status --porcelain

# Проверяем наличие изменений
if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "⚠️ Обнаружены локальные изменения!"
    echo "   Сохраняем изменения в stash..."
    git stash push -m "Auto-stash before update $(date)"
    echo "✅ Изменения сохранены в stash"
fi

# Получаем обновления
echo ""
echo "📥 Получение обновлений из репозитория..."
git fetch origin

# Проверяем наличие новых коммитов
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/master)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "✅ Код уже актуален, обновлений нет"
else
    echo "🔄 Найдены обновления, применяем..."
    git pull origin master
    
    if [ $? -eq 0 ]; then
        echo "✅ Код успешно обновлен"
    else
        echo "❌ Ошибка при обновлении кода!"
        echo "   Проверьте статус: git status"
        exit 1
    fi
fi

# Останавливаем сервисы
echo ""
echo "🛑 Остановка сервисов для обновления..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down

# Пересобираем образы (если нужно)
echo ""
echo "🔨 Пересборка образов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build --no-cache

# Запускаем сервисы
echo ""
echo "🚀 Запуск обновленных сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d

# Ждем запуска
echo ""
echo "⏳ Ожидание запуска сервисов (60 секунд)..."
sleep 60

# Проверяем статус
echo ""
echo "📊 Статус сервисов после обновления:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Проверяем health checks
echo ""
echo "🏥 Проверка health checks..."
for service in postgres redis backend frontend nginx; do
    container_name="agb_${service}_prod"
    if docker ps | grep -q "$container_name"; then
        health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "no-health-check")
        echo "  $service: $health"
    else
        echo "  $service: не запущен"
    fi
done

# Тестируем API
echo ""
echo "🧪 Тестирование API после обновления..."
sleep 10

SERVER_IP=$(curl -s ifconfig.me || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

# Тестируем health check
HEALTH_RESPONSE=$(curl -s "http://$SERVER_IP:8000/api/health" || echo "error")

if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
    echo "✅ Backend API работает после обновления"
else
    echo "❌ Backend API не отвечает после обновления"
    echo "   Ответ: $HEALTH_RESPONSE"
    echo "   Проверьте логи: docker logs agb_backend_prod"
fi

# Тестируем frontend
FRONTEND_RESPONSE=$(curl -s -I "http://$SERVER_IP" | head -1 || echo "error")

if [[ "$FRONTEND_RESPONSE" == *"200"* ]] || [[ "$FRONTEND_RESPONSE" == *"HTTP"* ]]; then
    echo "✅ Frontend работает после обновления"
else
    echo "❌ Frontend не отвечает после обновления"
    echo "   Ответ: $FRONTEND_RESPONSE"
    echo "   Проверьте логи: docker logs agb_frontend_prod"
fi

echo ""
echo "🎉 ОБНОВЛЕНИЕ ЗАВЕРШЕНО!"
echo ""
echo "📋 Результат обновления:"
echo "  - Код обновлен из репозитория"
echo "  - Сервисы перезапущены"
echo "  - Сервер: $SERVER_IP"
echo ""
echo "🌐 Доступ к приложению:"
echo "  - Frontend: http://$SERVER_IP"
echo "  - Backend API: http://$SERVER_IP:8000"
echo "  - API Docs: http://$SERVER_IP:8000/docs"
echo ""
echo "📝 Полезные команды:"
echo "  - Просмотр логов: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env logs"
echo "  - Перезапуск сервисов: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart"
echo "  - Откат изменений: git reset --hard HEAD~1 && docker-compose restart"
echo ""
echo "🔍 Если что-то не работает:"
echo "  1. Проверьте логи: docker logs CONTAINER_NAME"
echo "  2. Проверьте статус: docker ps"
echo "  3. Перезапустите сервисы: docker-compose restart"
echo "  4. Откатите изменения: git reset --hard HEAD~1"
