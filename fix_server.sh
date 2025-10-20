#!/bin/bash

# Быстрое исправление проблем с API URL на сервере
# Использование: ./fix_server.sh [server_ip] [username]

SERVER_IP=${1:-89.23.99.86}
USERNAME=${2:-root}
PROJECT_PATH="/root/agb_proj"

echo "🔧 Быстрое исправление сервера: $SERVER_IP"

# Обновляем код
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && git pull"

# Исправляем переменную окружения
ssh $USERNAME@$SERVER_IP "sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP/api|' $PROJECT_PATH/config/env/production.env"

# Перезапускаем frontend
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart frontend"

echo "✅ Готово! Проверьте приложение: http://$SERVER_IP"
