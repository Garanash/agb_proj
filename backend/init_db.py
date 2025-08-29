import asyncio
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import engine
from models import User, UserRole, Department
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_admin_user():
    """Создание администратора по умолчанию"""
    async_session = AsyncSession(engine)
    
    try:
        # Получаем данные из переменных окружения или используем значения по умолчанию
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        admin_email = os.getenv("ADMIN_EMAIL", "admin@almazgeobur.ru")
        admin_first_name = os.getenv("ADMIN_FIRST_NAME", "Администратор")
        admin_last_name = os.getenv("ADMIN_LAST_NAME", "Системы")
        
        # Проверяем, существует ли уже админ
        result = await async_session.execute(select(User).where(User.username == admin_username))
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
        
        async_session.add(admin_user)
        await async_session.commit()
        
        # Создаем отдел администрации
        admin_department = Department(
            name="Администрация",
            description="Административный отдел компании"
        )
        
        async_session.add(admin_department)
        await async_session.commit()
        
        # Обновляем объект отдела чтобы получить ID
        await async_session.refresh(admin_department)
        
        # Назначаем админа в отдел администрации
        admin_user.department_id = admin_department.id
        await async_session.commit()
        
        # Назначаем админа главой отдела администрации
        admin_department.head_id = admin_user.id
        await async_session.commit()
        
        print("✅ Администратор успешно создан!")
        print(f"\n🔑 Данные для входа:")
        print(f"Логин: {admin_username}")
        print(f"Пароль: {admin_password}")
        print(f"Email: {admin_email}")
        
    except Exception as e:
        print(f"❌ Ошибка при создании администратора: {e}")
        import traceback
        traceback.print_exc()
        await async_session.rollback()
    finally:
        await async_session.close()

async def main():
    """Основная функция"""
    await create_admin_user()

    # Импортируем и запускаем инициализацию номенклатуры ВЭД
    try:
        print("\n🔄 Инициализация номенклатуры ВЭД...")
        from init_ved_nomenclature import init_ved_nomenclature
        await init_ved_nomenclature()
    except Exception as e:
        print(f"❌ Ошибка при инициализации номенклатуры ВЭД: {e}")

if __name__ == "__main__":
    asyncio.run(main())
