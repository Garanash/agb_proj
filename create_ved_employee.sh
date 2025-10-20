#!/bin/bash

# Быстрое создание сотрудника ВЭД
# Использование: ./create_ved_employee.sh [username] [password]

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
curl -X POST "$API_URL/api/v1/users/" \
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
  }" | jq '.'

echo "✅ Сотрудник ВЭД создан!"
