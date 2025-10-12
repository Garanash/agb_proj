#!/bin/bash

# Скрипт для исправления проблем с Redis
# Использование: ./scripts/production/fix-redis-final.sh

set -e

echo "🔧 Финальное исправление Redis"
echo "============================="

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

echo "🛑 Остановка Redis контейнера..."
docker-compose -f docker-compose.production.yml stop redis || true
docker-compose -f docker-compose.production.yml rm -f redis || true

echo "🔧 Создание новой конфигурации Redis..."
# Создаем директорию для конфигурации Redis
mkdir -p infrastructure/redis

# Создаем конфигурационный файл Redis
cat > infrastructure/redis/redis.conf << EOF
# Redis configuration for production
port 6379
bind 0.0.0.0
protected-mode yes
requirepass $REDIS_PASSWORD
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF

echo "🐳 Запуск Redis с новой конфигурацией..."
docker-compose -f docker-compose.production.yml up -d redis

echo "⏳ Ожидание запуска Redis..."
sleep 10

echo "🔍 Проверка Redis..."
REDIS_TIMEOUT=30
REDIS_COUNT=0

until docker exec agb_redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; do
    if [ $REDIS_COUNT -ge $REDIS_TIMEOUT ]; then
        echo "❌ Redis не работает после настройки" >&2
        echo "📋 Логи Redis:" >&2
        docker-compose -f docker-compose.production.yml logs redis >&2
        exit 1
    fi
    echo "   Ожидание Redis... ($REDIS_COUNT/$REDIS_TIMEOUT)"
    sleep 1
    REDIS_COUNT=$((REDIS_COUNT + 1))
done

echo "✅ Redis работает с паролем!"

# Проверяем подключение без пароля (должно не работать)
if docker exec agb_redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
    echo "⚠️  Redis работает без пароля - это небезопасно!"
else
    echo "✅ Redis требует пароль - безопасно!"
fi

echo "🎉 Redis успешно настроен и работает!"
