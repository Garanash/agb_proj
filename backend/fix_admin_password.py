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

async def fix_admin_password():
    """Исправление пароля админа"""
    async_session = AsyncSession(engine)

    try:
        # Получаем админа из базы
        result = await async_session.execute(select(User).where(User.username == "admin"))
        admin = result.scalar_one_or_none()

        if not admin:
            print("❌ Админ не найден!")
            return

        print(f"✅ Админ найден: {admin.username}")
        print(f"Текущий хеш: {admin.hashed_password}")

        # Создаем правильный хеш для admin123
        correct_hash = get_password_hash("admin123")
        print(f"Правильный хеш для 'admin123': {correct_hash}")

        # Обновляем пароль
        await async_session.execute(
            update(User)
            .where(User.username == "admin")
            .values(hashed_password=correct_hash)
        )

        await async_session.commit()

        print("✅ Пароль админа успешно исправлен!")
        print("Теперь можно войти с логином 'admin' и паролем 'admin123'")

    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        await async_session.rollback()
    finally:
        await async_session.close()

if __name__ == "__main__":
    asyncio.run(fix_admin_password())
