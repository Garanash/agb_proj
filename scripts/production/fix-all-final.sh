#!/bin/bash

# Универсальный скрипт исправления всех проблем на сервере
# Использование: ./scripts/production/fix-all-final.sh

set -e

echo "🔧 Финальное исправление всех проблем на сервере"
echo "==============================================="

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

echo "🛑 Остановка всех сервисов..."
docker-compose -f docker-compose.production.yml down || true

echo "🧹 Очистка Docker ресурсов..."
docker system prune -f || true

echo "🔧 Исправление Redis..."
# Используем простую команду без конфигурационного файла
docker run -d \
  --name agb_redis \
  --network agb_proj_agb_network \
  -p 6379:6379 \
  redis:7-alpine \
  redis-server --requirepass "$REDIS_PASSWORD" --appendonly yes

echo "⏳ Ожидание запуска Redis..."
sleep 10

echo "🔍 Проверка Redis..."
if docker exec agb_redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    echo "✅ Redis работает с паролем!"
else
    echo "❌ Redis не работает"
fi

echo "🌐 Запуск остальных Docker сервисов..."
docker-compose -f docker-compose.production.yml up -d postgres n8n nginx

echo "⏳ Ожидание запуска сервисов..."
sleep 15

echo "🔍 Проверка статуса сервисов..."
docker-compose -f docker-compose.production.yml ps

echo "🗄️  Проверка PostgreSQL..."
if docker exec agb_postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; then
    echo "✅ PostgreSQL работает"
else
    echo "❌ PostgreSQL не работает"
fi

echo "🌐 Проверка Nginx..."
sleep 5
if curl -f http://localhost/health 2>/dev/null; then
    echo "✅ Nginx работает"
else
    echo "❌ Nginx не работает"
fi

echo ""
echo "🎉 Исправление завершено!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Запустите backend: ./scripts/production/start-backend.sh"
echo "2. Запустите frontend: ./scripts/production/start-frontend.sh"
echo "3. Проверьте доступность: curl http://localhost/health"
