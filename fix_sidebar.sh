#!/bin/bash

# Быстрое исправление проблемы с боковым меню на сервере
# Использование: ./fix_sidebar.sh <server_ip> [username]

SERVER_IP=${1:-89.23.99.86}
USERNAME=${2:-root}
PROJECT_PATH="/root/agb_proj"

echo "🔧 Исправление проблемы с боковым меню на сервере $SERVER_IP..."

# Обновляем код
echo "📥 Обновление кода..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && git pull && git reset --hard origin/master"

# Перезапускаем сервисы
echo "🔄 Перезапуск сервисов..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart"

# Ждем запуска
echo "⏳ Ожидание запуска (30 секунд)..."
sleep 30

echo "✅ Готово! Проверьте приложение: http://$SERVER_IP"
