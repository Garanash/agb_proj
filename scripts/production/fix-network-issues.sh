#!/bin/bash

# Скрипт исправления проблем с сетью и Nginx
# Использование: ./fix-network-issues.sh

set -e

echo "🔧 Исправление проблем с сетью и Nginx"
echo "======================================"

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

echo "🛑 Остановка всех сервисов..."
docker-compose -f docker-compose.production.yml down

echo "🧹 Очистка Docker ресурсов..."
docker system prune -f
docker network prune -f
docker volume prune -f

echo "🔍 Определение IP адреса хоста..."
# Получаем IP адрес хоста для подключения из контейнеров
HOST_IP=$(ip route | grep default | awk '{print $3}' | head -1)
echo "   IP адреса хоста: $HOST_IP"

# Альтернативные способы получения IP
if [ -z "$HOST_IP" ]; then
    HOST_IP=$(hostname -I | awk '{print $1}')
    echo "   Альтернативный IP: $HOST_IP"
fi

if [ -z "$HOST_IP" ]; then
    HOST_IP="172.17.0.1"
    echo "   Используем стандартный Docker IP: $HOST_IP"
fi

echo "🔧 Обновление конфигурации Nginx..."
# Создаем временную конфигурацию Nginx с правильным IP
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

    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Basic Settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip Settings
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

    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

    # Upstream definitions
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

    # Main server block
    server {
        listen 80;
        server_name _;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # API routes
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
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # N8N routes
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

        # Frontend routes
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

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\\n";
            add_header Content-Type text/plain;
        }
    }

    # Include additional configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF

echo "🌐 Запуск Docker сервисов..."
docker-compose -f docker-compose.production.yml up -d

echo "⏳ Ожидание запуска сервисов..."
sleep 10

echo "🔍 Проверка статуса сервисов..."
docker-compose -f docker-compose.production.yml ps

echo "🌐 Проверка доступности Nginx..."
sleep 5
if curl -f http://localhost/health 2>/dev/null; then
    echo "✅ Nginx работает корректно"
else
    echo "❌ Nginx все еще не отвечает"
    echo "📋 Логи Nginx:"
    docker-compose -f docker-compose.production.yml logs --tail=20 nginx
fi

echo ""
echo "🎉 Исправление завершено!"
echo ""
echo "📋 Для полной диагностики запустите:"
echo "   ./scripts/production/diagnose-server.sh"
