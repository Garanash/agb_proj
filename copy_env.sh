#!/bin/bash

# Простая команда для копирования environment файла на сервер
# Использование: ./copy_env.sh <server_ip> [username]

SERVER_IP=${1:-89.23.99.86}
USERNAME=${2:-root}
PROJECT_PATH="/root/agb_proj"

echo "📤 Копирование production.env на сервер $SERVER_IP..."

# Создаем директорию на сервере
ssh $USERNAME@$SERVER_IP "mkdir -p $PROJECT_PATH/config/env"

# Копируем файл
scp config/env/production.env $USERNAME@$SERVER_IP:$PROJECT_PATH/config/env/production.env

echo "✅ Готово! Environment файл скопирован на сервер"
echo "🌐 Сервер: $USERNAME@$SERVER_IP:$PROJECT_PATH/config/env/production.env"
