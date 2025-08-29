import asyncio
import os
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, insert
from database import engine
from models import User, UserRole

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    """Хеширование пароля"""
    return pwd_context.hash(password)

async def reset_admin():
    """Сброс и пересоздание админа"""
    async_session = AsyncSession(engine)

    try:
        print("🔄 Сбрасываем админа...")

        # Удаляем существующего админа
        result = await async_session.execute(delete(User).where(User.username == "admin"))
        deleted_count = result.rowcount
        print(f"Удалено пользователей: {deleted_count}")

        # Создаем нового админа
        admin_password = "admin123"
        admin_hash = get_password_hash(admin_password)

        new_admin = User(
            username="admin",
            email="admin@almazgeobur.ru",
            first_name="Администратор",
            last_name="Системы",
            middle_name="",
            hashed_password=admin_hash,
            role=UserRole.ADMIN,
            is_active=True
        )

        async_session.add(new_admin)
        await async_session.commit()
        await async_session.refresh(new_admin)

        print("✅ Админ успешно пересоздан!")
        print(f"ID: {new_admin.id}")
        print(f"Логин: {new_admin.username}")
        print(f"Пароль: {admin_password}")
        print(f"Хеш: {new_admin.hashed_password}")

        # Проверяем, что админ создан правильно
        result = await async_session.execute(select(User).where(User.username == "admin"))
        admin_check = result.scalar_one_or_none()

        if admin_check:
            print("✅ Админ найден в базе данных")
            print(f"Активен: {admin_check.is_active}")
            print(f"Роль: {admin_check.role}")
        else:
            print("❌ Админ не найден после создания!")

    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        await async_session.rollback()
    finally:
        await async_session.close()

if __name__ == "__main__":
    asyncio.run(reset_admin())
