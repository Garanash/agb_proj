#!/usr/bin/env python3
"""
Отладка проблемы с паролем
"""
import asyncio
import os
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import engine
from models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    """Проверка пароля"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Хеширование пароля"""
    return pwd_context.hash(password)

async def debug_password():
    """Отладка пароля"""
    async_session = AsyncSession(engine)

    try:
        print("🔍 ОТЛАДКА ПРОБЛЕМЫ С ПАРОЛЕМ")
        print("=" * 50)

        # Получаем админа из базы
        result = await async_session.execute(select(User).where(User.username == "admin"))
        admin = result.scalar_one_or_none()

        if not admin:
            print("❌ Админ не найден!")
            return

        print(f"✅ Админ найден: {admin.username}")
        print(f"📧 Email: {admin.email}")
        print(f"🔓 Активен: {admin.is_active}")
        print(f"👤 Роль: {admin.role}")
        print(f"🔑 Хеш пароля из базы: {admin.hashed_password}")
        print()

        # Тестируем разные пароли
        test_passwords = ["admin", "admin123", "password", "123456", "felix_password"]

        print("🧪 ТЕСТИРОВАНИЕ ПАРОЛЕЙ:")
        print("-" * 30)

        for password in test_passwords:
            is_valid = verify_password(password, admin.hashed_password)
            status = "✅ ВЕРНЫЙ" if is_valid else "❌ НЕВЕРНЫЙ"
            print(f"{password}: {status}")

        print()

        # Проверяем правильный хеш для admin123
        print("🔧 ГЕНЕРАЦИЯ ПРАВИЛЬНОГО ХЕША:")
        correct_hash = get_password_hash("admin123")
        print(f"Правильный хеш для 'admin123': {correct_hash}")
        print()

        # Сравниваем хеши
        print("⚖️ СРАВНЕНИЕ ХЕШЕЙ:")
        if admin.hashed_password == correct_hash:
            print("✅ Хеш в базе СОВПАДАЕТ с правильным!")
        else:
            print("❌ Хеш в базе НЕ СОВПАДАЕТ с правильным!")
            print(f"Текущий хеш:  {admin.hashed_password}")
            print(f"Правильный:   {correct_hash}")
            print()

            # Предлагаем исправить
            print("🔧 ИСПРАВЛЕНИЕ:")
            print("Хотите исправить пароль? Запустите:")
            print("python reset_admin.py")

    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await async_session.close()

if __name__ == "__main__":
    asyncio.run(debug_password())
