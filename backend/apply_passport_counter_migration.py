#!/usr/bin/env python3
"""
Скрипт для применения миграции passport_counters
"""

import asyncio
import sys
import os

# Добавляем путь к модулям
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Устанавливаем переменную окружения для подключения к Docker
os.environ["DATABASE_URL"] = "postgresql+asyncpg://felix_user:felix_password@localhost:15433/agb_felix"

from database import engine
from sqlalchemy import text

async def apply_migration():
    """Применяет миграцию для таблицы passport_counters"""
    
    async with engine.begin() as conn:
        print("🔧 Применяю миграцию для таблицы passport_counters...")
        
        # Создание таблицы
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS passport_counters (
                id SERIAL PRIMARY KEY,
                year INTEGER NOT NULL UNIQUE,
                current_serial INTEGER NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """))
        
        # Создание индекса
        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_passport_counters_year ON passport_counters(year);
        """))
        
        # Вставка начального счетчика для текущего года
        await conn.execute(text("""
            INSERT INTO passport_counters (year, current_serial) 
            VALUES (EXTRACT(YEAR FROM CURRENT_DATE), 0)
            ON CONFLICT (year) DO NOTHING;
        """))
        
        print("✅ Миграция passport_counters успешно применена!")
        
        # Проверяем созданную таблицу
        result = await conn.execute(text("SELECT * FROM passport_counters;"))
        counters = result.fetchall()
        
        print(f"📊 Текущие счетчики в базе данных:")
        for counter in counters:
            print(f"   Год: {counter.year}, Серийный номер: {counter.current_serial}")

if __name__ == "__main__":
    asyncio.run(apply_migration())
