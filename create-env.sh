#!/bin/bash

# Скрипт для создания .env файла для продакшн деплоя
# Использование: ./create-env.sh

set -e

echo "🚀 Создание .env файла для продакшн деплоя"
echo "=========================================="

# Функция для генерации случайного пароля
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Функция для генерации случайной строки
generate_secret() {
    openssl rand -hex 32
}

# Проверяем наличие openssl
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL не найден. Установите OpenSSL для генерации паролей."
    exit 1
fi

# Создаем .env файл
ENV_FILE=".env.production"

echo "📝 Создание файла $ENV_FILE..."

cat > "$ENV_FILE" << EOF
# ===========================================
# AGB Production Environment Configuration
# ===========================================
# Сгенерировано: $(date)
# ВНИМАНИЕ: Не коммитьте этот файл в Git!

# ===========================================
# DATABASE CONFIGURATION
# ===========================================
POSTGRES_DB=agb_production
POSTGRES_USER=agb_user
POSTGRES_PASSWORD=$(generate_password)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# N8N Database
N8N_DB=n8n_production

# ===========================================
# REDIS CONFIGURATION
# ===========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=$(generate_password)

# ===========================================
# APPLICATION CONFIGURATION
# ===========================================
# Backend
BACKEND_HOST=localhost
BACKEND_PORT=8000
BACKEND_URL=http://localhost:8000

# Frontend
FRONTEND_HOST=localhost
FRONTEND_PORT=3000
FRONTEND_URL=http://localhost:3000

# ===========================================
# SECURITY CONFIGURATION
# ===========================================
# JWT Secret (ОБЯЗАТЕЛЬНО измените в продакшне!)
JWT_SECRET_KEY=$(generate_secret)
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Keys
POLZA_API_KEY=your_polza_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# ===========================================
# N8N CONFIGURATION
# ===========================================
N8N_USER=admin
N8N_PASSWORD=$(generate_password)
N8N_HOST=localhost
N8N_PORT=5678

# ===========================================
# NGINX CONFIGURATION
# ===========================================
NGINX_HOST=localhost
NGINX_PORT=80

# ===========================================
# SYSTEM CONFIGURATION
# ===========================================
TIMEZONE=Europe/Moscow
DEBUG=False
ENVIRONMENT=production

# ===========================================
# LOGGING CONFIGURATION
# ===========================================
LOG_LEVEL=INFO
LOG_FILE=/var/log/agb/backend.log

# ===========================================
# FILE UPLOAD CONFIGURATION
# ===========================================
UPLOAD_MAX_SIZE=100MB
UPLOAD_PATH=/var/www/agb/uploads

# ===========================================
# EMAIL CONFIGURATION (если используется)
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_email_password
SMTP_TLS=True

# ===========================================
# TELEGRAM BOT CONFIGURATION (если используется)
# ===========================================
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/webhook/telegram

# ===========================================
# MONITORING CONFIGURATION
# ===========================================
ENABLE_METRICS=True
METRICS_PORT=9090

EOF

echo "✅ Файл $ENV_FILE создан успешно!"
echo ""
echo "🔧 Следующие шаги:"
echo "1. Отредактируйте $ENV_FILE и укажите ваши реальные значения"
echo "2. Особенно важно изменить:"
echo "   - API ключи (POLZA_API_KEY, OPENAI_API_KEY)"
echo "   - Email настройки (если используется)"
echo "   - Telegram bot token (если используется)"
echo "   - Доменное имя в TELEGRAM_WEBHOOK_URL"
echo "3. Скопируйте файл на сервер: scp $ENV_FILE user@server:/path/to/project/"
echo "4. НЕ КОММИТЬТЕ этот файл в Git!"
echo ""
echo "⚠️  ВАЖНО: Этот файл содержит секретные данные!"
echo "   Добавьте $ENV_FILE в .gitignore"
echo ""

# Добавляем .env.production в .gitignore если его там нет
if ! grep -q "\.env\.production" .gitignore 2>/dev/null; then
    echo ".env.production" >> .gitignore
    echo "✅ Добавлен .env.production в .gitignore"
fi

echo "🎉 Готово! Теперь вы можете настроить переменные окружения для продакшна."
