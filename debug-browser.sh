#!/bin/bash

# Скрипт для диагностики проблем с браузером
# Запускать на сервере для проверки доступности из браузера

set -e

echo "🔍 Диагностика проблем с доступом из браузера"
echo "=============================================="
echo ""

# 1. Проверка статуса сервисов
echo "1. 📊 Статус контейнеров:"
docker-compose ps
echo ""

# 2. Проверка API доступности
echo "2. 🔗 Проверка API endpoints:"

echo "   - Health check:"
curl -s http://localhost/api/health | jq '.' 2>/dev/null || echo "   ❌ API недоступен"

echo ""
echo "   - API root:"
curl -s http://localhost/api/ | jq '.' 2>/dev/null || echo "   ❌ API root недоступен"

echo ""
echo "   - Auth test:"
AUTH_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"username": "admin", "password": "admin123"}' http://localhost/api/auth/login)
if echo "$AUTH_RESPONSE" | grep -q "access_token"; then
    echo "   ✅ Аутентификация работает"
    TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.access_token')
else
    echo "   ❌ Аутентификация не работает"
    echo "   Ответ: $AUTH_RESPONSE"
fi

echo ""

# 3. Проверка nginx
echo "3. 🌐 Проверка nginx:"

echo "   - HTTP root:"
HTTP_ROOT=$(curl -s -I http://localhost/ | head -1)
if echo "$HTTP_ROOT" | grep -q "200"; then
    echo "   ✅ HTTP root работает"
else
    echo "   ❌ HTTP root не работает: $HTTP_ROOT"
fi

echo ""
echo "   - API через nginx:"
API_NGINX=$(curl -s http://localhost/api/health)
if echo "$API_NGINX" | grep -q "healthy"; then
    echo "   ✅ API через nginx работает"
else
    echo "   ❌ API через nginx не работает: $API_NGINX"
fi

echo ""

# 4. Проверка CORS
echo "4. 🔒 Проверка CORS:"

echo "   - OPTIONS запрос:"
OPTIONS_RESPONSE=$(curl -s -X OPTIONS -H "Origin: http://localhost" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" http://localhost/api/auth/login -I)
if echo "$OPTIONS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo "   ✅ CORS настроен правильно"
else
    echo "   ❌ CORS не настроен: $OPTIONS_RESPONSE"
fi

echo ""

# 5. Проверка логов
echo "5. 📝 Последние ошибки в логах:"

echo "   - Backend логи:"
docker-compose logs --tail=5 backend 2>&1 | grep -E "(ERROR|Exception|500)" || echo "   ✅ Ошибок в backend нет"

echo ""
echo "   - Nginx логи:"
docker-compose logs --tail=5 nginx 2>&1 | grep -E "(error|404|500)" || echo "   ✅ Ошибок в nginx нет"

echo ""

# 6. Рекомендации
echo "6. 💡 Рекомендации:"
echo ""
echo "   Если проблемы с браузером:"
echo "   - Очистите кеш браузера (Ctrl+F5)"
echo "   - Попробуйте другой браузер"
echo "   - Проверьте, что порт 80 открыт в firewall"
echo ""
echo "   Если API не работает:"
echo "   - Проверьте логи: docker-compose logs backend"
echo "   - Проверьте переменные окружения"
echo ""
echo "   Если CORS проблемы:"
echo "   - Проверьте настройки в nginx.conf"
echo "   - Убедитесь, что Origin правильный"
echo ""
echo "   Тестовые команды:"
echo "   curl http://localhost/api/health"
echo "   curl http://localhost/"
echo "   docker-compose logs -f"
