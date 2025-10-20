#!/bin/bash

# Простое и надежное исправление пользователя d.li
# Использование: ./scripts/simple_ved_fix.sh

echo "=== ПРОСТОЕ ИСПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ d.li ==="
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

# Генерация правильного хеша пароля через Python
echo "2. Генерация правильного хеша пароля '123456':"
PASSWORD_HASH=$(docker exec agb_backend_prod python3 -c "
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
hash_result = pwd_context.hash('123456')
print(hash_result)
")

echo "   Сгенерированный хеш: $PASSWORD_HASH"

echo ""

# Удаление существующего пользователя d.li
echo "3. Удаление существующего пользователя d.li:"
docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "DELETE FROM users WHERE username = 'd.li';"

echo ""

# Создание нового пользователя d.li
echo "4. Создание нового пользователя d.li:"
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
    exit 1
fi

echo ""

# Проверка созданного пользователя
echo "5. Проверка созданного пользователя:"
docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "SELECT id, username, first_name, last_name, role, is_active, is_password_changed FROM users WHERE username = 'd.li';"

echo ""

# Тест входа через API
echo "6. Тест входа через API:"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "d.li", "password": "123456"}')

echo "   Ответ сервера: $LOGIN_RESPONSE"

# Проверяем успешность входа
if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "✅ Пользователь d.li может войти в систему!"
    echo "   Логин: d.li"
    echo "   Пароль: 123456"
else
    echo "❌ Пользователь d.li все еще не может войти в систему"
    echo "   Детали ошибки: $LOGIN_RESPONSE"
    
    # Дополнительная диагностика
    echo ""
    echo "7. Дополнительная диагностика:"
    echo "   Проверка логов backend:"
    docker logs agb_backend_prod --tail 10
fi

echo ""
echo "=== ЗАВЕРШЕНО ==="
