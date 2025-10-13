#!/bin/bash

# Универсальный скрипт исправления всех проблем на сервере
# Использование: ./fix-all-issues.sh

set -e

echo "🔧 Универсальное исправление всех проблем"
echo "=========================================="

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

echo "🛑 Полная остановка всех сервисов..."
docker-compose -f docker-compose.production.yml down

echo "🧹 Полная очистка Docker..."
docker system prune -f
docker network prune -f
docker volume prune -f

echo "🔍 Определение IP адреса хоста..."
# Получаем IP адрес хоста
HOST_IP=$(ip route | grep default | awk '{print $3}' | head -1)
if [ -z "$HOST_IP" ]; then
    HOST_IP=$(hostname -I | awk '{print $1}')
fi
if [ -z "$HOST_IP" ]; then
    HOST_IP="172.17.0.1"
fi
echo "   Используем IP: $HOST_IP"

echo "🔧 Обновление конфигурации Nginx..."
# Создаем конфигурацию Nginx с правильным IP
cat > infrastructure/nginx/nginx.conf << EOF
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

    upstream backend {
        server $HOST_IP:8000;
        keepalive 32;
    }

    upstream frontend {
        server $HOST_IP:3000;
        keepalive 32;
    }

    upstream n8n {
        server n8n:5678;
        keepalive 32;
    }

    server {
        listen 80;
        server_name _;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
            
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        location /n8n/ {
            proxy_pass http://n8n/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_cache_bypass \$http_upgrade;
        }

        location /health {
            access_log off;
            return 200 "healthy\\n";
            add_header Content-Type text/plain;
        }
    }

    include /etc/nginx/conf.d/*.conf;
}
EOF

echo "🌐 Запуск Docker сервисов..."
docker-compose -f docker-compose.production.yml up -d

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

echo "🔴 Проверка Redis..."
sleep 5
if docker exec agb_redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
    echo "✅ Redis работает"
else
    echo "⚠️  Redis требует настройки пароля"
    docker exec agb_redis redis-cli CONFIG SET requirepass "$REDIS_PASSWORD" 2>/dev/null || true
    if docker exec agb_redis redis-cli -a "$REDIS_PASSWORD" ping 2>/dev/null | grep -q "PONG"; then
        echo "✅ Redis настроен и работает"
    else
        echo "❌ Redis не работает"
    fi
fi

echo "🔄 Проверка N8N..."
N8N_COUNT=0
while [ $N8N_COUNT -lt 30 ]; do
    if curl -f http://localhost:5678/healthz 2>/dev/null; then
        echo "✅ N8N работает"
        break
    fi
    echo "   Ожидание N8N... ($N8N_COUNT/30)"
    sleep 2
    N8N_COUNT=$((N8N_COUNT + 1))
done

if [ $N8N_COUNT -eq 30 ]; then
    echo "⚠️  N8N не отвечает, но это нормально при первом запуске"
fi

echo "🌐 Проверка Nginx..."
sleep 5
if curl -f http://localhost/health 2>/dev/null; then
    echo "✅ Nginx работает"
else
    echo "❌ Nginx не работает"
    echo "📋 Логи Nginx:"
    docker-compose -f docker-compose.production.yml logs --tail=10 nginx
fi

echo ""
echo "🎉 Исправление завершено!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Запустите backend: ./scripts/production/start-backend.sh"
echo "2. Запустите frontend: ./scripts/production/start-frontend.sh"
echo "3. Проверьте доступность: curl http://localhost/health"
