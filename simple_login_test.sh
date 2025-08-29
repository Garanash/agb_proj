#!/bin/bash
# Простой тест логина

echo "🔐 Простой тест логина..."

# Тест 1: Прямой запрос к backend
echo -e "\n📊 Тест 1: Прямой запрос к backend"
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Тест 2: Запрос через nginx
echo -e "\n\n📊 Тест 2: Запрос через nginx"
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Тест 3: Проверка здоровья
echo -e "\n\n📊 Тест 3: Проверка здоровья"
curl http://localhost/api/health

# Тест 4: Проверка с неправильными данными
echo -e "\n\n📊 Тест 4: Неправильный пароль"
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "wrong"}'

echo -e "\n✅ Тест завершен!"
