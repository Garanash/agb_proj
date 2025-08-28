#!/bin/bash

echo "🚀 Начинаем production деплой проекта Felix..."

# Проверка переменных окружения
if [ -z "$DOMAIN" ]; then
    echo "❌ Ошибка: не установлена переменная DOMAIN"
    echo "Установите переменную окружения DOMAIN перед запуском"
    exit 1
fi

# Остановка существующих контейнеров
echo "📦 Останавливаем существующие контейнеры..."
docker-compose -f docker-compose.prod.yml down

# Удаление старых образов
echo "🗑️ Удаляем старые образы..."
docker-compose -f docker-compose.prod.yml down --rmi all

# Создание SSL сертификатов (если не существуют)
if [ ! -d "./ssl" ]; then
    echo "🔐 Создаем SSL сертификаты..."
    mkdir -p ssl
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/nginx.key -out ssl/nginx.crt \
        -subj "/C=KZ/ST=Almaty/L=Almaty/O=Almazgeobur/CN=$DOMAIN"
fi

# Создание nginx конфигурации
echo "🌐 Создаем nginx конфигурацию..."
cat > nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8000;
    }

    server {
        listen 80;
        server_name $DOMAIN;
        return 301 https://\$server_name\$request_uri;
    }

    server {
        listen 443 ssl;
        server_name $DOMAIN;

        ssl_certificate /etc/nginx/ssl/nginx.crt;
        ssl_certificate_key /etc/nginx/ssl/nginx.key;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        location / {
            proxy_pass http://frontend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }

        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF

# Сборка и запуск
echo "🔨 Собираем и запускаем контейнеры..."
docker-compose -f docker-compose.prod.yml up --build -d

# Ждем запуска базы данных
echo "⏳ Ждем запуска базы данных..."
sleep 15

# Проверка здоровья сервисов
echo "🏥 Проверяем здоровье сервисов..."
docker-compose -f docker-compose.prod.yml ps

# Создание таблиц и администратора
echo "🗄️ Создаем таблицы базы данных..."
docker-compose -f docker-compose.prod.yml exec backend python create_tables.py

echo "👤 Создаем администратора..."
docker-compose -f docker-compose.prod.yml exec backend python init_db.py

echo "✅ Production деплой завершен!"
echo ""
echo "🌐 Доступ к приложению:"
echo "Frontend: https://$DOMAIN"
echo "Backend API: https://$DOMAIN/api"
echo "База данных: localhost:5432 (только локально)"
echo ""
echo "🔑 Данные для входа:"
echo "Логин: admin"
echo "Пароль: neurofork1"
echo ""
echo "📋 Полезные команды:"
echo "Просмотр логов: docker-compose -f docker-compose.prod.yml logs -f"
echo "Остановка: docker-compose -f docker-compose.prod.yml down"
echo "Перезапуск: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "🔒 Безопасность:"
echo "- Все сервисы доступны только через nginx"
"- SSL сертификаты настроены"
"- Health checks включены"
