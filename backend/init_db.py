import asyncio
import asyncpg
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine, get_db
from models import User, News, UserRole, NewsCategory, Department
from passlib.context import CryptContext
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_user():
    """Создание администратора по умолчанию"""
    async with engine.begin() as conn:
        # Получаем сессию
        async_session = AsyncSession(engine)
        
        try:
            # Проверяем, существует ли уже админ
            existing_admin = await async_session.get(User, 1)
            if existing_admin:
                print("✅ Администратор уже существует!")
                return
            
            # Создаем администратора
            admin_user = User(
                username="admin",
                email="admin@almazgeobur.kz",
                first_name="Администратор",
                last_name="Системы",
                middle_name="",
                hashed_password=pwd_context.hash("neurofork1"),
                role=UserRole.ADMIN,
                is_active=True
            )
            
            async_session.add(admin_user)
            await async_session.commit()
            
            # Обновляем объект чтобы получить ID
            await async_session.refresh(admin_user)
            
            # Создаем отдел администрации
            admin_department = Department(
                name="Администрация",
                description="Административный отдел компании"
            )
            
            async_session.add(admin_department)
            await async_session.commit()
            
            # Назначаем админа в отдел администрации
            admin_user.department_id = admin_department.id
            await async_session.commit()
            
            print("✅ Администратор успешно создан!")
            print("\n🔑 Данные для входа:")
            print("Логин: admin")
            print("Пароль: neurofork1")
            
        except Exception as e:
            print(f"❌ Ошибка при создании администратора: {e}")
            import traceback
            traceback.print_exc()
            await async_session.rollback()
        finally:
            await async_session.close()

if __name__ == "__main__":
    asyncio.run(create_admin_user())
