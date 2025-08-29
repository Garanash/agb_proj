#!/bin/bash

# Скрипт для быстрого обновления frontend на сервере
# Запускать на сервере после внесения изменений в код

echo "🔄 ОБНОВЛЕНИЕ FRONTEND"
echo "======================"
echo ""

echo "1. 🛑 Останавливаем frontend..."
docker-compose stop frontend

echo ""
echo "2. 🧹 Очищаем кеш и билды..."
docker-compose exec frontend sh -c "rm -rf .next node_modules/.cache"

echo ""
echo "3. 🚀 Перезапускаем frontend..."
docker-compose up -d frontend

echo ""
echo "4. ⏳ Ждем запуска..."
sleep 10

echo ""
echo "5. 📊 Проверяем статус:"
docker-compose ps frontend

echo ""
echo "6. 🧪 Проверяем доступность:"
curl -s -I http://localhost/ | head -1

echo ""
echo "✅ Frontend обновлен!"
echo ""
echo "🌐 Попробуйте открыть: http://37.252.20.46"
echo ""
echo "📝 Если проблемы остались:"
echo "   ./troubleshoot-login.sh"
