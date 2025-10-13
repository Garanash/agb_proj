-- Инициализация базы данных для продакшн деплоя
-- Этот файл выполняется при первом запуске PostgreSQL контейнера

-- Создание базы данных для N8N
CREATE DATABASE n8n_production;

-- Создание пользователя для N8N (если нужен отдельный)
-- CREATE USER n8n_user WITH PASSWORD 'n8n_password';
-- GRANT ALL PRIVILEGES ON DATABASE n8n_production TO n8n_user;

-- Расширения для PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Настройки для оптимизации
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Перезагрузка конфигурации
SELECT pg_reload_conf();
