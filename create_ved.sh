#!/bin/bash

# Простая команда для создания сотрудника ВЭД на сервере
# Использование: ./create_ved.sh [username] [password]

USERNAME=${1:-d.li}
PASSWORD=${2:-123456}
API_URL="http://localhost:8000"

echo "👤 Создание сотрудника ВЭД: $USERNAME / $PASSWORD"

# Получаем токен администратора
TOKEN=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "rNHVZ29Xcpi6"}' | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Создаем пользователя
RESPONSE=$(curl -s -X POST "$API_URL/api/v1/users/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"username\": \"$USERNAME\",
    \"email\": \"$USERNAME@example.com\",
    \"first_name\": \"Дмитрий\",
    \"last_name\": \"Ли\",
    \"role\": \"ved_passport\",
    \"password\": \"$PASSWORD\",
    \"is_active\": true,
    \"is_password_changed\": true
  }")

# Проверяем результат
if echo "$RESPONSE" | grep -q "id"; then
    echo "✅ Сотрудник ВЭД успешно создан!"
    echo "🔑 Логин: $USERNAME"
    echo "🔑 Пароль: $PASSWORD"
    echo "📧 Email: $USERNAME@example.com"
    echo "👤 Роль: ВЭД специалист"
else
    echo "❌ Ошибка при создании сотрудника:"
    echo "$RESPONSE"
fi
