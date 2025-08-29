#!/bin/bash

# ПРОДАКШЕН ДЕПЛОЙ AGB ПРОЕКТА НА LINUX СЕРВЕР
# Использование: ./deploy-production.sh [domain]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Функции логирования
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Проверка системных требований
check_system_requirements() {
    log "Проверяем системные требования..."

    # Проверяем ОС
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        error "Этот скрипт предназначен только для Linux систем"
        exit 1
    fi

    # Проверяем Docker
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен. Установите Docker:"
        echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
        echo "  sudo sh get-docker.sh"
        exit 1
    fi

    # Проверяем Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен. Установите Docker Compose"
        exit 1
    fi

    # Проверяем что пользователь в группе docker
    if ! groups $USER | grep &>/dev/null '\bdocker\b'; then
        warning "Пользователь не в группе docker. Добавьте командой:"
        echo "  sudo usermod -aG docker $USER"
        echo "  newgrp docker"
    fi

    success "Системные требования выполнены"
}

# Создание структуры директорий
setup_directories() {
    log "Создаем структуру директорий..."

    # Создаем основные директории
    sudo mkdir -p /opt/agb_project
    sudo mkdir -p /opt/agb_project/ssl
    sudo mkdir -p /opt/agb_project/backups
    sudo mkdir -p /var/log/agb

    # Устанавливаем права
    sudo chown -R $USER:$USER /opt/agb_project
    sudo chown -R $USER:$USER /var/log/agb

    success "Структура директорий создана"
}

# Копирование файлов проекта
copy_project_files() {
    log "Копируем файлы проекта..."

    # Копируем все файлы проекта
    cp -r . /opt/agb_project/

    # Удаляем ненужные файлы
    cd /opt/agb_project
    rm -rf .git
    rm -rf */node_modules
    rm -rf */__pycache__
    rm -rf */.next

    success "Файлы проекта скопированы"
}

# Настройка переменных окружения
setup_environment() {
    log "Настраиваем переменные окружения..."

    cd /opt/agb_project

    # Копируем пример env файла
    if [ ! -f .env ]; then
        cp production.env.example .env
        warning "Создан файл .env из production.env.example"
        warning "ОБЯЗАТЕЛЬНО отредактируйте .env файл перед продолжением!"
        echo ""
        echo "Ключевые параметры для изменения:"
        echo "  - POSTGRES_PASSWORD: пароль базы данных"
        echo "  - SECRET_KEY: секретный ключ (минимум 32 символа)"
        echo "  - ADMIN_PASSWORD: пароль администратора"
        echo "  - DOMAIN: ваш домен"
        echo ""

        read -p "Продолжить с текущими настройками? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Остановлено пользователем для настройки .env файла"
            exit 1
        fi
    fi

    success "Переменные окружения настроены"
}

# Настройка firewall
setup_firewall() {
    log "Настраиваем firewall..."

    # Проверяем UFW
    if command -v ufw &> /dev/null; then
        sudo ufw allow 80
        sudo ufw allow 443
        sudo ufw allow 15432  # PostgreSQL (если нужен внешний доступ)
        warning "Настроен UFW firewall"
    fi

    # Проверяем firewalld
    if command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-port=80/tcp
        sudo firewall-cmd --permanent --add-port=443/tcp
        sudo firewall-cmd --permanent --add-port=15432/tcp
        sudo firewall-cmd --reload
        warning "Настроен firewalld firewall"
    fi

    success "Firewall настроен"
}

# Генерация SSL сертификатов (самоподписанные для тестирования)
generate_ssl() {
    local domain=${1:-localhost}

    log "Генерируем SSL сертификаты для $domain..."

    cd /opt/agb_project/ssl

    # Генерируем самоподписанный сертификат
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
        -subj "/C=RU/ST=Moscow/L=Moscow/O=AGB/OU=IT/CN=$domain"

    # Устанавливаем правильные права
    chmod 600 key.pem
    chmod 644 cert.pem

    warning "Сгенерированы самоподписанные SSL сертификаты"
    warning "Для продакшена замените на Let's Encrypt или коммерческие сертификаты"

    success "SSL сертификаты готовы"
}

