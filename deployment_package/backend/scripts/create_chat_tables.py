#!/usr/bin/env python3
"""
Скрипт для создания таблиц чата в базе данных
"""

import asyncio
import sys
from pathlib import Path

# Добавляем корневую директорию проекта в путь
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from database import engine, Base
from models import AIChatSession, AIChatMessage

async def create_chat_tables():
    """Создает таблицы для чата"""
    
    print("🔧 Создаем таблицы для чата...")
    
    try:
        async with engine.begin() as conn:
            # Создаем таблицы
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Таблицы чата созданы успешно")
            
            # Проверяем, что таблицы созданы
            from sqlalchemy import text
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('ai_chat_sessions', 'ai_chat_messages')
                ORDER BY table_name
            """))
            
            tables = result.fetchall()
            print(f"📋 Созданные таблицы: {[table[0] for table in tables]}")
            
    except Exception as e:
        print(f"❌ Ошибка создания таблиц: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(create_chat_tables())
