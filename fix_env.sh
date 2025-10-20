#!/bin/bash

# Быстрое исправление переменной окружения на сервере
# Использование: ./fix_env.sh [server_ip] [username]

SERVER_IP=${1:-89.23.99.86}
USERNAME=${2:-root}
PROJECT_PATH="/root/agb_proj"

echo "🔧 Исправление переменной окружения на сервере $SERVER_IP"

# Исправляем локально
sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://'"$SERVER_IP"'|' config/env/production.env

# Копируем на сервер
scp config/env/production.env $USERNAME@$SERVER_IP:$PROJECT_PATH/config/env/production.env

# Перезапускаем frontend
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart frontend"

echo "✅ Готово! Проверьте приложение: http://$SERVER_IP"
