import asyncio
import sys
import os

# Добавляем путь к корневой директории проекта
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy import text

async def add_search_fields():
    async with engine.begin() as conn:
        # Добавляем колонки search_query и search_type
        await conn.execute(
            text("""
            ALTER TABLE ai_chat_messages 
            ADD COLUMN IF NOT EXISTS search_query VARCHAR,
            ADD COLUMN IF NOT EXISTS search_type VARCHAR;
            """)
        )
        print("✅ Колонки search_query и search_type успешно добавлены")

if __name__ == "__main__":
    asyncio.run(add_search_fields())

