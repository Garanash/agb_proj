#!/bin/bash
set -euo pipefail

# Обертка: копирует и запускает server_full_reset.sh на сервере
# Использование: ./scripts/reset_server_remote.sh 89.23.99.86

SERVER_IP=${1:-}
if [ -z "$SERVER_IP" ]; then
  echo "Укажите IP сервера: ./scripts/reset_server_remote.sh <SERVER_IP>"
  exit 1
fi

REMOTE_DIR="/root/agb_proj/scripts"

echo "Копирую скрипт server_full_reset.sh на сервер $SERVER_IP..."
scp scripts/server_full_reset.sh root@$SERVER_IP:$REMOTE_DIR/

echo "Запускаю server_full_reset.sh на сервере..."
ssh root@$SERVER_IP "cd /root/agb_proj && chmod +x scripts/server_full_reset.sh && scripts/server_full_reset.sh"

echo "Готово."


