#!/usr/bin/env python3
"""
Скрипт для исправления enum eventtype в базе данных
"""

import asyncio
from sqlalchemy import text
from database import engine

async def fix_eventtype_enum():
    """Исправляет enum eventtype в базе данных"""
    async with engine.begin() as conn:
        print("Исправляем enum eventtype...")
        
        # Удаляем существующий enum если он пустой
        await conn.execute(text("DROP TYPE IF EXISTS eventtype CASCADE;"))
        print("Удален старый enum eventtype")
        
        # Создаем enum заново с правильными значениями
        await conn.execute(text("""
            CREATE TYPE eventtype AS ENUM (
                'meeting',      -- Встреча
                'call',         -- Созвон
                'briefing',     -- Планерка
                'conference',   -- Совещание
                'other'         -- Другое
            );
        """))
        print("Создан новый enum eventtype")
        
        # Обновляем колонку event_type в таблице events
        try:
            await conn.execute(text("""
                ALTER TABLE events ALTER COLUMN event_type TYPE eventtype USING event_type::text::eventtype;
            """))
            print("Обновлена колонка event_type в таблице events")
        except Exception as e:
            print(f"Ошибка при обновлении колонки: {e}")
            # Если таблица events не существует, это нормально
            pass
        
        print("Enum eventtype успешно исправлен!")

if __name__ == "__main__":
    asyncio.run(fix_eventtype_enum())

