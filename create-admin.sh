#!/bin/bash

# Скрипт для создания администратора вручную
# Использование: ./create-admin.sh [username] [password] [email] [first_name] [last_name]

set -e

USERNAME=${1:-"admin"}
PASSWORD=${2:-"admin123"}
EMAIL=${3:-"admin@almazgeobur.ru"}
FIRST_NAME=${4:-"Администратор"}
LAST_NAME=${5:-"Системы"}

echo "👤 Создание администратора..."
echo "Логин: $USERNAME"
echo "Email: $EMAIL"
echo "Имя: $FIRST_NAME $LAST_NAME"
echo ""

# Создаем администратора через API
echo "📡 Отправка запроса на создание администратора..."

RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\",
    \"email\": \"$EMAIL\",
    \"first_name\": \"$FIRST_NAME\",
    \"last_name\": \"$LAST_NAME\"
  }" \
  http://localhost/api/auth/register)

echo "Ответ сервера:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Проверяем, что администратор создан
echo ""
echo "🔍 Проверка создания администратора..."

LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$USERNAME\",
    \"password\": \"$PASSWORD\"
  }" \
  http://localhost/api/auth/login)

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "✅ Администратор успешно создан и может войти в систему!"
    echo ""
    echo "📋 Данные для входа:"
    echo "Логин: $USERNAME"
    echo "Пароль: $PASSWORD"
    echo "Email: $EMAIL"
else
    echo "❌ Ошибка при создании администратора"
    echo "Ответ сервера: $LOGIN_RESPONSE"
fi
