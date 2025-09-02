#!/usr/bin/env python3
"""
Скрипт для выполнения миграции базы данных
"""
import asyncio
import asyncpg
import os
from pathlib import Path

async def run_migration():
    """Выполнение миграции"""
    
    # Получаем URL базы данных из переменных окружения
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql://felix_user:felix_password@localhost:5432/agb_felix"
    )
    
    # Парсим URL для asyncpg
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql://")
    elif database_url.startswith("postgresql+asyncpg://"):
        database_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
    
    print(f"Подключение к базе данных: {database_url}")
    
    try:
        # Подключаемся к базе данных
        conn = await asyncpg.connect(database_url)
        
        # Читаем файл миграции
        migration_file = Path(__file__).parent / "migrations" / "add_telegram_fields.sql"
        
        if not migration_file.exists():
            print(f"❌ Файл миграции не найден: {migration_file}")
            return
        
        print(f"📖 Чтение файла миграции: {migration_file}")
        migration_sql = migration_file.read_text(encoding='utf-8')
        
        # Выполняем миграцию
        print("🚀 Выполнение миграции...")
        await conn.execute(migration_sql)
        
        print("✅ Миграция успешно выполнена!")
        
        # Проверяем результат
        print("\n📊 Проверка результатов:")
        
        # Проверяем новые поля в repair_requests
        result = await conn.fetch("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'repair_requests' 
            AND column_name IN ('manager_comment', 'final_price', 'sent_to_bot_at')
            ORDER BY column_name
        """)
        
        if result:
            print("✅ Новые поля в repair_requests:")
            for row in result:
                print(f"   - {row['column_name']}: {row['data_type']}")
        else:
            print("❌ Новые поля не найдены в repair_requests")
        
        # Проверяем таблицы Telegram
        tables = ['telegram_bots', 'telegram_users', 'telegram_notifications']
        for table in tables:
            exists = await conn.fetchval(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = '{table}'
                )
            """)
            if exists:
                print(f"✅ Таблица {table} создана")
            else:
                print(f"❌ Таблица {table} не найдена")
        
        # Проверяем бота
        bot_count = await conn.fetchval("SELECT COUNT(*) FROM telegram_bots WHERE is_active = TRUE")
        print(f"✅ Активных ботов в системе: {bot_count}")
        
    except Exception as e:
        print(f"❌ Ошибка при выполнении миграции: {e}")
        raise
    finally:
        if 'conn' in locals():
            await conn.close()

if __name__ == "__main__":
    asyncio.run(run_migration())
