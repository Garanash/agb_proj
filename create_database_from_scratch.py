#!/usr/bin/env python3
"""
СКРИПТ ДЛЯ СОЗДАНИЯ БАЗЫ ДАННЫХ С НУЛЯ
Создает все таблицы с правильной структурой без миграций
"""
import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

async def create_database_from_scratch():
    """Создание базы данных с нуля с правильной структурой"""

    print("🔄 СОЗДАНИЕ БАЗЫ ДАННЫХ С НУЛЯ")
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

        # Удаляем все существующие таблицы (если они есть)
        print("\n🗑️  Удаление существующих таблиц...")
        await conn.execute("""
            DROP TABLE IF EXISTS chat_room_folders CASCADE;
            DROP TABLE IF EXISTS chat_participants CASCADE;
            DROP TABLE IF EXISTS chat_messages CASCADE;
            DROP TABLE IF EXISTS chat_folders CASCADE;
            DROP TABLE IF EXISTS chat_rooms CASCADE;
            DROP TABLE IF EXISTS chat_bots CASCADE;
            DROP TABLE IF EXISTS event_participants CASCADE;
            DROP TABLE IF EXISTS events CASCADE;
            DROP TABLE IF EXISTS company_employees CASCADE;
            DROP TABLE IF EXISTS news CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            DROP TABLE IF EXISTS departments CASCADE;
            DROP TABLE IF EXISTS ved_passports CASCADE;
            DROP TABLE IF EXISTS ved_nomenclature CASCADE;
            DROP TABLE IF EXISTS teams CASCADE;
            DROP TABLE IF EXISTS team_members CASCADE;
        """)

        print("✅ Старые таблицы удалены")

        # 1. Создание таблицы departments
        print("\n📋 1. Создание таблицы departments...")
        await conn.execute("""
            CREATE TABLE departments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                head_id INTEGER REFERENCES users(id),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 2. Создание таблицы users
        print("📋 2. Создание таблицы users...")
        await conn.execute("""
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                middle_name VARCHAR(255),
                hashed_password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                phone VARCHAR(20),
                department_id INTEGER REFERENCES departments(id),
                position VARCHAR(255),
                avatar_url TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 3. Создание таблицы teams
        print("📋 3. Создание таблицы teams...")
        await conn.execute("""
            CREATE TABLE teams (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                created_by INTEGER REFERENCES users(id),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 4. Создание таблицы team_members
        print("📋 4. Создание таблицы team_members...")
        await conn.execute("""
            CREATE TABLE team_members (
                id SERIAL PRIMARY KEY,
                team_id INTEGER REFERENCES teams(id) NOT NULL,
                user_id INTEGER REFERENCES users(id) NOT NULL,
                role VARCHAR(50) DEFAULT 'member',
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 5. Создание таблицы company_employees
        print("📋 5. Создание таблицы company_employees...")
        await conn.execute("""
            CREATE TABLE company_employees (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(255) DEFAULT '',
                last_name VARCHAR(255) DEFAULT '',
                middle_name VARCHAR(255),
                position VARCHAR(255) DEFAULT '',
                department_id INTEGER REFERENCES departments(id),
                email VARCHAR(255),
                phone VARCHAR(255),
                avatar_url TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 6. Создание таблицы news
        print("📋 6. Создание таблицы news...")
        await conn.execute("""
            CREATE TABLE news (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                content TEXT NOT NULL,
                author_name VARCHAR(255),
                category VARCHAR(100),
                is_published BOOLEAN DEFAULT FALSE,
                published_at TIMESTAMP WITH TIME ZONE,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 7. Создание таблицы ved_nomenclature
        print("📋 7. Создание таблицы ved_nomenclature...")
        await conn.execute("""
            CREATE TABLE ved_nomenclature (
                id SERIAL PRIMARY KEY,
                code_1c VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                article VARCHAR(100) NOT NULL,
                matrix VARCHAR(50) NOT NULL,
                drilling_depth VARCHAR(50),
                height VARCHAR(50),
                thread VARCHAR(10),
                product_type VARCHAR(100) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 8. Создание таблицы ved_passports
        print("📋 8. Создание таблицы ved_passports...")
        await conn.execute("""
            CREATE TABLE ved_passports (
                id SERIAL PRIMARY KEY,
                passport_number VARCHAR(100) UNIQUE NOT NULL,
                title VARCHAR(500),
                description TEXT,
                status VARCHAR(50) DEFAULT 'active',
                order_number VARCHAR(100) NOT NULL,
                quantity INTEGER DEFAULT 1,
                created_by INTEGER REFERENCES users(id) NOT NULL,
                nomenclature_id INTEGER REFERENCES ved_nomenclature(id) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 9. Создание таблицы events
        print("📋 9. Создание таблицы events...")
        await conn.execute("""
            CREATE TABLE events (
                id SERIAL PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                start_date TIMESTAMP WITH TIME ZONE NOT NULL,
                end_date TIMESTAMP WITH TIME ZONE NOT NULL,
                location VARCHAR(255),
                organizer_id INTEGER REFERENCES users(id),
                is_public BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 10. Создание таблицы event_participants
        print("📋 10. Создание таблицы event_participants...")
        await conn.execute("""
            CREATE TABLE event_participants (
                id SERIAL PRIMARY KEY,
                event_id INTEGER REFERENCES events(id) NOT NULL,
                user_id INTEGER REFERENCES users(id) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 11. Создание таблицы chat_bots
        print("📋 11. Создание таблицы chat_bots...")
        await conn.execute("""
            CREATE TABLE chat_bots (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 12. Создание таблицы chat_rooms
        print("📋 12. Создание таблицы chat_rooms...")
        await conn.execute("""
            CREATE TABLE chat_rooms (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                is_private BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_by INTEGER REFERENCES users(id) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 13. Создание таблицы chat_folders
        print("📋 13. Создание таблицы chat_folders...")
        await conn.execute("""
            CREATE TABLE chat_folders (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                user_id INTEGER REFERENCES users(id),
                room_id INTEGER REFERENCES chat_rooms(id),
                created_by INTEGER REFERENCES users(id) NOT NULL,
                is_default BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 14. Создание таблицы chat_participants
        print("📋 14. Создание таблицы chat_participants...")
        await conn.execute("""
            CREATE TABLE chat_participants (
                id SERIAL PRIMARY KEY,
                room_id INTEGER REFERENCES chat_rooms(id) NOT NULL,
                user_id INTEGER REFERENCES users(id),
                bot_id INTEGER REFERENCES chat_bots(id),
                is_admin BOOLEAN DEFAULT FALSE,
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                last_read_at TIMESTAMP WITH TIME ZONE
            );
        """)

        # 15. Создание таблицы chat_messages
        print("📋 15. Создание таблицы chat_messages...")
        await conn.execute("""
            CREATE TABLE chat_messages (
                id SERIAL PRIMARY KEY,
                room_id INTEGER REFERENCES chat_rooms(id) NOT NULL,
                sender_id INTEGER REFERENCES users(id),
                bot_id INTEGER REFERENCES chat_bots(id),
                content TEXT NOT NULL,
                is_edited BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # 16. Создание таблицы chat_room_folders
        print("📋 16. Создание таблицы chat_room_folders...")
        await conn.execute("""
            CREATE TABLE chat_room_folders (
                id SERIAL PRIMARY KEY,
                room_id INTEGER REFERENCES chat_rooms(id) NOT NULL,
                folder_id INTEGER REFERENCES chat_folders(id) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """)

        # Создание индексов для производительности
        print("📋 17. Создание индексов...")
        await conn.execute("""
            CREATE INDEX idx_users_username ON users(username);
            CREATE INDEX idx_users_email ON users(email);
            CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
            CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
            CREATE INDEX idx_chat_participants_room_id ON chat_participants(room_id);
            CREATE INDEX idx_events_start_date ON events(start_date);
            CREATE INDEX idx_events_end_date ON events(end_date);
        """)

        await conn.close()

        print("\n" + "=" * 60)
        print("🎉 БАЗА ДАННЫХ СОЗДАНА УСПЕШНО!")
        print("\n📊 СТРУКТУРА БАЗЫ ДАННЫХ:")
        print("   ✅ departments - отделы")
        print("   ✅ users - пользователи")
        print("   ✅ teams - команды")
        print("   ✅ team_members - участники команд")
        print("   ✅ company_employees - сотрудники компании")
        print("   ✅ news - новости")
        print("   ✅ ved_nomenclature - номенклатура ВЭД")
        print("   ✅ ved_passports - ВЭД паспорта")
        print("   ✅ events - события")
        print("   ✅ event_participants - участники событий")
        print("   ✅ chat_bots - чат боты")
        print("   ✅ chat_rooms - чат комнаты")
        print("   ✅ chat_folders - папки чатов")
        print("   ✅ chat_participants - участники чатов")
        print("   ✅ chat_messages - сообщения чатов")
        print("   ✅ chat_room_folders - связи комнат и папок")
        print("   ✅ Индексы для производительности")
        print("\n🔄 Теперь перезапустите сервисы:")
        print("   docker-compose restart")
        print("\n📋 И создайте администратора:")
        print("   python create_admin_db.py")

    except Exception as e:
        print(f"❌ Ошибка создания базы данных: {e}")
        import traceback
        traceback.print_exc()
        return False

    return True

async def main():
    """Главная функция"""
    success = await create_database_from_scratch()
    if success:
        print("\n🎯 БАЗА ДАННЫХ ГОТОВА К РАБОТЕ!")
        print("   Теперь все таблицы созданы с правильной структурой")
    else:
        print("\n❌ ОШИБКА СОЗДАНИЯ БАЗЫ ДАННЫХ!")

if __name__ == "__main__":
    asyncio.run(main())
