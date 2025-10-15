#!/usr/bin/env python3
"""
Скрипт для добавления поля is_password_changed в таблицу users
"""

import asyncio
import sys
import os

# Добавляем корневую директорию проекта в путь
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db, engine
from sqlalchemy import text
from models import Base

async def add_password_changed_field():
    """Добавляет поле is_password_changed в таблицу users"""
    
    # SQL для добавления поля
    add_column_sql = """
    ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS is_password_changed BOOLEAN DEFAULT FALSE;
    """
    
    # SQL для обновления существующих пользователей
    update_existing_users_sql = """
    UPDATE users 
    SET is_password_changed = TRUE 
    WHERE is_password_changed IS NULL;
    """
    
    try:
        async with engine.begin() as conn:
            print("Добавляем поле is_password_changed в таблицу users...")
            await conn.execute(text(add_column_sql))
            print("✅ Поле is_password_changed добавлено")
            
            print("Обновляем существующих пользователей...")
            result = await conn.execute(text(update_existing_users_sql))
            print(f"✅ Обновлено {result.rowcount} пользователей")
            
            print("🎉 Миграция завершена успешно!")
            
    except Exception as e:
        print(f"❌ Ошибка при выполнении миграции: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(add_password_changed_field())
