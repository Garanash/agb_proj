#!/bin/bash

echo "🔧 Обновление production.env для существующих учетных данных..."
echo "=================================================================="

# Перейти в директорию проекта
cd ~/agb_proj

echo "📋 Шаг 1: Создаем резервную копию production.env..."
cp production.env production.env.backup

echo "✅ Резервная копия создана"

echo "📋 Шаг 2: Обновляем production.env с существующими учетными данными..."

# Обновляем переменные для использования существующих учетных данных
cat > production.env << 'EOF'
# ПРОДАКШЕН КОНФИГУРАЦИЯ AGB ПРОЕКТА
# Обновлено для использования существующих учетных данных базы данных

# База данных PostgreSQL (используем существующие данные)
POSTGRES_DB=test_platform_db
POSTGRES_USER=test_user
POSTGRES_PASSWORD=test_password
DATABASE_URL=postgresql+asyncpg://test_user:test_password@postgres:5432/test_platform_db

# Backend - FastAPI
SECRET_KEY=your-super-secret-key-change-this-in-production-2024
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
PYTHONWARNINGS=ignore:Unverified HTTPS request
AUTO_INIT_DATA=true

# Frontend - Next.js
NEXT_PUBLIC_API_URL=http://localhost/api
NODE_ENV=production

# Nginx
NGINX_PORT=80
NGINX_SSL_PORT=443

# Администратор по умолчанию
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@almazgeobur.ru
ADMIN_FIRST_NAME=Администратор
ADMIN_LAST_NAME=Системы

# Домен (для SSL)
DOMAIN=localhost

# SSL настройки
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem

# Мониторинг (опционально)
WATCHTOWER_CLEANUP=true
WATCHTOWER_POLL_INTERVAL=3600
EOF

echo "✅ production.env обновлен"

echo "📋 Шаг 3: Проверяем новые настройки..."
echo "----------------------------------------"
echo "POSTGRES_DB: $(grep POSTGRES_DB production.env | cut -d'=' -f2)"
echo "POSTGRES_USER: $(grep POSTGRES_USER production.env | cut -d'=' -f2)"
echo "DATABASE_URL: $(grep DATABASE_URL production.env | head -1 | cut -d'=' -f2)"
echo "----------------------------------------"

echo ""
echo "✅ Обновление завершено!"
echo "=================================================================="
echo "Теперь production.env использует существующие учетные данные"
echo ""
echo "Для восстановления выполните:"
echo "cp production.env.backup production.env"
