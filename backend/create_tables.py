import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine, Base
from models import *  # Импортируем все модели для создания таблиц

async def create_all_tables():
    """Создание всех таблиц базы данных"""
    try:
        async with engine.begin() as conn:
            # Создаем все таблицы
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Все таблицы успешно созданы!")
            
    except Exception as e:
        print(f"❌ Ошибка при создании таблиц: {e}")

if __name__ == "__main__":
    asyncio.run(create_all_tables())
