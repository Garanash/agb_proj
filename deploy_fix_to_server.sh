#!/bin/bash
# СКРИПТ ДОСТАВКИ ИСПРАВЛЕНИЙ НА СЕРВЕР

# Проверяем аргументы
if [ $# -lt 1 ]; then
    echo "❌ Укажите IP адрес сервера"
    echo "Пример: ./deploy_fix_to_server.sh 123.456.789.0"
    exit 1
fi

SERVER_IP=$1
echo "🎯 Доставка исправлений на сервер: $SERVER_IP"
echo "=========================================="

# 1. Копируем скрипт на сервер
echo "📦 1. Копирование скрипта исправления..."
scp server_fix_all.sh root@$SERVER_IP:/tmp/

# 2. Запускаем исправление на сервере
echo "🚀 2. Запуск исправления на сервере..."
ssh root@$SERVER_IP << EOF
    echo "🔧 Запуск исправления..."
    chmod +x /tmp/server_fix_all.sh
    /tmp/server_fix_all.sh
EOF

echo ""
echo "🎉 ГОТОВО!"
echo "=========="
echo "✅ Исправления применены на сервере $SERVER_IP"
echo ""
echo "🌐 ДОСТУП К ПЛАТФОРМЕ:"
echo "   URL: http://$SERVER_IP/login"
echo "   Логин: admin"
echo "   Пароль: admin123"
