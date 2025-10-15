#!/usr/bin/env python3
"""
Скрипт для создания тестовых данных раздела "О нас"
"""

import asyncio
import sys
import os

# Добавляем путь к backend в PYTHONPATH
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database import AsyncSessionLocal
from models import CompanyEmployee, Department
from sqlalchemy import text

async def create_about_data():
    """Создание данных для раздела 'О нас'"""
    print("🏢 Создание данных раздела 'О нас'...")
    
    try:
        async with AsyncSessionLocal() as db:
            # Получаем отделы
            result = await db.execute(text("SELECT id, name FROM departments WHERE is_active = true"))
            departments = result.fetchall()
            dept_map = {dept[1]: dept[0] for dept in departments}
            
            # Тестовые сотрудники компании
            employees = [
                {
                    "first_name": "Владимир",
                    "last_name": "Иванов",
                    "middle_name": "Петрович",
                    "position": "Генеральный директор",
                    "department": "Отдел продаж",
                    "email": "director@almazgeobur.ru",
                    "phone": "+7 (495) 123-45-67",
                    "sort_order": 1
                },
                {
                    "first_name": "Анна",
                    "last_name": "Смирнова",
                    "middle_name": "Александровна",
                    "position": "Заместитель генерального директора",
                    "department": "Производственный отдел",
                    "email": "deputy@almazgeobur.ru",
                    "phone": "+7 (495) 123-45-68",
                    "sort_order": 2
                },
                {
                    "first_name": "Михаил",
                    "last_name": "Козлов",
                    "middle_name": "Сергеевич",
                    "position": "Главный инженер",
                    "department": "Технический отдел",
                    "email": "chief_engineer@almazgeobur.ru",
                    "phone": "+7 (495) 123-45-69",
                    "sort_order": 3
                },
                {
                    "first_name": "Елена",
                    "last_name": "Петрова",
                    "middle_name": "Владимировна",
                    "position": "Начальник отдела продаж",
                    "department": "Отдел продаж",
                    "email": "sales_head@almazgeobur.ru",
                    "phone": "+7 (495) 123-45-70",
                    "sort_order": 4
                },
                {
                    "first_name": "Дмитрий",
                    "last_name": "Соколов",
                    "middle_name": "Игоревич",
                    "position": "Начальник производственного отдела",
                    "department": "Производственный отдел",
                    "email": "production_head@almazgeobur.ru",
                    "phone": "+7 (495) 123-45-71",
                    "sort_order": 5
                },
                {
                    "first_name": "Татьяна",
                    "last_name": "Морозова",
                    "middle_name": "Андреевна",
                    "position": "Начальник отдела ВЭД",
                    "department": "Отдел ВЭД",
                    "email": "ved_head@almazgeobur.ru",
                    "phone": "+7 (495) 123-45-72",
                    "sort_order": 6
                },
                {
                    "first_name": "Алексей",
                    "last_name": "Волков",
                    "middle_name": "Николаевич",
                    "position": "Начальник отдела закупок",
                    "department": "Отдел закупок",
                    "email": "procurement_head@almazgeobur.ru",
                    "phone": "+7 (495) 123-45-73",
                    "sort_order": 7
                },
                {
                    "first_name": "Светлана",
                    "last_name": "Новикова",
                    "middle_name": "Петровна",
                    "position": "Ведущий инженер-технолог",
                    "department": "Технический отдел",
                    "email": "tech_lead@almazgeobur.ru",
                    "phone": "+7 (495) 123-45-74",
                    "sort_order": 8
                },
                {
                    "first_name": "Игорь",
                    "last_name": "Федоров",
                    "middle_name": "Владимирович",
                    "position": "Старший менеджер по продажам",
                    "department": "Отдел продаж",
                    "email": "senior_sales@almazgeobur.ru",
                    "phone": "+7 (495) 123-45-75",
                    "sort_order": 9
                },
                {
                    "first_name": "Наталья",
                    "last_name": "Кузнецова",
                    "middle_name": "Сергеевна",
                    "position": "Специалист по ВЭД",
                    "department": "Отдел ВЭД",
                    "email": "ved_specialist@almazgeobur.ru",
                    "phone": "+7 (495) 123-45-76",
                    "sort_order": 10
                }
            ]
            
            created_employees = []
            for emp_data in employees:
                # Проверяем, существует ли сотрудник
                result = await db.execute(
                    text("SELECT id FROM company_employees WHERE first_name = :first_name AND last_name = :last_name"),
                    {"first_name": emp_data["first_name"], "last_name": emp_data["last_name"]}
                )
                existing = result.fetchone()
                
                if not existing:
                    dept_id = dept_map.get(emp_data["department"])
                    
                    employee = CompanyEmployee(
                        first_name=emp_data["first_name"],
                        last_name=emp_data["last_name"],
                        middle_name=emp_data["middle_name"],
                        position=emp_data["position"],
                        department_id=dept_id,
                        email=emp_data["email"],
                        phone=emp_data["phone"],
                        is_active=True,
                        sort_order=emp_data["sort_order"]
                    )
                    
                    db.add(employee)
                    await db.flush()
                    created_employees.append(employee)
                    print(f"✅ Создан сотрудник: {employee.full_name} - {employee.position}")
                else:
                    print(f"ℹ️ Сотрудник уже существует: {emp_data['first_name']} {emp_data['last_name']}")
            
            await db.commit()
            print(f"\n🎉 Создано {len(created_employees)} сотрудников для раздела 'О нас'!")
            
            # Выводим сводку по отделам
            print("\n📋 Сотрудники по отделам:")
            for dept_name, dept_id in dept_map.items():
                result = await db.execute(
                    text("SELECT first_name, last_name, middle_name, position FROM company_employees WHERE department_id = :dept_id AND is_active = true ORDER BY sort_order"),
                    {"dept_id": dept_id}
                )
                employees_in_dept = result.fetchall()
                print(f"\n  {dept_name}:")
                for emp in employees_in_dept:
                    full_name = f"{emp[1]} {emp[0]} {emp[2]}" if emp[2] else f"{emp[1]} {emp[0]}"
                    print(f"    - {full_name} - {emp[3]}")
                
    except Exception as e:
        print(f"❌ Ошибка при создании данных 'О нас': {e}")
        import traceback
        traceback.print_exc()
        raise

async def main():
    """Основная функция"""
    print("🚀 Создание данных раздела 'О нас'...")
    
    try:
        await create_about_data()
        print("\n🎉 Данные раздела 'О нас' созданы успешно!")
        
    except Exception as e:
        print(f"\n💥 Критическая ошибка: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