# Оптимизация docker-compose для продакшена
optimize_docker_compose() {
    log "Оптимизируем docker-compose для продакшена..."

    cd /opt/agb_project

    # Создаем docker-compose.prod.yml с оптимизациями
    cat > docker-compose.prod.yml << 'EOF'
services:
  # PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: agb_postgres_prod
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
      - ./backend/init_db.py:/docker-entrypoint-initdb.d/init_db.py:ro
      - ./backend/create_tables.py:/docker-entrypoint-initdb.d/create_tables.py:ro
    ports:
      - "15432:5432"
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3
    # Производительность
    command: postgres -c shared_preload_libraries=pg_stat_statements -c pg_stat_statements.track=all -c max_connections=200

  # Redis для кеширования (опционально)
  redis:
    image: redis:7-alpine
    container_name: agb_redis_prod
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Бекенд - FastAPI
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: agb_backend_prod
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - SECRET_KEY=${SECRET_KEY}
      - ALGORITHM=${ALGORITHM}
      - ACCESS_TOKEN_EXPIRE_MINUTES=${ACCESS_TOKEN_EXPIRE_MINUTES}
      - ADMIN_USERNAME=${ADMIN_USERNAME}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - ADMIN_FIRST_NAME=${ADMIN_FIRST_NAME}
      - ADMIN_LAST_NAME=${ADMIN_LAST_NAME}
      - PYTHONWARNINGS=${PYTHONWARNINGS}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/__pycache__
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Фронтенд - Next.js
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: agb_frontend_prod
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost/api
      - NODE_ENV=production
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile.prod
    container_name: agb_nginx_prod
    ports:
      - "${NGINX_PORT:-80}:80"
      - "${NGINX_SSL_PORT:-443}:443"
    depends_on:
      - frontend
      - backend
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_prod_data:
    driver: local
  nginx_logs:
    driver: local

networks:
  app-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
EOF

    success "Docker Compose оптимизирован для продакшена"
}

# Создание оптимизированных Dockerfile
create_optimized_dockerfiles() {
    log "Создаем оптимизированные Dockerfile..."

    cd /opt/agb_project

    # Backend production Dockerfile
    cat > backend/Dockerfile.prod << 'EOF'
FROM python:3.11-slim AS backend-prod

WORKDIR /app

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    wget \
    procps \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Копируем requirements и устанавливаем зависимости
COPY requirements.txt .
RUN pip install --no-cache-dir --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt

# Копируем исходный код
COPY . .

# Создаем пользователя для безопасности
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Открываем порт
EXPOSE 8000

# Запускаем приложение
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
EOF

    # Frontend production Dockerfile
    cat > frontend/Dockerfile.prod << 'EOF'
FROM node:18-alpine AS frontend-prod

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Копируем готовое приложение
COPY --from=0 /app ./
COPY --chown=nextjs:nodejs . .

USER nextjs

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]
EOF

    # Nginx production Dockerfile
    cat > nginx/Dockerfile.prod << 'EOF'
FROM nginx:alpine AS nginx-prod

# Копируем конфигурацию
COPY nginx.prod.conf /etc/nginx/nginx.conf

# Создаем директории для логов
RUN mkdir -p /var/log/nginx

# Проверяем конфигурацию
RUN nginx -t

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
EOF

    success "Оптимизированные Dockerfile созданы"
}

# Создание production nginx конфигурации
create_nginx_prod_config() {
    log "Создаем production nginx конфигурацию..."

    cd /opt/agb_project/nginx

    cat > nginx.prod.conf << 'EOF'
events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Логирование
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Производительность
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip компрессия
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
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

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

    # Upstream для бекенда
    upstream backend {
        server backend:8000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # Upstream для фронтенда
    upstream frontend {
        server frontend:3000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    server {
        listen 80;
        server_name _;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header X-Content-Security-Policy "default-src 'self'" always;

        # API маршруты
        location /api/ {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # CORS headers
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;

            # Обработка preflight запросов
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*';
                add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
            }
        }

        # Next.js статические файлы
        location /_next/ {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Health checks
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Nginx status
        location /nginx_status {
            stub_status on;
            access_log off;
            allow 127.0.0.1;
            deny all;
        }

        # Статические файлы
        location ~* \.(ico|css|js|gif|jpe?g|png|svg|woff|woff2|ttf|eot)$ {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA routing - все остальные запросы идут на фронтенд
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Server $host;

            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;

            # Fallback на index.html для SPA
            proxy_intercept_errors on;
            error_page 404 = @fallback;
        }

        # Fallback для Next.js routing
        location @fallback {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
            proxy_set_header X-Forwarded-Server $host;
        }
    }

    # HTTPS сервер (раскомментируйте для SSL)
    # server {
    #     listen 443 ssl http2;
    #     server_name yourdomain.com;
    #
    #     ssl_certificate /etc/nginx/ssl/cert.pem;
    #     ssl_certificate_key /etc/nginx/ssl/key.pem;
    #     ssl_protocols TLSv1.2 TLSv1.3;
    #     ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    #     ssl_prefer_server_ciphers off;
    #
    #     # Остальные настройки аналогичны HTTP серверу
    # }
}
EOF

    success "Production nginx конфигурация создана"
}

# Деплой приложения
deploy_application() {
    log "Разворачиваем приложение..."

    cd /opt/agb_project

    # Останавливаем существующие контейнеры
    if docker-compose ps -q | grep -q .; then
        log "Останавливаем существующие контейнеры..."
        docker-compose down --remove-orphans
    fi

    # Собираем и запускаем
    log "Собираем образы..."
    docker-compose -f docker-compose.prod.yml build --no-cache

    log "Запускаем сервисы..."
    docker-compose -f docker-compose.prod.yml up -d

    # Ждем запуска
    log "Ждем запуска сервисов..."
    sleep 60

    success "Приложение развернуто"
}

# Проверка деплоя
verify_deployment() {
    log "Проверяем развертывание..."

    cd /opt/agb_project

    # Проверяем контейнеры
    if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        error "Не все контейнеры запущены"
        docker-compose -f docker-compose.prod.yml ps
        return 1
    fi

    # Проверяем PostgreSQL
    if ! docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} &>/dev/null; then
        error "PostgreSQL не отвечает"
        return 1
    fi

    # Проверяем backend
    if ! curl -f http://localhost/api/health &>/dev/null; then
        error "Backend API не отвечает"
        return 1
    fi

    # Проверяем frontend
    if ! curl -f http://localhost &>/dev/null; then
        error "Frontend не отвечает"
        return 1
    fi

    success "Все сервисы работают корректно"
}

