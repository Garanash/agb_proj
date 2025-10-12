#!/bin/bash

# Скрипт исправления Redis пароля
# Использование: ./fix-redis-password.sh

set -e

echo "🔧 Исправление Redis пароля"
echo "==========================="

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

echo "🔍 Проверка Redis контейнера..."
if ! docker ps | grep -q agb_redis; then
    echo "❌ Redis контейнер не запущен!"
    echo "   Запустите: docker-compose -f docker-compose.production.yml up -d redis"
    exit 1
fi

echo "🔧 Настройка Redis пароля..."
# Устанавливаем пароль в Redis
docker exec agb_redis redis-cli CONFIG SET requirepass "$REDIS_PASSWORD"

echo "🔍 Проверка подключения с паролем..."
if docker exec agb_redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    echo "✅ Redis пароль настроен успешно!"
else
    echo "❌ Проблема с настройкой пароля Redis"
    echo "📋 Попробуйте перезапустить Redis:"
    echo "   docker-compose -f docker-compose.production.yml restart redis"
fi

echo ""
echo "🎉 Исправление Redis завершено!"
