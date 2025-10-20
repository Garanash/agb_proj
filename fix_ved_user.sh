#!/bin/bash

# Быстрое исправление проблемы с пользователем d.li на сервере
# Использование: ./fix_ved_user.sh

SERVER_IP="89.23.99.86"

echo "=== БЫСТРОЕ ИСПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ d.li НА СЕРВЕРЕ ==="
echo ""

echo "1. Копирование скрипта на сервер..."
scp scripts/check_and_create_ved_user.sh root@$SERVER_IP:/root/agb_proj/scripts/

if [ $? -eq 0 ]; then
    echo "✅ Скрипт скопирован на сервер"
else
    echo "❌ Ошибка копирования скрипта"
    echo "Попробуйте выполнить команды вручную на сервере:"
    echo ""
    echo "ssh root@$SERVER_IP"
    echo "cd /root/agb_proj"
    echo "chmod +x scripts/check_and_create_ved_user.sh"
    echo "./scripts/check_and_create_ved_user.sh"
    exit 1
fi

echo ""
echo "2. Выполнение скрипта на сервере..."
ssh root@$SERVER_IP "cd /root/agb_proj && chmod +x scripts/check_and_create_ved_user.sh && ./scripts/check_and_create_ved_user.sh"

echo ""
echo "=== ЗАВЕРШЕНО ==="
echo ""
echo "Теперь попробуйте войти как d.li / 123456 на http://$SERVER_IP"