# Создание скриптов управления
create_management_scripts() {
    log "Создаем скрипты управления..."

    cd /opt/agb_project

    # Скрипт запуска
    cat > start.sh << 'EOF'
#!/bin/bash
cd /opt/agb_project
docker-compose -f docker-compose.prod.yml up -d
EOF

    # Скрипт остановки
    cat > stop.sh << 'EOF'
#!/bin/bash
cd /opt/agb_project
docker-compose -f docker-compose.prod.yml down
EOF

    # Скрипт перезапуска
    cat > restart.sh << 'EOF'
#!/bin/bash
cd /opt/agb_project
docker-compose -f docker-compose.prod.yml restart
EOF

    # Скрипт логов
    cat > logs.sh << 'EOF'
#!/bin/bash
cd /opt/agb_project
docker-compose -f docker-compose.prod.yml logs -f
EOF

    # Скрипт бэкапа
    cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/agb_project/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Бэкап базы данных
cd /opt/agb_project
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > $BACKUP_DIR/db_backup_$DATE.sql

# Сжатие бэкапа
gzip $BACKUP_DIR/db_backup_$DATE.sql

echo "Бэкап создан: $BACKUP_DIR/db_backup_$DATE.sql.gz"
EOF

    # Устанавливаем права на выполнение
    chmod +x *.sh

    success "Скрипты управления созданы"
}

# Основная функция
main() {
    local domain=${1:-localhost}

    log "🚀 Начинаем production деплой AGB проекта на домен: $domain"

    check_system_requirements
    setup_directories
    copy_project_files
    setup_environment
    setup_firewall
    generate_ssl "$domain"
    optimize_docker_compose
    create_optimized_dockerfiles
    create_nginx_prod_config
    deploy_application

    if verify_deployment; then
        create_management_scripts

        success "🎉 Деплой завершен успешно!"
        echo ""
        echo "📋 Информация о развертывании:"
        echo "   Домен: http://$domain"
        echo "   API: http://$domain/api"
        echo "   Health Check: http://$domain/health"
        echo ""
        echo "🛠️  Скрипты управления:"
        echo "   ./start.sh    - запуск"
        echo "   ./stop.sh     - остановка"
        echo "   ./restart.sh  - перезапуск"
        echo "   ./logs.sh     - просмотр логов"
        echo "   ./backup.sh   - создание бэкапа"
        echo ""
        echo "⚠️  Важно:"
        echo "   1. Измените пароли в .env файле"
        echo "   2. Настройте SSL сертификаты для HTTPS"
        echo "   3. Проверьте firewall настройки"
        echo "   4. Настройте бэкапы и мониторинг"
    else
        error "❌ Деплой завершился с ошибками"
        exit 1
    fi
}

# Обработка аргументов
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "Использование: $0 [domain]"
        echo ""
        echo "Аргументы:"
        echo "  domain    - домен для SSL сертификатов (по умолчанию: localhost)"
        echo ""
        echo "Примеры:"
        echo "  $0                    # деплой на localhost"
        echo "  $0 example.com       # деплой на example.com"
        exit 0
        ;;
    *)
        main "$@"
        ;;
esac

