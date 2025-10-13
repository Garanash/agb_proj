#!/bin/bash

# Быстрое исправление проблем с PostgreSQL на сервере
# Использование: ./quick-fix-postgres.sh

set -e

echo "🚀 Быстрое исправление PostgreSQL"
echo "================================="

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

echo "🛑 Остановка всех контейнеров..."
docker-compose -f docker-compose.production.yml down

echo "🗑️  Удаление проблемного тома PostgreSQL..."
docker volume rm agb_proj_postgres_data 2>/dev/null || true

echo "🧹 Очистка Docker сетей..."
docker network prune -f

echo "📝 Создание правильного скрипта инициализации..."
mkdir -p infrastructure/postgres

cat > infrastructure/postgres/init.sql << EOF
-- Дополнительная настройка PostgreSQL
-- Основной пользователь и база создаются автоматически

-- Создаем базу данных для N8N
CREATE DATABASE $N8N_DB OWNER $POSTGRES_USER;
GRANT ALL PRIVILEGES ON DATABASE $N8N_DB TO $POSTGRES_USER;

-- Настраиваем права для основной базы
\c $POSTGRES_DB;
GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;

-- Настраиваем права для базы N8N
\c $N8N_DB;
GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;
EOF

echo "🐳 Запуск PostgreSQL с новой конфигурацией..."
docker-compose -f docker-compose.production.yml up -d postgres

echo "⏳ Ожидание готовности PostgreSQL..."
sleep 15

echo "🔍 Проверка подключения..."
if docker exec agb_postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; then
    echo "✅ PostgreSQL работает корректно!"
    
    echo "📊 Проверка пользователей и баз данных..."
    docker exec agb_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\du" | head -10
    docker exec agb_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\l" | head -10
    
    echo ""
    echo "🎉 PostgreSQL исправлен!"
    echo ""
    echo "📋 Теперь запустите остальные сервисы:"
    echo "   docker-compose -f docker-compose.production.yml up -d"
    echo ""
    echo "🔍 Проверьте статус:"
    echo "   docker-compose -f docker-compose.production.yml ps"
else
    echo "❌ PostgreSQL все еще не работает"
    echo "   Проверьте логи: docker logs agb_postgres"
    exit 1
fi
