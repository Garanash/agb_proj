#!/bin/bash
# Полное исправление CORS и API URL проблем

echo "🔧 ПОЛНОЕ ИСПРАВЛЕНИЕ CORS И API ПРОБЛЕМ"
echo "========================================"

# Шаг 1: Останавливаем контейнеры
echo "📋 1. Останавливаем контейнеры..."
docker-compose down

# Шаг 2: Очищаем старые образы (опционально)
echo "📋 2. Очищаем старые образы..."
docker system prune -f

# Шаг 3: Пересобираем и запускаем
echo "📋 3. Пересобираем и запускаем..."
docker-compose up --build -d

# Шаг 4: Ждем запуска
echo "📋 4. Ждем запуска сервисов..."
sleep 15

# Шаг 5: Проверяем статус
echo "📋 5. Проверяем статус контейнеров..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Шаг 6: Тестируем API
echo -e "\n📋 6. Тестируем API..."
echo "Health check:"
curl -s http://localhost/api/health

echo -e "\nТестируем логин:"
curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq .

# Шаг 7: Тестируем CORS
echo -e "\n📋 7. Тестируем CORS..."
echo "OPTIONS запрос:"
curl -v -X OPTIONS http://localhost/api/auth/login \
  -H "Origin: http://37.252.20.46" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" 2>&1 | grep -i "access-control"

echo -e "\n✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo -e "\n🔑 Теперь попробуйте войти:"
echo "   URL: http://37.252.20.46/login"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo -e "\n📊 В консоли браузера должно быть:"
echo "   API URL for login: http://37.252.20.46"
echo "   Без CORS ошибок"
