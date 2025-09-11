#!/usr/bin/env python3
"""
АВТОМАТИЧЕСКАЯ ИНИЦИАЛИЗАЦИЯ ДАННЫХ ДЛЯ PRODUCTION
Запускается автоматически при старте backend контейнера
"""
import asyncio
import os
import sys
import time
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from database import AsyncSessionLocal
from models import User, VEDNomenclature
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def wait_for_database(max_retries=30, delay=2):
    """Ждет готовности базы данных"""
    print("🔄 Ожидание готовности базы данных...")
    
    for attempt in range(max_retries):
        try:
            async with AsyncSessionLocal() as db:
                await db.execute(text("SELECT 1"))
                print("✅ База данных готова к работе")
                return True
        except Exception as e:
            print(f"⏳ Попытка {attempt + 1}/{max_retries}: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(delay)
            else:
                print("❌ Не удалось подключиться к базе данных")
                return False

async def check_if_initialized():
    """Проверяет, инициализированы ли уже данные"""
    try:
        async with AsyncSessionLocal() as db:
            # Проверяем наличие админа
            result = await db.execute(select(User).where(User.username == "admin"))
            admin_exists = result.scalar_one_or_none()
            
            # Проверяем наличие номенклатуры
            result = await db.execute(select(VEDNomenclature))
            nomenclature_exists = result.scalar_one_or_none()
            
            return admin_exists is not None and nomenclature_exists is not None
    except Exception as e:
        print(f"⚠️ Ошибка при проверке инициализации: {e}")
        return False

async def create_tables():
    """Создает все таблицы в базе данных"""
    print("📋 Создание таблиц базы данных...")
    
    try:
        from models import Base
        from database import engine
        
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ Все таблицы созданы успешно")
        return True
    except Exception as e:
        print(f"❌ Ошибка создания таблиц: {e}")
        import traceback
        traceback.print_exc()
        return False

async def init_production_data():
    """Инициализирует данные для production"""
    print("🚀 Запуск инициализации production данных...")
    
    # Ждем готовности базы данных
    if not await wait_for_database():
        print("❌ Не удалось подключиться к базе данных")
        sys.exit(1)
    
    # Создаем таблицы
    if not await create_tables():
        print("❌ Не удалось создать таблицы")
        sys.exit(1)
    
    # Проверяем, нужно ли инициализировать данные
    if await check_if_initialized():
        print("✅ Данные уже инициализированы, пропускаем...")
        return
    
    print("📝 Начинаем инициализацию данных...")
    
    try:
        # Импортируем функцию инициализации из init_data.py
        from init_data import init_database_data
        
        async with AsyncSessionLocal() as db:
            await init_database_data(db)
            print("✅ Инициализация данных завершена успешно!")
            
    except Exception as e:
        print(f"❌ Ошибка при инициализации данных: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

async def main():
    """Основная функция"""
    print("🎯 AGB Production Data Initializer")
    print("=" * 50)
    
    # Небольшая задержка для стабильности
    await asyncio.sleep(5)
    
    await init_production_data()
    
    print("🎉 Инициализация завершена!")
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(main())
