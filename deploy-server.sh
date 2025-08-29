#!/bin/bash

# Скрипт деплоя приложения на сервер
# Использование: ./deploy-server.sh [server_ip] [ssh_key_path]

set -e

SERVER_IP=${1:-"37.252.20.46"}
SSH_KEY=${2:-""}
PROJECT_NAME="agb_proj"
APP_DIR="/opt/${PROJECT_NAME}"

echo "🚀 Начинаем деплой на сервер ${SERVER_IP}"

# Проверяем, что мы не на сервере
if [ "$SERVER_IP" = "localhost" ] || [ "$SERVER_IP" = "127.0.0.1" ]; then
    echo "❌ Этот скрипт предназначен для деплоя на удаленный сервер"
    echo "Для локального запуска используйте: docker-compose up -d"
    exit 1
fi

# Функция для выполнения команд на сервере
remote_exec() {
    if [ -n "$SSH_KEY" ]; then
        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no root@$SERVER_IP "$1"
    else
        ssh -o StrictHostKeyChecking=no root@$SERVER_IP "$1"
    fi
}

echo "📦 Обновляем систему..."
remote_exec "apt update && apt upgrade -y"

echo "🐳 Устанавливаем Docker и Docker Compose..."
remote_exec "apt install -y docker.io docker-compose-v2 git curl"

echo "🔥 Включаем и запускаем Docker..."
remote_exec "systemctl enable docker && systemctl start docker"

echo "📁 Создаем директорию для приложения..."
remote_exec "mkdir -p ${APP_DIR}"

echo "📥 Клонируем репозиторий..."
remote_exec "cd ${APP_DIR} && git clone https://github.com/your-repo/${PROJECT_NAME}.git . 2>/dev/null || (echo 'Обновляем существующий репозиторий...' && git pull origin master)"

echo "🔧 Настраиваем переменные окружения..."
remote_exec "cd ${APP_DIR} && cp env.example .env 2>/dev/null || echo '.env уже существует'"

echo "🐘 Запускаем PostgreSQL..."
remote_exec "cd ${APP_DIR} && docker-compose -f docker-compose.prod.yml up -d postgres"

echo "⏳ Ждем запуска PostgreSQL..."
sleep 15

echo "🗄️ Инициализируем базу данных..."
remote_exec "cd ${APP_DIR} && ./init-production.sh"

echo "🚀 Запускаем приложение..."
remote_exec "cd ${APP_DIR} && docker-compose -f docker-compose.prod.yml up -d --build"

echo "⏳ Ждем запуска приложения..."
sleep 30

echo "📊 Проверяем статус сервисов..."
remote_exec "cd ${APP_DIR} && docker-compose -f docker-compose.prod.yml ps"

echo "🔍 Проверяем API..."
remote_exec "curl -f http://localhost/api/health || echo 'API недоступен'"

echo "✅ Деплой завершен!"
echo ""
echo "🌐 Приложение доступно по адресу: http://${SERVER_IP}"
echo "📱 API доступно по адресу: http://${SERVER_IP}/api"
echo ""
echo "🔑 Данные для входа:"
echo "Логин: admin"
echo "Пароль: admin123"
echo ""
echo "📋 Следующие шаги:"
echo "1. Настройте домен (опционально)"
echo "2. Настройте SSL сертификат"
echo "3. Проверьте работоспособность всех функций"
