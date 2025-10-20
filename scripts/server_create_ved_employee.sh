#!/bin/bash

echo "🚀 СОЗДАНИЕ СОТРУДНИКА ВЭД НА СЕРВЕРЕ"
echo "==================================="

# Параметры пользователя
USERNAME="${1:-d.li}"
PASSWORD="${2:-123456}"
EMAIL="${USERNAME}@example.com"
FIRST_NAME="Дмитрий"
LAST_NAME="Ли"
MIDDLE_NAME=""
ROLE="ved_passport"
DEPARTMENT_ID=""
POSITION="Специалист ВЭД"

# Параметры администратора для аутентификации
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="rNHVZ29Xcpi6"
API_URL="http://localhost:8000"

echo "📋 Параметры создаваемого пользователя:"
echo "  Логин: $USERNAME"
echo "  Пароль: $PASSWORD"
echo "  Email: $EMAIL"
echo "  Имя: $FIRST_NAME"
echo "  Фамилия: $LAST_NAME"
echo "  Роль: $ROLE"
echo "  Должность: $POSITION"

# Проверяем, что backend запущен
echo ""
echo "🔍 Проверка доступности backend API..."
if ! curl -s "$API_URL/api/health" | grep -q "healthy"; then
    echo "❌ Backend API недоступен!"
    echo "   Убедитесь, что сервисы запущены: docker-compose up -d"
    exit 1
fi

echo "✅ Backend API доступен"

# Шаг 1: Получаем токен администратора
echo ""
echo "🔑 Получение токена администратора..."
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$ADMIN_USERNAME\", \"password\": \"$ADMIN_PASSWORD\"}")

# Проверяем успешность получения токена
if echo "$TOKEN_RESPONSE" | grep -q "access_token"; then
    TOKEN=$(echo "$TOKEN_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Токен получен: ${TOKEN:0:20}..."
else
    echo "❌ Не удалось получить токен администратора"
    echo "Ответ сервера: $TOKEN_RESPONSE"
    exit 1
fi

# Шаг 2: Создаем пользователя
echo ""
echo "👤 Создание пользователя ВЭД..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/users/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"username\": \"$USERNAME\",
    \"email\": \"$EMAIL\",
    \"first_name\": \"$FIRST_NAME\",
    \"last_name\": \"$LAST_NAME\",
    \"middle_name\": \"$MIDDLE_NAME\",
    \"role\": \"$ROLE\",
    \"password\": \"$PASSWORD\",
    \"department_id\": $DEPARTMENT_ID,
    \"position\": \"$POSITION\",
    \"is_active\": true,
    \"is_password_changed\": true
  }")

# Проверяем успешность создания
if echo "$CREATE_RESPONSE" | grep -q "id"; then
    echo "✅ Пользователь успешно создан!"
    echo ""
    echo "📋 Информация о созданном пользователе:"
    echo "$CREATE_RESPONSE" | jq '.'

    # Извлекаем ID созданного пользователя
    USER_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')
    echo ""
    echo "🆔 ID пользователя: $USER_ID"
else
    echo "❌ Не удалось создать пользователя"
    echo "Ответ сервера: $CREATE_RESPONSE"
    exit 1
fi

# Шаг 3: Проверяем создание пользователя в базе данных
echo ""
echo "🔍 Проверка пользователя в базе данных..."
VERIFY_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/users/list" \
  -H "Authorization: Bearer $TOKEN")

# Ищем созданного пользователя
if echo "$VERIFY_RESPONSE" | grep -q "$USERNAME"; then
    echo "✅ Пользователь найден в базе данных"

    # Извлекаем информацию о пользователе
    USER_INFO=$(echo "$VERIFY_RESPONSE" | jq ".users[] | select(.username == \"$USERNAME\")")

    if [ -n "$USER_INFO" ]; then
        echo ""
        echo "📋 Детальная информация о пользователе:"
        echo "$USER_INFO" | jq '.'
    fi
else
    echo "⚠️ Пользователь не найден в списке пользователей"
fi

# Шаг 4: Тестируем логин созданного пользователя
echo ""
echo "🔑 Тестирование логина созданного пользователя..."
LOGIN_TEST_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

if echo "$LOGIN_TEST_RESPONSE" | grep -q "access_token"; then
    echo "✅ Логин работает корректно!"
    LOGIN_TOKEN=$(echo "$LOGIN_TEST_RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
    echo "   Токен пользователя: ${LOGIN_TOKEN:0:20}..."
else
    echo "⚠️ Проблема с логином пользователя"
    echo "   Ответ сервера: $LOGIN_TEST_RESPONSE"
fi

echo ""
echo "🎉 СОЗДАНИЕ СОТРУДНИКА ВЭД ЗАВЕРШЕНО!"
echo ""
echo "🔑 Данные для входа:"
echo "  Логин: $USERNAME"
echo "  Пароль: $PASSWORD"
echo "  Email: $EMAIL"
echo "  Роль: $ROLE"
echo ""
echo "🌐 Доступ к системе:"
echo "  URL: http://$(curl -s ifconfig.me || echo 'localhost'):3000"
echo ""
echo "📋 Созданные файлы:"
echo "  - Скрипт: scripts/create_ved_employee.sh"
echo "  - Быстрый скрипт: create_ved_employee.sh"
echo ""
echo "🔄 Для создания других сотрудников:"
echo "  ./scripts/create_ved_employee.sh username password"
