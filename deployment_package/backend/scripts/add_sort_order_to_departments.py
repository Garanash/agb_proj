#!/usr/bin/env python3
"""
Скрипт для добавления поля sort_order в таблицу departments
"""

import asyncio
import sys
import os

# Добавляем путь к проекту
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from database import get_db

async def add_sort_order_field():
    """Добавляет поле sort_order в таблицу departments"""
    async for db in get_db():
        try:
            print("🔄 Добавляем поле sort_order в таблицу departments...")
            
            # Проверяем, существует ли уже поле
            result = await db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'departments' 
                AND column_name = 'sort_order'
            """))
            
            if result.fetchone():
                print("✅ Поле sort_order уже существует")
            else:
                # Добавляем поле sort_order
                await db.execute(text("""
                    ALTER TABLE departments 
                    ADD COLUMN sort_order INTEGER DEFAULT 0 NOT NULL
                """))
                print("✅ Поле sort_order добавлено")
            
            # Обновляем существующие записи, устанавливая sort_order равным id
            await db.execute(text("""
                UPDATE departments 
                SET sort_order = id 
                WHERE sort_order = 0 OR sort_order IS NULL
            """))
            print("✅ Значения sort_order обновлены для существующих отделов")
            
            await db.commit()
            print("✅ Изменения сохранены в базе данных")
            
        except Exception as e:
            print(f"❌ Ошибка: {e}")
            await db.rollback()
        finally:
            break

if __name__ == "__main__":
    asyncio.run(add_sort_order_field())
