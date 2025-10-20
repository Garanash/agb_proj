#!/bin/bash

# Скрипт для проверки и создания пользователя VED (d.li) на сервере
# Использование: ./scripts/check_and_create_ved_user.sh

echo "=== ПРОВЕРКА И СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ VED (d.li) ==="
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

# Проверка существования пользователя d.li
echo "2. Проверка пользователя d.li:"
USER_EXISTS=$(docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -t -c "SELECT COUNT(*) FROM users WHERE username = 'd.li';" 2>/dev/null | tr -d ' ')

if [ "$USER_EXISTS" = "1" ]; then
    echo "✅ Пользователь d.li уже существует"
    echo ""
    echo "3. Информация о пользователе:"
    docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "SELECT username, first_name, last_name, role, is_active FROM users WHERE username = 'd.li';"
    
    echo ""
    echo "4. Обновление пароля пользователя d.li:"
    docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "
    UPDATE users 
    SET password_hash = '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4/LewdBPj4', 
        is_password_changed = true,
        updated_at = NOW()
    WHERE username = 'd.li';
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Пароль пользователя d.li обновлен на '123456'"
    else
        echo "❌ Ошибка обновления пароля"
    fi
else
    echo "❌ Пользователь d.li не найден"
    echo ""
    echo "3. Создание пользователя d.li:"
    
    # Создание пользователя через API
    echo "Создаем пользователя через API..."
    
    # Получаем токен админа
    ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
        -H "Content-Type: application/json" \
        -d '{"username": "admin", "password": "admin123"}' | \
        jq -r '.access_token' 2>/dev/null)
    
    if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
        echo "✅ Получен токен админа"
        
        # Создаем пользователя d.li
        CREATE_RESULT=$(curl -s -X POST http://localhost:8000/api/v1/users/ \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -d '{
                "username": "d.li",
                "password": "123456",
                "first_name": "Дмитрий",
                "last_name": "Ли",
                "email": "d.li@ved.ru",
                "role": "ved",
                "department_id": 1,
                "is_active": true,
                "is_password_changed": true
            }')
        
        echo "Результат создания: $CREATE_RESULT"
        
        # Проверяем, что пользователь создался
        sleep 2
        USER_CHECK=$(docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -t -c "SELECT COUNT(*) FROM users WHERE username = 'd.li';" 2>/dev/null | tr -d ' ')
        
        if [ "$USER_CHECK" = "1" ]; then
            echo "✅ Пользователь d.li успешно создан"
        else
            echo "❌ Ошибка создания пользователя d.li"
        fi
    else
        echo "❌ Не удалось получить токен админа"
        echo "Попробуем создать пользователя напрямую в БД..."
        
        # Создание пользователя напрямую в БД
        docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "
        INSERT INTO users (
            username, password_hash, first_name, last_name, email, role, 
            department_id, is_active, is_password_changed, created_at, updated_at
        ) VALUES (
            'd.li', 
            '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4/LewdBPj4',
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
            echo "✅ Пользователь d.li создан напрямую в БД"
        else
            echo "❌ Ошибка создания пользователя в БД"
        fi
    fi
fi

echo ""
echo "5. Финальная проверка пользователя d.li:"
docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "SELECT username, first_name, last_name, role, is_active, is_password_changed FROM users WHERE username = 'd.li';"

echo ""
echo "6. Тест входа пользователя d.li:"
LOGIN_RESULT=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "d.li", "password": "123456"}')

echo "Результат входа: $LOGIN_RESULT"

# Проверяем успешность входа
if echo "$LOGIN_RESULT" | grep -q "access_token"; then
    echo "✅ Пользователь d.li может войти в систему"
else
    echo "❌ Пользователь d.li не может войти в систему"
    echo "Проверьте пароль и статус пользователя"
fi

echo ""
echo "=== ЗАВЕРШЕНО ==="
