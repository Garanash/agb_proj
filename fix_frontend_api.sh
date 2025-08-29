#!/bin/bash
# Исправление API URL для фронтенда

echo "🔧 ИСПРАВЛЕНИЕ API URL ДЛЯ ФРОНТЕНДА"
echo "==================================="

# Останавливаем текущие контейнеры
echo "📋 1. Останавливаем контейнеры..."
docker-compose down

# Пересобираем и запускаем с новыми настройками
echo "📋 2. Пересобираем и запускаем..."
docker-compose up --build -d

# Ждем запуска сервисов
echo "📋 3. Ждем запуска сервисов..."
sleep 10

# Проверяем статус
echo "📋 4. Проверяем статус контейнеров..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Тестируем API
echo -e "\n📋 5. Тестируем API..."
echo "Тестируем health:"
curl -s http://localhost/api/health

echo -e "\nТестируем логин:"
curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq .

echo -e "\n✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo -e "\n🔑 Теперь попробуйте войти:"
echo "   URL: http://37.252.20.46/login"
echo "   Логин: admin"
echo "   Пароль: admin123"
