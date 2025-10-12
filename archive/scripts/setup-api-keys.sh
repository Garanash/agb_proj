#!/bin/bash

# 🔑 AGB Project - Настройка API ключей
# Запустите этот скрипт после deploy-server.sh для настройки API ключей

set -e

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "🔑 Настройка API ключей для AGB Project"
echo "========================================"
echo ""

# Проверяем наличие production.env
if [ ! -f "config/env/production.env" ]; then
    log_warning "Файл config/env/production.env не найден!"
    log_info "Сначала запустите deploy-server.sh"
    exit 1
fi

echo "Введите ваши API ключи (или нажмите Enter для пропуска):"
echo ""

# OpenAI API Key
read -p "🔹 OpenAI API Key: " openai_key
if [ ! -z "$openai_key" ]; then
    sed -i "s/OPENAI_API_KEY=your_openai_key_here/OPENAI_API_KEY=$openai_key/" config/env/production.env
    log_success "OpenAI API Key обновлен"
fi

# Polza API Key
read -p "🔹 Polza API Key: " polza_key
if [ ! -z "$polza_key" ]; then
    sed -i "s/POLZA_API_KEY=your_polza_key_here/POLZA_API_KEY=$polza_key/" config/env/production.env
    log_success "Polza API Key обновлен"
fi

# Домен
read -p "🔹 Домен (например, yourdomain.com) [localhost]: " domain
if [ ! -z "$domain" ]; then
    sed -i "s/DOMAIN=localhost/DOMAIN=$domain/" config/env/production.env
    sed -i "s/FRONTEND_URL=http:\/\/localhost/FRONTEND_URL=https:\/\/$domain/" config/env/production.env
    sed -i "s/BACKEND_URL=http:\/\/localhost\/api/BACKEND_URL=https:\/\/$domain\/api/" config/env/production.env
    sed -i "s/NEXT_PUBLIC_API_URL=http:\/\/localhost\/api/NEXT_PUBLIC_API_URL=https:\/\/$domain\/api/" config/env/production.env
    log_success "Домен обновлен на $domain"
fi

# Email для SSL
read -p "🔹 Email для SSL сертификатов [admin@localhost]: " ssl_email
if [ ! -z "$ssl_email" ]; then
    sed -i "s/SSL_EMAIL=admin@localhost/SSL_EMAIL=$ssl_email/" config/env/production.env
    log_success "SSL email обновлен"
fi

echo ""
log_info "Перезапускаем сервисы с новыми настройками..."
docker-compose restart

echo ""
log_success "Настройка API ключей завершена!"
echo ""
echo "🌐 Приложение доступно по адресу:"
if [ ! -z "$domain" ] && [ "$domain" != "localhost" ]; then
    echo "   https://$domain"
else
    echo "   http://localhost"
fi
echo ""
echo "🔧 Для применения изменений домена может потребоваться:"
echo "   1. Настройка DNS записей"
echo "   2. Настройка SSL сертификатов"
echo "   3. Перезапуск Nginx"
