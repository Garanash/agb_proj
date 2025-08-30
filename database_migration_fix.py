#!/usr/bin/env python3
"""
СКРИПТ МИГРАЦИИ БАЗЫ ДАННЫХ
Исправляет недостающие столбцы в существующей базе данных
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

async def migrate_database():
    """Миграция базы данных - добавление недостающих столбцов"""

    print("🔄 НАЧИНАЕМ МИГРАЦИЮ БАЗЫ ДАННЫХ")
    print("=" * 60)

    # Параметры подключения
    db_host = os.getenv("DB_HOST", "postgres")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("POSTGRES_DB", "agb_felix")
    db_user = os.getenv("POSTGRES_USER", "felix_user")
    db_password = os.getenv("POSTGRES_PASSWORD", "felix_password")

    try:
        # Подключаемся к базе данных
        print(f"🔌 Подключаемся к базе данных: {db_name}...")
        conn = await asyncpg.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password
        )

        print("✅ Подключено к базе данных")

        # 1. Исправляем таблицу company_employees
        print("\n📋 1. Исправление таблицы company_employees...")

        # Проверяем, есть ли столбец full_name (старая структура)
        result = await conn.fetchval("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'company_employees' AND column_name = 'full_name'
        """)

        if result:
            print("   📝 Обнаружена старая структура с full_name")
            print("   🔄 Миграция данных...")

            # Добавляем новые столбцы
            await conn.execute("""
                ALTER TABLE company_employees
                ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
                ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
                ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255)
            """)

            # Копируем данные из full_name в новые поля
            await conn.execute("""
                UPDATE company_employees
                SET
                    first_name = CASE
                        WHEN array_length(string_to_array(full_name, ' '), 1) >= 1
                        THEN (string_to_array(full_name, ' '))[1]
                        ELSE ''
                    END,
                    last_name = CASE
                        WHEN array_length(string_to_array(full_name, ' '), 1) >= 2
                        THEN (string_to_array(full_name, ' '))[2]
                        ELSE ''
                    END,
                    middle_name = CASE
                        WHEN array_length(string_to_array(full_name, ' '), 1) >= 3
                        THEN (string_to_array(full_name, ' '))[3]
                        ELSE NULL
                    END
                WHERE first_name IS NULL OR first_name = ''
            """)

            print("   ✅ Данные перенесены успешно")

        # Добавляем недостающие столбцы (если их нет)
        await conn.execute("""
            ALTER TABLE company_employees
            ADD COLUMN IF NOT EXISTS first_name VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS position VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id),
            ADD COLUMN IF NOT EXISTS email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS phone VARCHAR(255),
            ADD COLUMN IF NOT EXISTS avatar_url TEXT,
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """)

        print("   ✅ Таблица company_employees исправлена")

        # 2. Исправляем таблицу chat_rooms
        print("\n📋 2. Исправление таблицы chat_rooms...")

        await conn.execute("""
            ALTER TABLE chat_rooms
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """)

        # Обновляем существующие записи
        await conn.execute("""
            UPDATE chat_rooms
            SET
                created_by = 1,
                is_active = TRUE
            WHERE created_by IS NULL
        """)

        print("   ✅ Таблица chat_rooms исправлена")

        # 3. Исправляем таблицу chat_folders
        print("\n📋 3. Исправление таблицы chat_folders...")

        await conn.execute("""
            ALTER TABLE chat_folders
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES chat_rooms(id),
            ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """)

        print("   ✅ Таблица chat_folders исправлена")

        # 4. Исправляем таблицу chat_participants
        print("\n📋 4. Исправление таблицы chat_participants...")

        await conn.execute("""
            ALTER TABLE chat_participants
            ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES chat_rooms(id),
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS bot_id INTEGER REFERENCES chat_bots(id),
            ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
        """)

        # Переносим данные из старых полей в новые
        await conn.execute("""
            UPDATE chat_participants
            SET room_id = chat_room_id
            WHERE room_id IS NULL AND chat_room_id IS NOT NULL
        """)

        print("   ✅ Таблица chat_participants исправлена")

        # 5. Исправляем таблицу chat_messages
        print("\n📋 5. Исправление таблицы chat_messages...")

        await conn.execute("""
            ALTER TABLE chat_messages
            ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES chat_rooms(id),
            ADD COLUMN IF NOT EXISTS sender_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS bot_id INTEGER REFERENCES chat_bots(id),
            ADD COLUMN IF NOT EXISTS content TEXT,
            ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """)

        # Переносим данные из старых полей в новые
        await conn.execute("""
            UPDATE chat_messages
            SET room_id = chat_room_id
            WHERE room_id IS NULL AND chat_room_id IS NOT NULL
        """)

        print("   ✅ Таблица chat_messages исправлена")

        # 6. Исправляем таблицу chat_room_folders
        print("\n📋 6. Исправление таблицы chat_room_folders...")

        await conn.execute("""
            ALTER TABLE chat_room_folders
            ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES chat_rooms(id),
            ADD COLUMN IF NOT EXISTS folder_id INTEGER REFERENCES chat_folders(id),
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """)

        print("   ✅ Таблица chat_room_folders исправлена")

        # 7. Исправляем таблицу events
        print("\n📋 7. Исправление таблицы events...")

        await conn.execute("""
            ALTER TABLE events
            ADD COLUMN IF NOT EXISTS organizer_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """)

        # Обновляем существующие записи
        await conn.execute("""
            UPDATE events
            SET
                organizer_id = 1,
                is_public = FALSE,
                is_active = TRUE
            WHERE organizer_id IS NULL
        """)

        print("   ✅ Таблица events исправлена")

        # 8. Исправляем таблицу event_participants
        print("\n📋 8. Исправление таблицы event_participants...")

        await conn.execute("""
            ALTER TABLE event_participants
            ADD COLUMN IF NOT EXISTS event_id INTEGER REFERENCES events(id),
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """)

        print("   ✅ Таблица event_participants исправлена")

        # 9. Проверяем структуру всех таблиц
        print("\n📋 9. Проверка структуры таблиц...")

        tables_to_check = [
            'company_employees', 'chat_rooms', 'chat_folders',
            'chat_participants', 'chat_messages', 'chat_room_folders',
            'events', 'event_participants'
        ]

        for table_name in tables_to_check:
            result = await conn.fetch(f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = '{table_name}'
                ORDER BY ordinal_position
            """)

            if result:
                print(f"   ✅ Таблица {table_name}: {len(result)} столбцов")
            else:
                print(f"   ❌ Таблица {table_name}: не найдена")

        await conn.close()

        print("\n" + "=" * 60)
        print("🎉 МИГРАЦИЯ БАЗЫ ДАННЫХ ЗАВЕРШЕНА УСПЕШНО!")
        print("\n📊 РЕЗУЛЬТАТЫ МИГРАЦИИ:")
        print("   ✅ Добавлены все недостающие столбцы")
        print("   ✅ Перенесены данные из старых полей")
        print("   ✅ Обновлены существующие записи")
        print("   ✅ Созданы необходимые связи")
        print("\n🔄 Теперь перезапустите сервисы:")
        print("   docker-compose restart")
        print("\n🧪 И проверьте работу:")
        print("   python test_all_endpoints.py")

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
        print("\n🎯 МИГРАЦИЯ ПРОШЛА УСПЕШНО!")
        print("   Теперь перезапустите контейнеры и проверьте работу платформы")
    else:
        print("\n❌ МИГРАЦИЯ ЗАВЕРШИЛАСЬ С ОШИБКАМИ!")

if __name__ == "__main__":
    asyncio.run(main())
