#!/bin/bash

# Скрипт для исправления проблем с фронтендом
# Запускать на сервере

set -e

echo "🔧 Исправление проблем с фронтендом"
echo "==================================="
echo ""

# 1. Остановка сервисов
echo "1. 🛑 Остановка сервисов..."
docker-compose down
echo ""

# 2. Очистка образов (опционально, для полной пересборки)
read -p "Очистить Docker образы? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Очистка Docker образов..."
    docker-compose down --rmi all
    docker system prune -f
    echo ""
fi

# 3. Пересборка и запуск
echo "2. 🚀 Пересборка и запуск сервисов..."
docker-compose up -d --build
echo ""

# 4. Ожидание запуска
echo "3. ⏳ Ожидание запуска сервисов..."
sleep 30

# 5. Проверка статуса
echo "4. 📊 Проверка статуса:"
docker-compose ps
echo ""

# 6. Тестирование
echo "5. 🧪 Тестирование:"

echo "   - API health:"
curl -s http://localhost/api/health | jq '.' 2>/dev/null || echo "   ❌ API недоступен"

echo ""
echo "   - Frontend:"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$HTTP_STATUS" = "200" ]; then
    echo "   ✅ Frontend доступен"
else
    echo "   ❌ Frontend недоступен (HTTP $HTTP_STATUS)"
fi

echo ""
echo "   - Аутентификация:"
AUTH_TEST=$(curl -s -X POST -H "Content-Type: application/json" -d '{"username": "admin", "password": "admin123"}' http://localhost/api/auth/login)
if echo "$AUTH_TEST" | grep -q "access_token"; then
    echo "   ✅ Аутентификация работает"
else
    echo "   ❌ Аутентификация не работает"
fi

echo ""

# 7. Инструкции
echo "6. 🌐 Инструкции для браузера:"
echo ""
echo "   Теперь попробуйте открыть в браузере:"
echo "   http://37.252.20.46"
echo ""
echo "   Данные для входа:"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""
echo "   Если проблемы остались:"
echo "   1. Очистите кеш браузера (Ctrl+F5)"
echo "   2. Попробуйте в режиме инкогнито"
echo "   3. Проверьте логи: docker-compose logs -f"
echo "   4. Запустите диагностику: ./debug-browser.sh"
