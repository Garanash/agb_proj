#!/bin/bash

echo "🚀 БЫСТРЫЙ ЗАПУСК ЛОКАЛЬНОЙ СРЕДЫ РАЗРАБОТКИ"
echo "=============================================="

# Проверяем Docker
if ! docker --version > /dev/null 2>&1; then
    echo "❌ Docker не установлен или не запущен"
    echo "   Запустите Docker Desktop и попробуйте снова"
    exit 1
fi

echo "1. 🐳 Запуск Docker среды..."
docker-compose -f docker-compose.local.yml up -d

echo "2. ⏳ Ожидание запуска сервисов (30 секунд)..."
sleep 30

echo "3. 🔧 Проверка статуса контейнеров..."
docker ps | grep agb

echo "4. 🗄️ Создание таблиц базы данных..."
if [ -f "scripts/setup-database.sh" ]; then
    chmod +x scripts/setup-database.sh
    ./scripts/setup-database.sh
else
    echo "⚠️ Скрипт setup-database.sh не найден, пропускаем создание таблиц"
fi

echo "5. 🧪 Тестирование API..."
echo "   Backend Health:"
curl -s http://localhost:8000/api/health | jq . 2>/dev/null || echo "   Backend недоступен"

echo "   Frontend:"
curl -s http://localhost:3000 | head -1 2>/dev/null || echo "   Frontend недоступен"

echo ""
echo "✅ ГОТОВО! Локальная среда запущена"
echo ""
echo "📋 Доступные URL:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   Nginx: http://localhost"
echo ""
echo "👤 Данные для входа:"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""
echo "🛠️ Полезные команды:"
echo "   Просмотр логов: docker logs agb_backend_local"
echo "   Остановка: docker-compose -f docker-compose.local.yml down"
echo "   Перезапуск: docker-compose -f docker-compose.local.yml restart"
echo ""
echo "🌐 Открытие приложения в браузере..."
open http://localhost:3000 2>/dev/null || echo "   Откройте http://localhost:3000 в браузере"
