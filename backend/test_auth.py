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

async def test_auth():
    """Тест аутентификации"""
    async_session = AsyncSession(engine)

    try:
        # Получаем админа из базы
        result = await async_session.execute(select(User).where(User.username == "admin"))
        admin = result.scalar_one_or_none()

        if not admin:
            print("❌ Админ не найден!")
            return

        print(f"✅ Админ найден: {admin.username}")
        print(f"Email: {admin.email}")
        print(f"Активен: {admin.is_active}")
        print(f"Роль: {admin.role}")
        print(f"Хеш пароля: {admin.hashed_password}")

        # Тестируем разные пароли
        test_passwords = ["admin", "admin123", "password", "123456"]

        for password in test_passwords:
            is_valid = verify_password(password, admin.hashed_password)
            print(f"Пароль '{password}': {'✅ Верный' if is_valid else '❌ Неверный'}")

        # Показываем правильный хеш для admin123
        correct_hash = get_password_hash("admin123")
        print(f"\nПравильный хеш для 'admin123': {correct_hash}")

        # Проверяем, совпадает ли хеш в базе
        if admin.hashed_password == correct_hash:
            print("✅ Хеш в базе совпадает с правильным!")
        else:
            print("❌ Хеш в базе НЕ совпадает с правильным!")
            print("Текущий хеш:", admin.hashed_password)
            print("Правильный хеш:", correct_hash)

    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await async_session.close()

if __name__ == "__main__":
    asyncio.run(test_auth())
