import asyncio
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
        # Проверяем, существует ли уже админ
        result = await async_session.execute(select(User).where(User.username == "admin"))
        existing_admin = result.scalar_one_or_none()
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
