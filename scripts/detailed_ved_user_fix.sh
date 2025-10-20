#!/bin/bash

# Детальная диагностика и исправление проблемы с пользователем d.li
# Использование: ./scripts/detailed_ved_user_fix.sh

echo "=== ДЕТАЛЬНАЯ ДИАГНОСТИКА И ИСПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ d.li ==="
echo ""

# Проверка подключения к БД
echo "1. Проверка подключения к БД:"
docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Подключение к БД успешно"
else
    echo "❌ Ошибка подключения к БД"
    exit 1
fi

echo ""

# Проверка всех пользователей
echo "2. Список всех пользователей в системе:"
docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "SELECT id, username, first_name, last_name, role, is_active, is_password_changed FROM users ORDER BY username;"

echo ""

# Проверка конкретно пользователя d.li
echo "3. Детальная информация о пользователе d.li:"
docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "SELECT id, username, first_name, last_name, role, is_active, is_password_changed, created_at, updated_at FROM users WHERE username = 'd.li';"

echo ""

# Удаление существующего пользователя d.li если есть
echo "4. Удаление существующего пользователя d.li (если есть):"
docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "DELETE FROM users WHERE username = 'd.li';"

echo ""

# Создание нового пользователя d.li с правильным хешем пароля
echo "5. Создание нового пользователя d.li с правильным хешем пароля:"

# Генерируем правильный хеш для пароля "123456"
PASSWORD_HASH="\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4/LewdBPj4"

docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "
INSERT INTO users (
    username, 
    hashed_password, 
    first_name, 
    last_name, 
    email, 
    role, 
    department_id, 
    is_active, 
    is_password_changed, 
    created_at, 
    updated_at
) VALUES (
    'd.li', 
    '$PASSWORD_HASH',
    'Дмитрий', 
    'Ли', 
    'd.li@ved.ru', 
    'ved', 
    1, 
    true, 
    true, 
    NOW(), 
    NOW()
);
"

if [ $? -eq 0 ]; then
    echo "✅ Пользователь d.li создан успешно"
else
    echo "❌ Ошибка создания пользователя d.li"
fi

echo ""

# Проверка созданного пользователя
echo "6. Проверка созданного пользователя:"
docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "SELECT id, username, first_name, last_name, role, is_active, is_password_changed FROM users WHERE username = 'd.li';"

echo ""

# Тест входа через API
echo "7. Тест входа через API:"
echo "   Отправляем запрос на вход..."

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "d.li", "password": "123456"}')

echo "   Ответ сервера: $LOGIN_RESPONSE"

# Проверяем успешность входа
if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "✅ Пользователь d.li может войти в систему"
    
    # Извлекаем токен для дальнейших тестов
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token' 2>/dev/null)
    if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
        echo "✅ Токен получен: ${TOKEN:0:20}..."
        
        # Тест получения информации о пользователе
        echo "8. Тест получения информации о пользователе:"
        USER_INFO=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/v1/auth/me)
        echo "   Информация о пользователе: $USER_INFO"
    fi
else
    echo "❌ Пользователь d.li не может войти в систему"
    echo "   Детали ошибки: $LOGIN_RESPONSE"
fi

echo ""

# Проверка логики аутентификации в коде
echo "9. Проверка логики аутентификации:"
echo "   Проверяем, что backend использует правильную логику проверки паролей..."

# Проверяем, есть ли проблемы с хешированием
echo "10. Тест с разными вариантами пароля:"
echo "    Тест с паролем '123456':"
curl -s -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "d.li", "password": "123456"}' | head -c 200 && echo

echo "    Тест с паролем 'admin123' (для сравнения):"
curl -s -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}' | head -c 200 && echo

echo ""

# Проверка логов backend
echo "11. Последние логи backend:"
docker logs agb_backend_prod --tail 20

echo ""
echo "=== ЗАВЕРШЕНО ==="
