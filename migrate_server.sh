#!/bin/bash
# Скрипт миграции базы данных на сервере

echo "🔄 ЗАПУСК МИГРАЦИИ БАЗЫ ДАННЫХ"
echo "================================"

# Останавливаем backend
echo "📋 1. Остановка backend..."
docker-compose stop backend

# Запускаем миграцию
echo "📋 2. Запуск миграции..."
python migrate_database.py

# Перезапускаем backend
echo "📋 3. Перезапуск backend..."
docker-compose start backend

echo ""
echo "✅ МИГРАЦИЯ ЗАВЕРШЕНА!"
echo "======================="
echo "Теперь проверьте работу платформы"
