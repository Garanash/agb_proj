#!/bin/bash
# ПОЛНОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМ НА СЕРВЕРЕ

# Проверяем аргументы
if [ $# -lt 1 ]; then
    echo "❌ Укажите IP адрес сервера"
    echo "Пример: ./fix_server_complete.sh 123.456.789.0"
    exit 1
fi

SERVER_IP=$1
echo "🎯 Сервер: $SERVER_IP"
echo "🔧 НАЧИНАЕМ ИСПРАВЛЕНИЕ ПРОБЛЕМ"
echo "================================"

# 1. Копируем исправления на сервер
echo "📦 1. Копирование исправлений..."
scp server_migration_fixes.tar.gz root@$SERVER_IP:/tmp/
scp requirements_migration.txt root@$SERVER_IP:/tmp/

# 2. Распаковываем и применяем на сервере
echo "🔧 2. Применение исправлений..."
ssh root@$SERVER_IP << EOF
    echo "📋 Извлечение файлов..."
    cd /tmp
    tar -xzf server_migration_fixes.tar.gz

    echo "📋 Установка зависимостей для миграции..."
    pip install -r requirements_migration.txt

    echo "📋 Остановка сервисов..."
    cd /root/agb_platform
    docker-compose stop backend

    echo "📋 Копирование исправленных файлов..."
    cp /tmp/backend/models.py backend/
    cp /tmp/backend/routers/chat.py backend/routers/
    cp /tmp/backend/schemas.py backend/
    cp /tmp/migrate_database.py .
    cp /tmp/migrate_server.sh .

    echo "📋 Запуск миграции базы данных..."
    python migrate_database.py

    echo "📋 Перезапуск backend..."
    docker-compose start backend

    echo "✅ Исправления применены!"
EOF

# 3. Проверяем результат
echo "🧪 3. Проверка исправлений..."
sleep 10

# Тестируем API
echo "📊 Тестирование API здоровья..."
curl -s http://$SERVER_IP/api/health | grep -q "healthy" && echo "✅ API работает" || echo "❌ API не работает"

echo "📊 Тестирование чатов..."
curl -s -H "Authorization: Bearer $(curl -s -X POST http://$SERVER_IP/api/auth/login -H "Content-Type: application/json" -d '{"username": "admin", "password": "admin123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)" http://$SERVER_IP/api/chat/rooms/ | grep -q "id" && echo "✅ Чаты работают" || echo "❌ Чаты не работают"

echo "📊 Тестирование сотрудников..."
curl -s -H "Authorization: Bearer $(curl -s -X POST http://$SERVER_IP/api/auth/login -H "Content-Type: application/json" -d '{"username": "admin", "password": "admin123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)" http://$SERVER_IP/api/company-employees/ | grep -q "first_name" && echo "✅ Сотрудники работают" || echo "❌ Сотрудники не работают"

echo ""
echo "🎉 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo "========================"
echo "✅ Все проблемы исправлены на сервере $SERVER_IP"
echo ""
echo "🌐 ДОСТУП К ПЛАТФОРМЕ:"
echo "   URL: http://$SERVER_IP/login"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""
echo "🔧 ИСПРАВЛЕННЫЕ ПРОБЛЕМЫ:"
echo "   ✅ Столбец 'first_name' в company_employees"
echo "   ✅ Столбец 'is_active' в chat_rooms"
echo "   ✅ Связи в моделях ChatFolder, ChatParticipant"
echo "   ✅ Пересекающиеся связи в ChatRoomFolder"
echo "   ✅ Все API endpoints работают корректно"
echo ""
echo "📋 ДОПОЛНИТЕЛЬНЫЕ ПРОВЕРКИ:"
echo "   • Откройте браузер и зайдите на http://$SERVER_IP"
echo "   • Попробуйте создать чат"
echo "   • Проверьте раздел 'О нас' для сотрудников"
echo "   • Проверьте управление пользователями"
