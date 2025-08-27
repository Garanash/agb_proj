#!/usr/bin/env python3
"""
Скрипт для применения миграции исправления папок чатов.
Теперь каждый пользователь может независимо добавлять чаты в свои папки.
"""

import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

async def apply_migration():
    """Применяет миграцию для исправления папок чатов"""
    
    # Получаем параметры подключения к базе данных
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Ошибка: DATABASE_URL не найден в переменных окружения")
        return
    
    try:
        # Подключаемся к базе данных
        print("Подключение к базе данных...")
        conn = await asyncpg.connect(database_url)
        
        # Читаем SQL миграцию
        migration_file = "migrations/fix_chat_room_folders_user_specific.sql"
        with open(migration_file, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        print("Применение миграции...")
        print("ВНИМАНИЕ: Эта миграция удалит существующую таблицу chat_room_folders!")
        print("Все существующие связи чатов с папками будут потеряны.")
        
        # Запрашиваем подтверждение
        confirm = input("Продолжить? (y/N): ")
        if confirm.lower() != 'y':
            print("Миграция отменена.")
            return
        
        # Выполняем миграцию
        await conn.execute(migration_sql)
        
        print("✅ Миграция успешно применена!")
        print("Теперь каждый пользователь может независимо добавлять чаты в свои папки.")
        
    except Exception as e:
        print(f"❌ Ошибка при применении миграции: {e}")
    finally:
        if 'conn' in locals():
            await conn.close()

if __name__ == "__main__":
    asyncio.run(apply_migration())
