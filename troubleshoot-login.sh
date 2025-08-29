#!/bin/bash

# Скрипт для диагностики проблем с входом в систему
# Запускать на сервере

echo "🔍 ДИАГНОСТИКА ПРОБЛЕМ С ВХОДОМ"
echo "==============================="
echo ""

# 1. Проверка API доступности
echo "1. 🧪 Проверка API доступности:"
echo ""

echo "   - Прямой доступ к API:"
API_DIRECT=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost/api/health)
echo "$API_DIRECT"
echo ""

echo "   - Через Nginx:"
API_NGINX=$(curl -s -w "\nHTTP_STATUS:%{http_code}\n" http://localhost/api/health)
echo "$API_NGINX"
echo ""

echo "   - Тест авторизации:"
AUTH_TEST=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  http://localhost/api/auth/login)
echo "$AUTH_TEST"
echo ""

# 2. Проверка Frontend
echo "2. 🌐 Проверка Frontend:"
echo ""

echo "   - Основная страница:"
FRONTEND_MAIN=$(curl -s -I http://localhost/ | head -1)
echo "$FRONTEND_MAIN"
echo ""

echo "   - Страница входа:"
FRONTEND_LOGIN=$(curl -s -I http://localhost/login | head -1)
echo "$FRONTEND_LOGIN"
echo ""

# 3. Проверка CORS
echo "3. 🔒 Проверка CORS headers:"
echo ""

echo "   - API health CORS:"
CORS_HEADERS=$(curl -s -I -H "Origin: http://37.252.20.46" http://localhost/api/health)
echo "$CORS_HEADERS"
echo ""

# 4. Проверка статических файлов
echo "4. 📁 Проверка статических файлов:"
echo ""

echo "   - Main CSS:"
CSS_CHECK=$(curl -s -I http://localhost/_next/static/css/0f0245c3d2967b3c.css | head -1)
echo "$CSS_CHECK"
echo ""

echo "   - Main JS:"
JS_CHECK=$(curl -s -I http://localhost/_next/static/chunks/main-app-ce281d8555633725.js | head -1)
echo "$JS_CHECK"
echo ""

# 5. Проверка конфигурации
echo "5. ⚙️ Проверка конфигурации:"
echo ""

if [ -f ".env" ]; then
    echo "   ✅ Файл .env найден"
    echo "   Содержимое .env:"
    cat .env | sed 's/^/     /'
else
    echo "   ❌ Файл .env не найден"
fi
echo ""

# 6. Проверка сетевых настроек
echo "6. 🌐 Проверка сетевых настроек:"
echo ""

echo "   - Docker сеть:"
docker network inspect agb_proj_app-network | jq -r '.Containers | to_entries[] | "\(.key): \(.value.Name) (\(.value.IPv4Address))"'
echo ""

echo "   - IP адреса контейнеров:"
docker inspect agb_backend agb_frontend agb_nginx | jq -r '.[] | "\(.Name): \(.NetworkSettings.Networks.agb_proj_app-network.IPAddress)"'
echo ""

# 7. Рекомендации
echo "7. 💡 РЕКОМЕНДАЦИИ:"
echo ""
echo "   Если API работает, но вход не проходит:"
echo "   1. Очистите кеш браузера (Ctrl+Shift+R или Ctrl+F5)"
echo "   2. Попробуйте режим инкогнито"
echo "   3. Проверьте консоль браузера (F12 → Console)"
echo "   4. Проверьте Network вкладку на ошибки"
echo ""
echo "   URL для входа: http://37.252.20.46/login"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""

# 8. Проверка на типичные проблемы
echo "8. 🔍 АНАЛИЗ ВОЗМОЖНЫХ ПРОБЛЕМ:"
echo ""

# Проверка API доступности из браузера
if curl -s http://localhost/api/health | grep -q "healthy"; then
    echo "   ✅ API доступен локально"
else
    echo "   ❌ API недоступен локально"
fi

# Проверка CORS
if curl -s -H "Origin: http://37.252.20.46" http://localhost/api/health | grep -q "healthy"; then
    echo "   ✅ API работает с CORS"
else
    echo "   ❌ Проблемы с CORS"
fi

# Проверка авторизации
if curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  http://localhost/api/auth/login | grep -q "access_token"; then
    echo "   ✅ Авторизация работает"
else
    echo "   ❌ Проблемы с авторизацией"
fi

# Проверка frontend
if curl -s -I http://localhost/ | grep -q "200"; then
    echo "   ✅ Frontend доступен"
else
    echo "   ❌ Frontend недоступен"
fi

echo ""
echo "   📝 Для дополнительной диагностики:"
echo "      docker-compose logs -f backend"
echo "      docker-compose logs -f frontend"
