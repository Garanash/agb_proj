#!/bin/bash

# Скрипт исправления проблем с Redis
# Использование: ./fix-redis.sh

set -e

echo "🔧 Исправление проблем с Redis"
echo "=============================="

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

echo "🔍 Проверка конфигурации Redis..."
echo "   REDIS_PASSWORD: $REDIS_PASSWORD"

echo "🛑 Остановка Redis..."
docker-compose -f docker-compose.production.yml stop redis

echo "🧹 Удаление Redis контейнера и volume..."
docker-compose -f docker-compose.production.yml rm -f redis
docker volume rm agb_proj_redis_data 2>/dev/null || true

echo "🌐 Запуск Redis..."
docker-compose -f docker-compose.production.yml up -d redis

echo "⏳ Ожидание запуска Redis..."
sleep 5

echo "🔍 Проверка подключения к Redis..."
# Проверяем без пароля (если Redis запустился без пароля)
if docker exec agb_redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo "✅ Redis доступен без пароля"
elif docker exec agb_redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    echo "✅ Redis доступен с паролем"
else
    echo "❌ Redis недоступен"
    echo "📋 Логи Redis:"
    docker-compose -f docker-compose.production.yml logs redis
    exit 1
fi

echo "🔧 Настройка Redis пароля..."
# Устанавливаем пароль если его нет
docker exec agb_redis redis-cli CONFIG SET requirepass "$REDIS_PASSWORD" 2>/dev/null || true

echo "🔍 Финальная проверка Redis..."
if docker exec agb_redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    echo "✅ Redis настроен и работает корректно"
else
    echo "❌ Проблема с Redis остается"
    echo "📋 Логи Redis:"
    docker-compose -f docker-compose.production.yml logs redis
fi

echo ""
echo "🎉 Исправление Redis завершено!"
