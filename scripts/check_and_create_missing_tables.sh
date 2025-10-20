#!/bin/bash

# Скрипт для проверки и создания недостающих таблиц news и events
# Использование: ./scripts/check_and_create_missing_tables.sh

echo "=== ПРОВЕРКА И СОЗДАНИЕ НЕДОСТАЮЩИХ ТАБЛИЦ ==="
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

# Проверка существования таблицы news
echo "2. Проверка таблицы news:"
NEWS_EXISTS=$(docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'news';" 2>/dev/null | tr -d ' ')

if [ "$NEWS_EXISTS" = "1" ]; then
    echo "✅ Таблица news существует"
    echo "   Структура таблицы news:"
    docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "\d news"
else
    echo "❌ Таблица news не найдена"
    echo ""
    echo "3. Создание таблицы news:"
    docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "
    CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        category VARCHAR(100),
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Таблица news создана"
        
        # Добавляем тестовые данные
        echo "4. Добавление тестовых новостей:"
        docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "
        INSERT INTO news (title, content, category, is_published) VALUES 
        ('Добро пожаловать в систему!', 'Система успешно развернута и готова к работе.', 'system', true),
        ('Обновление системы', 'Выпущено новое обновление с улучшениями.', 'update', true),
        ('Техническое обслуживание', 'Запланировано техническое обслуживание на выходные.', 'maintenance', false)
        ON CONFLICT DO NOTHING;
        "
        echo "✅ Тестовые новости добавлены"
    else
        echo "❌ Ошибка создания таблицы news"
    fi
fi

echo ""

# Проверка существования таблицы events
echo "5. Проверка таблицы events:"
EVENTS_EXISTS=$(docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'events';" 2>/dev/null | tr -d ' ')

if [ "$EVENTS_EXISTS" = "1" ]; then
    echo "✅ Таблица events существует"
    echo "   Структура таблицы events:"
    docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "\d events"
else
    echo "❌ Таблица events не найдена"
    echo ""
    echo "6. Создание таблицы events:"
    docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "
    CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        event_type VARCHAR(100),
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        location VARCHAR(255),
        organizer_id INTEGER,
        is_public BOOLEAN DEFAULT true,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ Таблица events создана"
        
        # Добавляем тестовые данные
        echo "7. Добавление тестовых событий:"
        docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "
        INSERT INTO events (title, description, event_type, start_date, end_date, location, is_public) VALUES 
        ('Совещание команды', 'Еженедельное совещание команды разработки', 'meeting', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 2 hours', 'Конференц-зал', true),
        ('Презентация проекта', 'Презентация нового проекта клиенту', 'presentation', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 1 hour', 'Офис', true),
        ('Обучение сотрудников', 'Обучение новым технологиям', 'training', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 4 hours', 'Учебный класс', false)
        ON CONFLICT DO NOTHING;
        "
        echo "✅ Тестовые события добавлены"
    else
        echo "❌ Ошибка создания таблицы events"
    fi
fi

echo ""

# Проверка API эндпоинтов
echo "8. Тестирование API эндпоинтов:"
echo "   Тест /api/v1/news:"
NEWS_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8000/api/v1/news/?limit=5)
NEWS_CODE="${NEWS_RESPONSE: -3}"
if [ "$NEWS_CODE" = "200" ]; then
    echo "✅ /api/v1/news работает"
else
    echo "❌ /api/v1/news возвращает код $NEWS_CODE"
fi

echo "   Тест /api/v1/events:"
EVENTS_RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8000/api/v1/events/?limit=5)
EVENTS_CODE="${EVENTS_RESPONSE: -3}"
if [ "$EVENTS_CODE" = "200" ]; then
    echo "✅ /api/v1/events работает"
else
    echo "❌ /api/v1/events возвращает код $EVENTS_CODE"
fi

echo ""
echo "=== ЗАВЕРШЕНО ==="
