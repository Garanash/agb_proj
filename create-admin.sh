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

# Проверяем, запущены ли контейнеры
if ! docker-compose ps | grep -q "agb_backend"; then
    echo "❌ Backend контейнер не запущен!"
    echo "Запустите: docker-compose up -d"
    exit 1
fi

# Копируем скрипт в контейнер
echo "📋 Копирование скрипта в контейнер..."
docker cp create-admin-db.py agb_backend:/app/

# Запускаем скрипт в контейнере
echo "⚙️ Выполнение скрипта в контейнере..."
docker-compose exec -T backend python create-admin-db.py

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
    echo ""
    echo "🌐 Теперь можете войти в приложение через браузер"
else
    echo "❌ Ошибка при проверке администратора"
    echo "Ответ сервера: $LOGIN_RESPONSE"
    echo ""
    echo "💡 Попробуйте проверить логи контейнера:"
    echo "docker-compose logs backend"
fi
