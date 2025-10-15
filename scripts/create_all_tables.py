#!/usr/bin/env python3
"""
Скрипт для создания всех необходимых таблиц в базе данных
"""

import asyncio
import sys
import os

# Добавляем путь к backend в PYTHONPATH
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database import async_engine
from models import Base
from sqlalchemy import text

async def create_all_tables():
    """Создание всех таблиц из моделей"""
    print("🚀 Создание всех таблиц в базе данных...")
    
    try:
        # Создаем все таблицы из моделей
        async with async_engine.begin() as conn:
            # Создаем все таблицы
            await conn.run_sync(Base.metadata.create_all)
            print("✅ Все таблицы успешно созданы!")
            
            # Проверяем созданные таблицы
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """))
            
            tables = result.fetchall()
            print(f"\n📋 Созданные таблицы ({len(tables)}):")
            for table in tables:
                print(f"  - {table[0]}")
                
    except Exception as e:
        print(f"❌ Ошибка при создании таблиц: {e}")
        raise

async def create_admin_user():
    """Создание администратора"""
    print("\n👤 Создание администратора...")
    
    try:
        from database import AsyncSessionLocal
        from models import User
        import bcrypt
        
        async with AsyncSessionLocal() as db:
            # Проверяем, существует ли уже админ
            existing_admin = await db.execute(
                text("SELECT id FROM users WHERE username = 'admin'")
            )
            if existing_admin.fetchone():
                print("✅ Администратор уже существует")
                return
            
            # Создаем хеш пароля
            password = "admin123"
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            # Создаем администратора
            admin = User(
                username="admin",
                email="admin@almazgeobur.ru",
                hashed_password=hashed_password,
                first_name="Администратор",
                last_name="Системы",
                role="admin",
                is_active=True,
                is_password_changed=True
            )
            
            db.add(admin)
            await db.commit()
            print("✅ Администратор создан: admin / admin123")
            
    except Exception as e:
        print(f"❌ Ошибка при создании администратора: {e}")
        raise

async def main():
    """Основная функция"""
    print("🔧 Инициализация базы данных...")
    
    try:
        # Создаем все таблицы
        await create_all_tables()
        
        # Создаем администратора
        await create_admin_user()
        
        print("\n🎉 Инициализация базы данных завершена успешно!")
        print("\n📝 Доступные данные:")
        print("  - Логин: admin")
        print("  - Пароль: admin123")
        
    except Exception as e:
        print(f"\n💥 Критическая ошибка: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
