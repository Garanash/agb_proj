#!/bin/bash

# 🚀 AGB Project - Быстрый запуск одной командой
# Автор: AI Assistant
# Версия: 1.0

set -e

echo "🚀 AGB Project - Быстрый запуск"
echo "==============================="

# Получаем IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

# Создаем production.env если его нет
if [ ! -f "config/env/production.env" ]; then
    echo "📝 Создание конфигурации..."
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    SECRET_KEY=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)
    
    mkdir -p config/env scripts/setup
    
    cat > config/env/production.env << EOF
POSTGRES_DB=agb_felix_prod
POSTGRES_USER=felix_prod_user
POSTGRES_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://felix_prod_user:$DB_PASSWORD@postgres:5432/agb_felix_prod
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$ADMIN_PASSWORD
ADMIN_EMAIL=admin@$SERVER_IP
ADMIN_FIRST_NAME=Администратор
ADMIN_LAST_NAME=Системы
NEXT_PUBLIC_API_URL=http://$SERVER_IP/api
NGINX_PORT=80
NGINX_SSL_PORT=443
REDIS_URL=redis://redis:6379/0
LOG_LEVEL=INFO
LOG_FILE=backend.log
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=xlsx,xls,pdf,doc,docx,txt,jpg,jpeg,png
ENABLE_METRICS=true
METRICS_PORT=9090
EOF
    
    echo "✅ Конфигурация создана"
    echo "🔑 Пароль админа: $ADMIN_PASSWORD"
fi

# Создаем скрипт инициализации БД
if [ ! -f "scripts/setup/init-production-db.sh" ]; then
    cat > scripts/setup/init-production-db.sh << 'EOF'
#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;
    GRANT ALL ON SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $POSTGRES_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $POSTGRES_USER;
EOSQL
EOF
    chmod +x scripts/setup/init-production-db.sh
fi

echo "🛑 Остановка существующих контейнеров..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down -v 2>/dev/null || true

echo "🔧 Исправление проблем с Docker..."
# Останавливаем все контейнеры проекта
docker stop agb_nginx_prod agb_frontend_prod agb_backend_prod agb_postgres_prod agb_redis_prod 2>/dev/null || true
# Удаляем контейнеры
docker rm agb_nginx_prod agb_frontend_prod agb_backend_prod agb_postgres_prod agb_redis_prod 2>/dev/null || true
# Удаляем сеть
docker network rm docker_app-network 2>/dev/null || true
# Удаляем volumes
docker volume rm docker_postgres_data docker_redis_data docker_uploads_data 2>/dev/null || true

echo "🚀 Запуск всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d

echo "⏳ Ожидание готовности сервисов (3 минуты)..."
sleep 180

echo "📊 Проверка статуса..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

echo ""
echo "🎉 Готово! Приложение запущено!"
echo ""
echo "📋 Доступные сервисы:"
echo "• Frontend: http://localhost"
echo "• Backend API: http://localhost:8000"
echo "• Swagger UI: http://localhost:8000/docs"
echo "• Health Check: http://localhost/api/health"
echo ""
echo "👤 Логин: admin"
echo "🔑 Пароль: $(grep ADMIN_PASSWORD config/env/production.env | cut -d'=' -f2)"
echo ""
echo "🛑 Остановить: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down"
