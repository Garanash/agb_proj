#!/bin/bash

# Быстрый перезапуск всех сервисов
# Полезно при проблемах с доступом

echo "🔄 Быстрый перезапуск сервисов"
echo "=============================="
echo ""

echo "1. 🛑 Остановка всех сервисов..."
docker-compose down

echo ""
echo "2. 🚀 Запуск всех сервисов..."
docker-compose up -d

echo ""
echo "3. ⏳ Ожидание запуска..."
sleep 15

echo ""
echo "4. 📊 Статус сервисов:"
docker-compose ps

echo ""
echo "5. 🧪 Быстрая проверка:"
echo "   - API: $(curl -s http://localhost/api/health | jq -r '.status' 2>/dev/null || echo 'недоступен')"
echo "   - Frontend: $(curl -s -I http://localhost/ | head -1 | cut -d' ' -f2 || echo 'недоступен')"

echo ""
echo "✅ Перезапуск завершен!"
echo ""
echo "🌐 Попробуйте открыть: http://37.252.20.46"
