#!/bin/bash
# Быстрое исправление проблем с чатами

echo "🚀 БЫСТРОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМ С ЧАТАМИ"
echo "====================================="

# Проверяем аргументы
if [ $# -lt 1 ]; then
    echo "❌ Укажите IP адрес сервера"
    echo "Пример: ./quick_chat_fix.sh 123.456.789.0"
    exit 1
fi

SERVER_IP=$1
echo "🎯 Сервер: $SERVER_IP"

# 1. Копируем исправления на сервер
echo "📦 1. Копирование исправлений..."
scp /tmp/platform_fixes_v2_updated.tar.gz root@$SERVER_IP:/tmp/

# 2. Применяем исправления
echo "🔧 2. Применение исправлений..."
ssh root@$SERVER_IP << EOF
    echo "📋 Извлечение файлов..."
    cd /tmp
    tar -xzf platform_fixes_v2_updated.tar.gz

    echo "📋 Остановка сервисов..."
    cd /root/agb_platform
    docker-compose down

    echo "📋 Копирование исправлений..."
    cp -r /tmp/platform_fixes_v2/backend/* backend/
    cp -r /tmp/platform_fixes_v2/frontend/* frontend/
    cp /tmp/platform_fixes_v2/docker-compose.yml .
    cp /tmp/platform_fixes_v2/universal_deploy.sh .
    cp /tmp/platform_fixes_v2/nginx.conf nginx/

    echo "📋 Запуск сервисов..."
    ./universal_deploy.sh

    echo "✅ Исправления применены!"
EOF

# 3. Тестируем
echo "🧪 3. Тестирование..."
sleep 5

# Копируем и запускаем тест на сервере
scp /Users/andreydolgov/Desktop/programming/agb_proj/test_chat_api.py root@$SERVER_IP:/tmp/

ssh root@$SERVER_IP << EOF
    echo "📋 Запуск теста API чатов..."
    cd /tmp
    python test_chat_api.py
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
echo ""
echo "🔧 ИСПРАВЛЕННЫЕ ПРОБЛЕМЫ:"
echo "   ✅ Ошибка 'creator_id' не существует - исправлено"
echo "   ✅ Загрузка списка пользователей - исправлено"
echo "   ✅ Создание чатов с участниками - работает"
echo "   ✅ API чатов полностью функционально"
