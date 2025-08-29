#!/bin/bash

# Полная пересборка frontend с новыми изменениями
# Запускать на сервере после обновления кода

echo "🔄 ПОЛНАЯ ПЕРЕСБОРКА FRONTEND"
echo "============================"
echo ""

echo "1. 🛑 Останавливаем все сервисы..."
docker-compose down

echo ""
echo "2. 🧹 Очищаем старые образы..."
docker-compose rm -f frontend
docker rmi agb_proj_frontend:latest 2>/dev/null || true

echo ""
echo "3. 🚀 Пересобираем и запускаем все сервисы..."
docker-compose up -d --build

echo ""
echo "4. ⏳ Ждем полной загрузки..."
sleep 20

echo ""
echo "5. 📊 Проверяем статус:"
docker-compose ps

echo ""
echo "6. 🧪 Проверяем доступность:"
echo "   - Frontend: $(curl -s -I http://localhost/ | head -1)"
echo "   - API: $(curl -s http://localhost/api/health | jq -r '.status' 2>/dev/null || echo 'недоступен')"

echo ""
echo "✅ Frontend полностью пересобран!"
echo ""
echo "🌐 Попробуйте открыть: http://37.252.20.46/login"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""

echo "📝 Следующие шаги:"
echo "   1. Очистите кеш браузера (Ctrl+Shift+R)"
echo "   2. Попробуйте войти"
echo "   3. Если не работает - проверьте консоль браузера"
echo "   4. Запустите диагностику: ./test-frontend.sh"

