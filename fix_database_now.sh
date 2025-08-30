#!/bin/bash
# СРОЧНОЕ ИСПРАВЛЕНИЕ БАЗЫ ДАННЫХ НА СЕРВЕРЕ
# Запустите этот скрипт на сервере для исправления ошибок

echo "🔧 СРОЧНОЕ ИСПРАВЛЕНИЕ БАЗЫ ДАННЫХ"
echo "==================================="

# Определяем директорию проекта
PROJECT_DIR=""
if [ -f "docker-compose.yml" ] && [ -d "backend" ]; then
    PROJECT_DIR="$(pwd)"
elif [ -d "/root/agb_proj" ]; then
    PROJECT_DIR="/root/agb_proj"
    cd "$PROJECT_DIR"
elif [ -d "/root/agb_platform" ]; then
    PROJECT_DIR="/root/agb_platform"
    cd "$PROJECT_DIR"
else
    echo "❌ Не могу найти директорию проекта!"
    exit 1
fi

echo "📁 Работаю в директории: $PROJECT_DIR"

# 1. Устанавливаем зависимости
echo "📦 Устанавливаю зависимости..."
pip install asyncpg python-dotenv

# 2. Создаем скрипт миграции
echo "📝 Создаю скрипт миграции..."
cat > fix_db.py << 'EOF'
#!/usr/bin/env python3
import asyncio
import asyncpg
import os

async def fix_database():
    print("🔧 ИСПРАВЛЯЮ БАЗУ ДАННЫХ...")

    try:
        # Подключаемся к базе данных
        conn = await asyncpg.connect(
            host="postgres",
            port=5432,
            database="agb_felix",
            user="felix_user",
            password="felix_password"
        )

        print("✅ Подключено к базе данных")

        # Исправляем таблицу company_employees
        print("📋 1. Исправляю company_employees...")
        await conn.execute("""
            ALTER TABLE company_employees
            ADD COLUMN IF NOT EXISTS first_name VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255)
        """)

        # Исправляем таблицу chat_rooms
        print("📋 2. Исправляю chat_rooms...")
        await conn.execute("""
            ALTER TABLE chat_rooms
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
        """)

        # Исправляем таблицу chat_folders
        print("📋 3. Исправляю chat_folders...")
        await conn.execute("""
            ALTER TABLE chat_folders
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES chat_rooms(id)
        """)

        # Проверяем структуру таблиц
        print("📋 4. Проверяю структуру таблиц...")

        # Проверяем company_employees
        result = await conn.fetchval("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'company_employees'
            AND column_name = 'first_name'
        """)

        if result:
            print("✅ company_employees.first_name - ОК")
        else:
            print("❌ company_employees.first_name - НЕ НАЙДЕН")

        # Проверяем chat_rooms
        result = await conn.fetchval("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'chat_rooms'
            AND column_name = 'is_active'
        """)

        if result:
            print("✅ chat_rooms.is_active - ОК")
        else:
            print("❌ chat_rooms.is_active - НЕ НАЙДЕН")

        await conn.close()
        print("✅ Миграция завершена успешно!")

    except Exception as e:
        print(f"❌ Ошибка миграции: {e}")

if __name__ == "__main__":
    asyncio.run(fix_database())
EOF

# 3. Запускаем миграцию
echo "🔧 Запускаю миграцию..."
python fix_db.py

# 4. Проверяем исправления
echo "🧪 Проверяю исправления..."
python -c "
import asyncio
import asyncpg

async def check_db():
    try:
        conn = await asyncpg.connect(host='postgres', port=5432, database='agb_felix', user='felix_user', password='felix_password')
        
        # Проверяем company_employees
        result = await conn.fetchval('SELECT first_name FROM company_employees LIMIT 1')
        print('✅ company_employees.first_name - ДОСТУПЕН')
        
        # Проверяем chat_rooms
        result = await conn.fetchval('SELECT is_active FROM chat_rooms LIMIT 1')
        print('✅ chat_rooms.is_active - ДОСТУПЕН')
        
        await conn.close()
        print('🎉 БАЗА ДАННЫХ ИСПРАВЛЕНА!')
        
    except Exception as e:
        print(f'❌ ОШИБКА: {e}')

asyncio.run(check_db())
"

# 5. Перезапускаем сервисы
echo "🚀 Перезапускаю сервисы..."
docker-compose restart

# 6. Ждем запуска
echo "⏳ Жду запуска..."
sleep 10

# 7. Финальная проверка
echo "🎯 Финальная проверка..."
curl -s http://localhost/api/health | grep -q "healthy" && echo "✅ API работает!" || echo "❌ API не работает"

echo ""
echo "🎉 ГОТОВО!"
echo "=========="
echo "База данных исправлена. Теперь все должно работать!"
