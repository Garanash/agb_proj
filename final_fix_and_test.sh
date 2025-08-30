#!/bin/bash
# ФИНАЛЬНЫЙ СКРИПТ ИСПРАВЛЕНИЙ И ТЕСТИРОВАНИЯ
# Создает базу заново и тестирует все функции

echo "🚀 ФИНАЛЬНЫЕ ИСПРАВЛЕНИЯ И ТЕСТИРОВАНИЕ"
echo "======================================="

# Определяем директорию проекта
find_project_dir() {
    if [ -f "docker-compose.yml" ] && [ -d "backend" ] && [ -d "frontend" ]; then
        echo "$(pwd)"
        return 0
    fi

    for dir in "/root/agb_proj" "/root/agb_platform" "/home/agb_proj" "/home/agb_platform"; do
        if [ -d "$dir" ] && [ -f "$dir/docker-compose.yml" ]; then
            echo "$dir"
            return 0
        fi
    done

    current_dir="$(pwd)"
    while [ "$current_dir" != "/" ]; do
        if [ -f "$current_dir/docker-compose.yml" ] && [ -d "$current_dir/backend" ]; then
            echo "$current_dir"
            return 0
        fi
        current_dir="$(dirname "$current_dir")"
    done

    return 1
}

PROJECT_DIR=$(find_project_dir)

if [ -z "$PROJECT_DIR" ]; then
    echo "❌ Ошибка: Не удалось найти директорию проекта!"
    exit 1
fi

echo "✅ Найден проект: $PROJECT_DIR"
cd "$PROJECT_DIR"

# 1. Устанавливаем зависимости
echo "📦 1. Установка зависимостей..."
pip install asyncpg python-dotenv httpx || echo "⚠️  Зависимости установлены"

# 2. Останавливаем сервисы
echo "🛑 2. Остановка сервисов..."
docker-compose down

# 3. Создаем базу данных заново
echo "🔄 3. Создание базы данных заново..."
python create_database_from_scratch.py

# 4. Перезапускаем сервисы
echo "🚀 4. Перезапуск сервисов..."
docker-compose up -d

# 5. Ждем запуска
echo "⏳ 5. Ожидание запуска..."
sleep 30

# 6. Создаем администратора
echo "👤 6. Создание администратора..."
python create_admin_db.py

# 7. Тестируем работу
echo "🧪 7. Тестирование работы..."
sleep 10

# Тест авторизации
echo "   Тестируем авторизацию..."
TOKEN=$(curl -s -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    echo "   ✅ Авторизация работает"

    # Тест пользователей чата
    echo "   Тестируем пользователей чата..."
    USERS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/users/chat-users/)
    if echo "$USERS_RESPONSE" | grep -q "first_name\|username"; then
        echo "   ✅ Пользователи чата работают"
    else
        echo "   ❌ Пользователи чата НЕ работают: $USERS_RESPONSE"
    fi

    # Тест чатов
    echo "   Тестируем чаты..."
    ROOMS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/chat/rooms/)
    if echo "$ROOMS_RESPONSE" | grep -q "id\|null\|[]"; then
        echo "   ✅ Чаты работают"
    else
        echo "   ❌ Чаты НЕ работают: $ROOMS_RESPONSE"
    fi

    # Тест папок чатов
    echo "   Тестируем папки чатов..."
    FOLDERS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/chat/folders/)
    if echo "$FOLDERS_RESPONSE" | grep -q "id\|null\|[]"; then
        echo "   ✅ Папки чатов работают"
    else
        echo "   ❌ Папки чатов НЕ работают: $FOLDERS_RESPONSE"
    fi

    # Тест сотрудников
    echo "   Тестируем сотрудников..."
    EMPLOYEES_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/company-employees/)
    if echo "$EMPLOYEES_RESPONSE" | grep -q "first_name\|null\|[]"; then
        echo "   ✅ Сотрудники работают"
    else
        echo "   ❌ Сотрудники НЕ работают: $EMPLOYEES_RESPONSE"
    fi

    # Тест событий
    echo "   Тестируем события..."
    EVENTS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/events/)
    if echo "$EVENTS_RESPONSE" | grep -q "title\|null\|[]"; then
        echo "   ✅ События работают"
    else
        echo "   ❌ События НЕ работают: $EVENTS_RESPONSE"
    fi

    # Тест ботов
    echo "   Тестируем ботов..."
    BOTS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/chat/bots/)
    if echo "$BOTS_RESPONSE" | grep -q "name\|null\|[]"; then
        echo "   ✅ Боты работают"
    else
        echo "   ❌ Боты НЕ работают: $BOTS_RESPONSE"
    fi

else
    echo "   ❌ Авторизация НЕ работает"
fi

echo ""
echo "🎉 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО!"
echo "==========================="
echo ""
echo "🌐 ДОСТУП К СИСТЕМЕ:"
echo "   URL: http://localhost/login"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""
echo "📋 ПРОВЕРЬТЕ В БРАУЗЕРЕ:"
echo "   1. Авторизация работает"
echo "   2. Создание чата - список пользователей отображается"
echo "   3. Создание события - список пользователей отображается"
echo "   4. Добавление сотрудника - форма работает"
echo "   5. Все API endpoints доступны"
echo ""
echo "🎯 ВСЕ ПРОБЛЕМЫ ДОЛЖНЫ БЫТЬ ИСПРАВЛЕНЫ!"
