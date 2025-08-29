#!/usr/bin/env python3

"""
Скрипт для создания администратора напрямую в базе данных
Запускать на сервере: python create-admin-db.py
"""

import asyncio
import sys
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from passlib.context import CryptContext

# Импортируем модели
sys.path.append('/app')
from models import User, UserRole
from database import DATABASE_URL

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin():
    """Создание администратора"""

    # Параметры администратора
    admin_username = "admin"
    admin_password = "admin123"
    admin_email = "admin@almazgeobur.ru"
    admin_first_name = "Администратор"
    admin_last_name = "Системы"

    print("👤 Создание администратора...")
    print(f"Логин: {admin_username}")
    print(f"Email: {admin_email}")
    print(f"Имя: {admin_first_name} {admin_last_name}")
    print()

    # Создаем подключение к БД
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            # Проверяем, существует ли уже администратор
            result = await session.execute(select(User).where(User.username == admin_username))
            existing_admin = result.scalar_one_or_none()

            if existing_admin:
                print(f"✅ Администратор {admin_username} уже существует!")
                return

            # Создаем администратора
            admin_user = User(
                username=admin_username,
                email=admin_email,
                first_name=admin_first_name,
                last_name=admin_last_name,
                middle_name="",
                hashed_password=pwd_context.hash(admin_password),
                role=UserRole.ADMIN,
                is_active=True
            )

            session.add(admin_user)
            await session.commit()
            await session.refresh(admin_user)

            print("✅ Администратор успешно создан!")
            print()
            print("📋 Данные для входа:")
            print(f"Логин: {admin_username}")
            print(f"Пароль: {admin_password}")
            print(f"Email: {admin_email}")

        except Exception as e:
            print(f"❌ Ошибка при создании администратора: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()

async def main():
    """Основная функция"""
    await create_admin()

if __name__ == "__main__":
    asyncio.run(main())
