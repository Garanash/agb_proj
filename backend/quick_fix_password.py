#!/usr/bin/env python3
"""
Быстрое исправление пароля админа
"""
import asyncio
import os
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from database import engine
from models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    """Хеширование пароля"""
    return pwd_context.hash(password)

async def quick_fix_password():
    """Быстрое исправление пароля админа"""
    async_session = AsyncSession(engine)

    try:
        print("🔧 БЫСТРОЕ ИСПРАВЛЕНИЕ ПАРОЛЯ АДМИНА")
        print("=" * 45)

        # Получаем админа
        result = await async_session.execute(select(User).where(User.username == "admin"))
        admin = result.scalar_one_or_none()

        if not admin:
            print("❌ Админ не найден!")
            return

        print(f"✅ Найден админ: {admin.username}")

        # Генерируем правильный хеш для admin123
        correct_password = "admin123"
        correct_hash = get_password_hash(correct_password)

        print(f"🔑 Новый пароль: {correct_password}")
        print(f"🔐 Новый хеш: {correct_hash}")

        # Обновляем пароль
        await async_session.execute(
            update(User)
            .where(User.username == "admin")
            .values(hashed_password=correct_hash)
        )

        await async_session.commit()

        print("✅ ПАРОЛЬ АДМИНА УСПЕШНО ОБНОВЛЕН!")
        print()
        print("🔑 ДАННЫЕ ДЛЯ ВХОДА:")
        print(f"   Логин: admin")
        print(f"   Пароль: {correct_password}")
        print()
        print("🎉 Теперь попробуйте войти в систему!")

    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        await async_session.rollback()
    finally:
        await async_session.close()

if __name__ == "__main__":
    asyncio.run(quick_fix_password())
