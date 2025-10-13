#!/bin/bash

# Скрипт для исправления проблем с PostgreSQL
# Использование: ./fix-postgres-issues.sh

set -e

echo "🔧 Исправление проблем с PostgreSQL"
echo "===================================="

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

echo "📋 Конфигурация:"
echo "   - База данных: $POSTGRES_DB"
echo "   - Пользователь: $POSTGRES_USER"
echo "   - Пароль: [скрыт]"
echo ""

# Останавливаем контейнеры
echo "🛑 Остановка контейнеров..."
docker-compose -f docker-compose.production.yml down

# Удаляем том PostgreSQL для полной переинициализации
echo "🗑️  Удаление старого тома PostgreSQL..."
docker volume rm agb_proj_postgres_data 2>/dev/null || true

# Создаем новый скрипт инициализации
echo "📝 Создание скрипта инициализации..."
mkdir -p infrastructure/postgres

cat > infrastructure/postgres/init.sql << EOF
-- Дополнительная настройка PostgreSQL после автоматической инициализации
-- Пользователь и основная база данных уже созданы через переменные окружения

-- Создаем базу данных для N8N (если не существует)
SELECT 'CREATE DATABASE $N8N_DB OWNER $POSTGRES_USER'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$N8N_DB')\gexec

-- Предоставляем права на базу данных N8N
GRANT ALL PRIVILEGES ON DATABASE $N8N_DB TO $POSTGRES_USER;

-- Подключаемся к основной базе данных
\c $POSTGRES_DB;

-- Предоставляем права на схему public
GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;

-- Устанавливаем права по умолчанию
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;

-- Подключаемся к базе данных N8N
\c $N8N_DB;

-- Предоставляем права на схему public для N8N
GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;

-- Устанавливаем права по умолчанию для N8N
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;

-- Выводим информацию о созданных объектах
SELECT 'Пользователи:' as info;
SELECT usename FROM pg_user WHERE usename IN ('$POSTGRES_USER');

SELECT 'Базы данных:' as info;
SELECT datname FROM pg_database WHERE datname IN ('$POSTGRES_DB', '$N8N_DB');
EOF

echo "✅ Скрипт инициализации создан"

# Запускаем только PostgreSQL
echo "🐳 Запуск PostgreSQL..."
docker-compose -f docker-compose.production.yml up -d postgres

# Ждем готовности PostgreSQL
echo "⏳ Ожидание готовности PostgreSQL..."
sleep 10

# Проверяем подключение
echo "🔍 Проверка подключения к PostgreSQL..."
until docker exec agb_postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; do
    echo "   Ожидание PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL готов!"

# Проверяем созданные пользователи и базы
echo "📊 Проверка созданных объектов..."
docker exec agb_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\du"
docker exec agb_postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\l"

echo ""
echo "🎉 Проблемы с PostgreSQL исправлены!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Запустите все сервисы: docker-compose -f docker-compose.production.yml up -d"
echo "2. Проверьте статус: docker-compose -f docker-compose.production.yml ps"
echo "3. Запустите backend: ./scripts/production/start-backend.sh"
echo "4. Запустите frontend: ./scripts/production/start-frontend.sh"
