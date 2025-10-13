#!/bin/bash

# Скрипт диагностики проблем на сервере
# Использование: ./diagnose-server.sh

set -e

echo "🔍 Диагностика проблем на сервере"
echo "================================="

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

echo "📋 Конфигурация:"
echo "   - База данных: $POSTGRES_DB на $POSTGRES_HOST:$POSTGRES_PORT"
echo "   - Redis: $REDIS_HOST:$REDIS_PORT"
echo "   - N8N: $N8N_HOST:$N8N_PORT"
echo "   - Backend: $BACKEND_HOST:$BACKEND_PORT"
echo "   - Frontend: $FRONTEND_HOST:$FRONTEND_PORT"
echo ""

# Проверяем Docker
echo "🐳 Проверка Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен!"
    exit 1
fi

echo "✅ Docker и Docker Compose установлены"

# Проверяем статус контейнеров
echo ""
echo "📊 Статус контейнеров:"
docker-compose -f docker-compose.production.yml ps

# Проверяем логи проблемных сервисов
echo ""
echo "📋 Логи Nginx (последние 20 строк):"
docker-compose -f docker-compose.production.yml logs --tail=20 nginx

echo ""
echo "📋 Логи N8N (последние 20 строк):"
docker-compose -f docker-compose.production.yml logs --tail=20 n8n

# Проверяем подключения
echo ""
echo "🔗 Проверка подключений..."

# PostgreSQL
echo "🗄️  PostgreSQL:"
if docker exec agb_postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; then
    echo "✅ PostgreSQL доступен"
else
    echo "❌ PostgreSQL недоступен"
fi

# Redis
echo "🔴 Redis:"
if docker exec agb_redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null; then
    echo "✅ Redis доступен"
else
    echo "❌ Redis недоступен"
fi

# N8N
echo "🔄 N8N:"
if curl -f http://localhost:5678/healthz 2>/dev/null; then
    echo "✅ N8N доступен"
else
    echo "❌ N8N недоступен"
fi

# Nginx
echo "🌐 Nginx:"
if curl -f http://localhost/health 2>/dev/null; then
    echo "✅ Nginx доступен"
else
    echo "❌ Nginx недоступен"
fi

# Проверяем порты
echo ""
echo "🔌 Проверка портов:"
echo "Порт 80 (Nginx):"
if netstat -tlnp | grep :80 >/dev/null; then
    echo "✅ Порт 80 открыт"
else
    echo "❌ Порт 80 закрыт"
fi

echo "Порт 5432 (PostgreSQL):"
if netstat -tlnp | grep :5432 >/dev/null; then
    echo "✅ Порт 5432 открыт"
else
    echo "❌ Порт 5432 закрыт"
fi

echo "Порт 6379 (Redis):"
if netstat -tlnp | grep :6379 >/dev/null; then
    echo "✅ Порт 6379 открыт"
else
    echo "❌ Порт 6379 закрыт"
fi

echo "Порт 5678 (N8N):"
if netstat -tlnp | grep :5678 >/dev/null; then
    echo "✅ Порт 5678 открыт"
else
    echo "❌ Порт 5678 закрыт"
fi

# Проверяем локальные сервисы
echo ""
echo "🖥️  Проверка локальных сервисов:"
echo "Backend (порт 8000):"
if netstat -tlnp | grep :8000 >/dev/null; then
    echo "✅ Backend запущен"
else
    echo "❌ Backend не запущен"
fi

echo "Frontend (порт 3000):"
if netstat -tlnp | grep :3000 >/dev/null; then
    echo "✅ Frontend запущен"
else
    echo "❌ Frontend не запущен"
fi

echo ""
echo "🎯 Рекомендации:"
echo "1. Если Nginx перезапускается - проверьте конфигурацию"
echo "2. Если N8N не отвечает - подождите инициализации базы данных"
echo "3. Если Redis требует аутентификацию - проверьте пароль"
echo "4. Если локальные сервисы не запущены - запустите их отдельно"
