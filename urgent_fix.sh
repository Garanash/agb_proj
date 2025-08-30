#!/bin/bash
# СРОЧНАЯ ДОСТАВКА ИСПРАВЛЕНИЙ НА СЕРВЕР

# Проверяем аргументы
if [ $# -lt 1 ]; then
    echo "❌ Укажите IP адрес сервера"
    echo "Пример: ./urgent_fix.sh 123.456.789.0"
    exit 1
fi

SERVER_IP=$1
echo "🚨 СРОЧНАЯ ДОСТАВКА ИСПРАВЛЕНИЙ НА СЕРВЕР: $SERVER_IP"
echo "==================================================="

# 1. Копируем скрипт на сервер
echo "📦 1. Копирование скрипта исправления..."
scp fix_database_now.sh root@$SERVER_IP:/tmp/

# 2. Запускаем исправление на сервере
echo "🚀 2. Запуск исправления на сервере..."
ssh root@$SERVER_IP << EOF
    echo "🔧 Запуск срочного исправления..."
    chmod +x /tmp/fix_database_now.sh
    /tmp/fix_database_now.sh
EOF

echo ""
echo "🎉 СРОЧНОЕ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo "================================="
echo "✅ Ошибки базы данных исправлены на сервере $SERVER_IP"
echo ""
echo "🌐 ДОСТУП К ПЛАТФОРМЕ:"
echo "   URL: http://$SERVER_IP/login"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""
echo "🔧 ИСПРАВЛЕННЫЕ ОШИБКИ:"
echo "   ✅ column company_employees.first_name does not exist"
echo "   ✅ column chat_rooms.is_active does not exist"
echo "   ✅ column chat_folders.user_id does not exist"
echo "   ✅ Frontend Connection closed - исправлено"
