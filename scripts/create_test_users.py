#!/usr/bin/env python3
"""
Скрипт для создания тестовых пользователей со всеми ролями
"""

import asyncio
import sys
import os

# Добавляем путь к backend в PYTHONPATH
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database import AsyncSessionLocal
from models import User, Department
from passlib.context import CryptContext
from sqlalchemy import text

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def create_test_users():
    """Создание тестовых пользователей со всеми ролями"""
    print("👥 Создание тестовых пользователей...")
    
    # Тестовые пользователи
    test_users = [
        {
            "username": "admin",
            "email": "admin@almazgeobur.ru",
            "password": "AdminPass123!",
            "first_name": "Администратор",
            "last_name": "Системы",
            "role": "admin",
            "position": "Главный администратор"
        },
        {
            "username": "manager1",
            "email": "manager1@almazgeobur.ru",
            "password": "ManagerPass123!",
            "first_name": "Александр",
            "last_name": "Петров",
            "middle_name": "Иванович",
            "role": "manager",
            "position": "Менеджер по продажам"
        },
        {
            "username": "employee1",
            "email": "employee1@almazgeobur.ru",
            "password": "EmployeePass123!",
            "first_name": "Мария",
            "last_name": "Сидорова",
            "middle_name": "Петровна",
            "role": "employee",
            "position": "Инженер-технолог"
        },
        {
            "username": "ved_passport1",
            "email": "ved1@almazgeobur.ru",
            "password": "VedPass123!",
            "first_name": "Елена",
            "last_name": "Козлова",
            "middle_name": "Сергеевна",
            "role": "ved_passport",
            "position": "Специалист по ВЭД"
        },
        {
            "username": "user1",
            "email": "user1@almazgeobur.ru",
            "password": "UserPass123!",
            "first_name": "Дмитрий",
            "last_name": "Волков",
            "middle_name": "Александрович",
            "role": "user",
            "position": "Менеджер по закупкам"
        },
        {
            "username": "manager2",
            "email": "manager2@almazgeobur.ru",
            "password": "ManagerPass123!",
            "first_name": "Ольга",
            "last_name": "Морозова",
            "middle_name": "Владимировна",
            "role": "manager",
            "position": "Менеджер по производству"
        },
        {
            "username": "employee2",
            "email": "employee2@almazgeobur.ru",
            "password": "EmployeePass123!",
            "first_name": "Игорь",
            "last_name": "Новиков",
            "middle_name": "Петрович",
            "role": "employee",
            "position": "Техник-конструктор"
        }
    ]
    
    try:
        async with AsyncSessionLocal() as db:
            # Создаем отделы
            departments = [
                {"name": "Отдел продаж", "description": "Отдел по работе с клиентами и продажам"},
                {"name": "Производственный отдел", "description": "Отдел производства и технологий"},
                {"name": "Отдел ВЭД", "description": "Отдел внешнеэкономической деятельности"},
                {"name": "Отдел закупок", "description": "Отдел по закупке материалов и оборудования"},
                {"name": "Технический отдел", "description": "Отдел технической поддержки и разработки"}
            ]
            
            created_departments = []
            for dept_data in departments:
                # Проверяем, существует ли отдел
                result = await db.execute(
                    text("SELECT id FROM departments WHERE name = :name"),
                    {"name": dept_data["name"]}
                )
                existing = result.fetchone()
                
                if not existing:
                    dept = Department(
                        name=dept_data["name"],
                        description=dept_data["description"],
                        is_active=True,
                        sort_order=len(created_departments)
                    )
                    db.add(dept)
                    await db.flush()
                    created_departments.append(dept)
                    print(f"✅ Создан отдел: {dept.name}")
                else:
                    print(f"ℹ️ Отдел уже существует: {dept_data['name']}")
                    created_departments.append({"id": existing[0], "name": dept_data["name"]})
            
            await db.commit()
            
            # Создаем пользователей
            created_users = []
            for i, user_data in enumerate(test_users):
                # Проверяем, существует ли пользователь
                result = await db.execute(
                    text("SELECT id FROM users WHERE username = :username"),
                    {"username": user_data["username"]}
                )
                existing = result.fetchone()
                
                if not existing:
                    # Назначаем отдел (циклически)
                    dept_id = created_departments[i % len(created_departments)].id if hasattr(created_departments[i % len(created_departments)], 'id') else created_departments[i % len(created_departments)]["id"]
                    
                    user = User(
                        username=user_data["username"],
                        email=user_data["email"],
                        hashed_password=get_password_hash(user_data["password"]),
                        first_name=user_data["first_name"],
                        last_name=user_data["last_name"],
                        middle_name=user_data.get("middle_name"),
                        role=user_data["role"],
                        position=user_data["position"],
                        department_id=dept_id,
                        is_active=True,
                        is_password_changed=True
                    )
                    
                    db.add(user)
                    await db.flush()
                    created_users.append(user)
                    print(f"✅ Создан пользователь: {user.full_name} ({user.role})")
                else:
                    print(f"ℹ️ Пользователь уже существует: {user_data['username']}")
            
            await db.commit()
            print(f"\n🎉 Создано {len(created_users)} новых пользователей!")
            
            # Выводим сводку
            print("\n📋 Созданные пользователи:")
            for user in created_users:
                print(f"  - {user.full_name} ({user.username}) - {user.role} - {user.position}")
            
            print("\n📋 Созданные отделы:")
            for dept in created_departments:
                dept_name = dept.name if hasattr(dept, 'name') else dept["name"]
                print(f"  - {dept_name}")
                
    except Exception as e:
        print(f"❌ Ошибка при создании пользователей: {e}")
        import traceback
        traceback.print_exc()
        raise

async def main():
    """Основная функция"""
    print("🚀 Создание тестовых пользователей и отделов...")
    
    try:
        await create_test_users()
        print("\n🎉 Все тестовые данные созданы успешно!")
        
    except Exception as e:
        print(f"\n💥 Критическая ошибка: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
