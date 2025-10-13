#!/usr/bin/env python3
"""
Тест подключения к базе данных
"""
import asyncio
import os
from database import engine, AsyncSessionLocal
from sqlalchemy import text

async def test_connection():
    """Тестирует подключение к базе данных"""
    print("=== Тест подключения к базе данных ===")
    print(f"DATABASE_URL: {os.getenv('DATABASE_URL', 'sqlite+aiosqlite:///./test.db')}")
    
    try:
        # Тестируем подключение
        async with AsyncSessionLocal() as session:
            # Проверяем, какие таблицы есть
            result = await session.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
            tables = result.fetchall()
            print(f"Доступные таблицы: {[t[0] for t in tables]}")
            
            # Проверяем количество записей в ved_nomenclatures
            result = await session.execute(text("SELECT COUNT(*) FROM ved_nomenclatures"))
            count = result.fetchone()[0]
            print(f"Количество записей в ved_nomenclatures: {count}")
            
            # Проверяем количество записей в article_mappings
            result = await session.execute(text("SELECT COUNT(*) FROM article_mappings"))
            count = result.fetchone()[0]
            print(f"Количество записей в article_mappings: {count}")
            
    except Exception as e:
        print(f"Ошибка подключения: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())
