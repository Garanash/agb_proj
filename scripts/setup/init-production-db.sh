#!/bin/bash

# Скрипт инициализации базы данных для продакшн
# Этот скрипт выполняется при первом запуске PostgreSQL

set -e

echo "🔧 Инициализация базы данных для продакшн..."

# Создаем пользователя и базу данных
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Пользователь и база данных уже созданы через переменные окружения
    -- Проверяем, что все правильно настроено
    
    -- Создаем расширения если нужно
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    
    -- Выводим информацию о созданных объектах
    SELECT 'Пользователи:' as info;
    SELECT usename FROM pg_user WHERE usename = '$POSTGRES_USER';
    
    SELECT 'База данных:' as info;
    SELECT datname FROM pg_database WHERE datname = '$POSTGRES_DB';
    
    -- Предоставляем все права пользователю
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
    GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;
    
    -- Устанавливаем права по умолчанию
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;
EOSQL

echo "✅ Инициализация базы данных завершена!"