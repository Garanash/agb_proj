#!/usr/bin/env python3
"""
Локальная настройка и тест базы данных
"""
import asyncio
import sys
import os

# Добавляем путь к backend
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

# Используем тестовую базу данных
os.environ['DATABASE_URL'] = 'sqlite+aiosqlite:///./test_local.db'

async def setup_database():
    """Настраиваем базу данных"""
    try:
        print("🔧 Настраиваем локальную базу данных...")

        # Импортируем модели с тестовой БД
        import importlib.util
        spec = importlib.util.spec_from_file_location("database", "/Users/andreydolgov/Desktop/programming/agb_proj/backend/database_test.py")
        db_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(db_module)

        # Импортируем модели
        from models import Base, User, UserRole

        # Создаем таблицы
        async with db_module.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        print("✅ База данных настроена")

        # Создаем тестового пользователя
        from sqlalchemy import select
        from passlib.context import CryptContext

        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

        async with db_module.AsyncSessionLocal() as session:
            # Проверяем, есть ли уже пользователь
            result = await session.execute(select(User).where(User.username == "admin"))
            existing_user = result.scalar_one_or_none()

            if not existing_user:
                # Создаем администратора
                hashed_password = pwd_context.hash("admin123")
                admin_user = User(
                    username="admin",
                    email="admin@localhost",
                    hashed_password=hashed_password,
                    first_name="Администратор",
                    last_name="Системы",
                    role=UserRole.ADMIN,
                    is_active=True
                )
                session.add(admin_user)
                await session.commit()
                print("✅ Тестовый администратор создан")
            else:
                print("✅ Тестовый администратор уже существует")

        return True

    except Exception as e:
        print(f"❌ Ошибка настройки БД: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_basic_api():
    """Тестируем базовый API без сервера"""
    try:
        print("🔍 Тестируем базовые импорты API...")

        # Импортируем роутеры
        from routers.auth import router as auth_router
        from routers.users import router as users_router
        from routers.chat import router as chat_router

        print("✅ Роутеры импортированы успешно")

        # Проверяем, что у роутеров есть маршруты
        auth_routes = len(list(auth_router.routes))
        users_routes = len(list(users_router.routes))
        chat_routes = len(list(chat_router.routes))

        print(f"✅ Auth роутер: {auth_routes} маршрутов")
        print(f"✅ Users роутер: {users_routes} маршрутов")
        print(f"✅ Chat роутер: {chat_routes} маршрутов")

        return True

    except Exception as e:
        print(f"❌ Ошибка тестирования API: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Главная функция"""
    print("🚀 ЛОКАЛЬНАЯ НАСТРОЙКА И ТЕСТИРОВАНИЕ")
    print("=" * 50)

    # 1. Настраиваем базу данных
    db_result = await setup_database()

    # 2. Тестируем API
    api_result = await test_basic_api()

    print("\n" + "=" * 50)
    if db_result and api_result:
        print("🎉 Локальная настройка прошла успешно!")
        print("\nТеперь можно запускать приложение через Docker:")
        print("cd /Users/andreydolgov/Desktop/programming/agb_proj")
        print("./universal_deploy.sh")
        return True
    else:
        print("💥 Есть проблемы с локальной настройкой")
        return False

if __name__ == "__main__":
    result = asyncio.run(main())
    sys.exit(0 if result else 1)
