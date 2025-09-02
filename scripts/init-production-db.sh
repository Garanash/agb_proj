#!/bin/bash
set -e

echo "🚀 Инициализация production базы данных..."

# Ждем готовности PostgreSQL
until pg_isready -h localhost -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
    echo "⏳ Ожидание готовности PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL готов к работе"

# Создаем расширения если нужно
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- Создаем расширения
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    
    -- Настраиваем параметры для производительности
    ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
    ALTER SYSTEM SET max_connections = 200;
    ALTER SYSTEM SET shared_buffers = '256MB';
    ALTER SYSTEM SET effective_cache_size = '1GB';
    ALTER SYSTEM SET maintenance_work_mem = '64MB';
    ALTER SYSTEM SET checkpoint_completion_target = 0.9;
    ALTER SYSTEM SET wal_buffers = '16MB';
    ALTER SYSTEM SET default_statistics_target = 100;
    
    -- Перезагружаем конфигурацию
    SELECT pg_reload_conf();
    
    echo "✅ Расширения и настройки PostgreSQL созданы"
EOSQL

echo "🎉 Инициализация production базы данных завершена!"
