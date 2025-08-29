#!/usr/bin/env python3
"""
Скрипт миграции базы данных для обновления существующих таблиц
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

async def migrate_database():
    """Миграция базы данных - добавление недостающих столбцов"""

    # Параметры подключения
    db_host = os.getenv("DB_HOST", "postgres")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB", "agb_felix")
    db_user = os.getenv("POSTGRES_USER", "felix_user")
    db_password = os.getenv("POSTGRES_PASSWORD", "felix_password")

    print("🔄 НАЧИНАЕМ МИГРАЦИЮ БАЗЫ ДАННЫХ")
    print("=" * 50)

    try:
        # Подключаемся к базе данных
        conn = await asyncpg.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password
        )

        print(f"✅ Подключено к базе данных: {db_name}")

        # 1. Добавляем столбцы в таблицу company_employees
        print("\n📋 1. Обновление таблицы company_employees...")

        # Проверяем, есть ли столбец full_name (старая структура)
        result = await conn.fetchval("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'company_employees' AND column_name = 'full_name'
        """)

        if result:
            print("   Обнаружена старая структура с full_name")

            # Переименовываем full_name в first_name (если это возможно)
            # Но обычно лучше добавить новые столбцы
            await conn.execute("""
                ALTER TABLE company_employees
                ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
                ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
                ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255)
            """)

            print("   ✅ Добавлены столбцы: first_name, last_name, middle_name")

            # Копируем данные из full_name в first_name (если возможно)
            await conn.execute("""
                UPDATE company_employees
                SET first_name = SPLIT_PART(full_name, ' ', 1),
                    last_name = SPLIT_PART(full_name, ' ', 2),
                    middle_name = CASE WHEN array_length(string_to_array(full_name, ' '), 1) > 2
                                      THEN SPLIT_PART(full_name, ' ', 3)
                                      ELSE NULL END
                WHERE first_name IS NULL AND full_name IS NOT NULL
            """)

            print("   ✅ Данные перенесены из full_name")
        else:
            # Добавляем недостающие столбцы
            await conn.execute("""
                ALTER TABLE company_employees
                ADD COLUMN IF NOT EXISTS first_name VARCHAR(255) DEFAULT '',
                ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) DEFAULT '',
                ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255)
            """)
            print("   ✅ Добавлены недостающие столбцы")

        # 2. Добавляем столбец is_active в таблицу chat_rooms
        print("\n📋 2. Обновление таблицы chat_rooms...")

        await conn.execute("""
            ALTER TABLE chat_rooms
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
        """)

        print("   ✅ Добавлен столбец is_active")

        # 3. Добавляем столбец user_id в таблицу chat_folders (если нужно)
        print("\n📋 3. Проверка таблицы chat_folders...")

        result = await conn.fetchval("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'chat_folders' AND column_name = 'user_id'
        """)

        if not result:
            await conn.execute("""
                ALTER TABLE chat_folders
                ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
            """)
            print("   ✅ Добавлен столбец user_id")
        else:
            print("   ✅ Столбец user_id уже существует")

        # 4. Добавляем столбец room_id в таблицу chat_folders (если нужно)
        result = await conn.fetchval("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'chat_folders' AND column_name = 'room_id'
        """)

        if not result:
            await conn.execute("""
                ALTER TABLE chat_folders
                ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES chat_rooms(id)
            """)
            print("   ✅ Добавлен столбец room_id")

        # 5. Проверяем и исправляем связи в chat_room_folders
        print("\n📋 4. Проверка таблицы chat_room_folders...")

        # Проверяем структуру таблицы
        columns = await conn.fetch("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'chat_room_folders'
            ORDER BY column_name
        """)

        print(f"   Столбцы в chat_room_folders: {[col['column_name'] for col in columns]}")

        # 6. Обновляем связи в моделях (если нужно)
        print("\n📋 5. Проверка существования таблиц...")

        tables = await conn.fetch("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)

        print(f"   Существующие таблицы: {[t['table_name'] for t in tables]}")

        await conn.close()

        print("\n" + "=" * 50)
        print("✅ МИГРАЦИЯ БАЗЫ ДАННЫХ ЗАВЕРШЕНА!")
        print("\n🔄 Теперь перезапустите контейнеры:")
        print("   docker-compose restart backend")
        print("\n📊 РЕЗУЛЬТАТЫ МИГРАЦИИ:")
        print("   ✅ Добавлены столбцы в company_employees")
        print("   ✅ Добавлен столбец is_active в chat_rooms")
        print("   ✅ Проведена проверка chat_folders")
        print("   ✅ Проведена проверка chat_room_folders")

    except Exception as e:
        print(f"❌ Ошибка миграции: {e}")
        import traceback
        traceback.print_exc()
        return False

    return True

async def main():
    """Главная функция"""
    success = await migrate_database()
    if success:
        print("\n🎉 Миграция прошла успешно!")
    else:
        print("\n❌ Миграция завершилась с ошибками!")

if __name__ == "__main__":
    asyncio.run(main())
