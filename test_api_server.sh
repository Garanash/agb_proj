#!/bin/bash
# Тест API на сервере

echo "🔍 Тестируем API на сервере..."

# Проверяем здоровье через nginx
echo -e "\n📊 Тест 1: Проверка здоровья через nginx"
curl -v http://localhost/api/health

echo -e "\n\n📊 Тест 2: Проверка здоровья через backend напрямую"
curl -v http://localhost:8000/api/health

# Тестируем логин через nginx
echo -e "\n\n🔐 Тест 3: Попытка логина через nginx"
curl -v -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Тестируем логин через backend напрямую
echo -e "\n\n🔐 Тест 4: Попытка логина через backend напрямую"
curl -v -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Проверяем OPTIONS запрос (CORS preflight)
echo -e "\n\n🌐 Тест 5: Проверка CORS (OPTIONS запрос)"
curl -v -X OPTIONS http://localhost/api/auth/login \
  -H "Origin: http://localhost" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

echo -e "\n\n✅ Тесты завершены!"
