"""
ИНИЦИАЛИЗАЦИЯ ДАННЫХ ПРИ ЗАПУСКЕ ПРИЛОЖЕНИЯ
Создает все необходимые данные для работы системы
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from datetime import datetime, timedelta

from models import (
    User, Department, CompanyEmployee, News, Event, EventParticipant,
    ChatBot, ChatRoom, ChatParticipant, ChatMessage, ChatFolder,
    VEDNomenclature, VedPassport,
    CustomerProfile, ContractorProfile, RepairRequest, ContractorResponse,
    UserRole, RequestStatus, ResponseStatus,
    TelegramBot, TelegramUser
)
from database import get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def init_database_data(db_session):
    """
    Инициализация всех данных в базе данных
    """
    print("🚀 ИНИЦИАЛИЗАЦИЯ ДАННЫХ...")

    # Счетчики для статистики
    users_count = 0
    employees_count = 0
    nomenclatures_count = 0
    passports_count = 0
    news_count = 0
    events_count = 0

    try:
        # 1. Создаем отделы (если их нет)
        print("📁 Создание отделов...")
        departments_result = await db_session.execute(select(Department))
        existing_departments = departments_result.scalars().all()

        if not existing_departments:
            departments_data = [
                {"name": "Отдел разработки", "description": "Разработка программного обеспечения"},
                {"name": "Отдел бурения", "description": "Буровые работы и оборудование"},
                {"name": "Отдел геологии", "description": "Геологические исследования"},
                {"name": "Администрация", "description": "Административный отдел"},
            ]

            departments = []
            for dept_data in departments_data:
                dept = Department(**dept_data)
                db_session.add(dept)
                departments.append(dept)

            await db_session.flush()
        else:
            departments = existing_departments

        # 2. Создаем пользователей (если их нет)
        print("👤 Создание пользователей...")
        admin_result = await db_session.execute(select(User).where(User.username == "admin"))
        admin_exists = admin_result.scalar_one_or_none()

        if not admin_exists:
            # Создаем отдел разработки, если его нет
            dept_dev_result = await db_session.execute(select(Department).where(Department.name == "Отдел разработки"))
            dept_dev = dept_dev_result.scalar_one_or_none()
            if not dept_dev:
                dept_dev = Department(
                    name="Отдел разработки",
                    description="Разработка программного обеспечения"
                )
                db_session.add(dept_dev)
                await db_session.flush()

            admin_user = User(
                username="admin",
                email="admin@almazgeobur.ru",
                first_name="Администратор",
                last_name="Системы",
                middle_name="",
                hashed_password=get_password_hash("admin123"),
                role="admin",
                department_id=dept_dev.id,
                position="Системный администратор",
                is_active=True
            )
            db_session.add(admin_user)
            users_count += 1

        test_result = await db_session.execute(select(User).where(User.username == "testuser"))
        test_exists = test_result.scalar_one_or_none()

        if not test_exists:
            # Создаем отдел бурения, если его нет
            dept_bur_result = await db_session.execute(select(Department).where(Department.name == "Отдел бурения"))
            dept_bur = dept_bur_result.scalar_one_or_none()
            if not dept_bur:
                dept_bur = Department(
                    name="Отдел бурения",
                    description="Буровые работы и оборудование"
                )
                db_session.add(dept_bur)
                await db_session.flush()

            test_user = User(
                username="testuser",
                email="test@almazgeobur.ru",
                first_name="Тестовый",
                last_name="Пользователь",
                middle_name="Иванович",
                hashed_password=get_password_hash("test123"),
                role="user",
                department_id=dept_bur.id,
                position="Инженер",
                is_active=True
            )
            db_session.add(test_user)
            users_count += 1

        await db_session.flush()

        # Получаем пользователей для дальнейшего использования
        admin_result = await db_session.execute(select(User).where(User.username == "admin"))
        admin_user = admin_result.scalar_one_or_none()

        test_result = await db_session.execute(select(User).where(User.username == "testuser"))
        test_user = test_result.scalar_one_or_none()

        # Обновляем отдел с руководителем
        if admin_user:
            dept_dev_result = await db_session.execute(select(Department).where(Department.name == "Отдел разработки"))
            dept_dev = dept_dev_result.scalar_one_or_none()
            if dept_dev:
                dept_dev.head_id = admin_user.id

        if test_user:
            dept_bur_result = await db_session.execute(select(Department).where(Department.name == "Отдел бурения"))
            dept_bur = dept_bur_result.scalar_one_or_none()
            if dept_bur:
                dept_bur.head_id = test_user.id

        # 3. Создаем сотрудников компании (если их нет)
        print("👥 Создание сотрудников...")
        employees_result = await db_session.execute(select(CompanyEmployee))
        existing_employees = employees_result.scalars().all()

        if not existing_employees:
            employees_data = [
                {
                    "first_name": "Иван", "last_name": "Иванов", "middle_name": "Иванович",
                    "position": "Геолог", "department_id": departments[2].id if len(departments) > 2 else 3,
                    "email": "ivan@almazgeobur.ru", "phone": "+7-999-111-11-11"
                },
                {
                    "first_name": "Петр", "last_name": "Петров", "middle_name": "Петрович",
                    "position": "Буровик", "department_id": departments[1].id if len(departments) > 1 else 2,
                    "email": "petr@almazgeobur.ru", "phone": "+7-999-222-22-22"
                },
                {
                    "first_name": "Сидор", "last_name": "Сидоров", "middle_name": "Сидорович",
                    "position": "Разработчик", "department_id": departments[0].id if departments else 1,
                    "email": "sidor@almazgeobur.ru", "phone": "+7-999-333-33-33"
                },
                {
                    "first_name": "Анна", "last_name": "Кузнецова", "middle_name": "Сергеевна",
                    "position": "Бухгалтер", "department_id": departments[3].id if len(departments) > 3 else 4,
                    "email": "anna@almazgeobur.ru", "phone": "+7-999-444-44-44"
                }
            ]

            employees = []
            for emp_data in employees_data:
                emp = CompanyEmployee(**emp_data)
                db_session.add(emp)
                employees.append(emp)
        else:
            employees = existing_employees

        # 4. Создаем номенклатуру ВЭД (если ее нет)
        print("📋 Создание номенклатуры ВЭД...")
        nomenclature_result = await db_session.execute(select(VEDNomenclature))
        existing_nomenclature = nomenclature_result.scalars().all()

        if not existing_nomenclature:
            nomenclature_data = [
                {
                    "code_1c": "УТ-00047870", "name": "Коронка импрегнированная ALFA NQ 03-05 высота 12 мм",
                    "article": "3501040", "matrix": "NQ", "drilling_depth": "03-05",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047871", "name": "Коронка импрегнированная ALFA NQ 05-07 высота 12 мм",
                    "article": "3501041", "matrix": "NQ", "drilling_depth": "05-07",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047872", "name": "Коронка импрегнированная ALFA NQ 07-09 высота 12 мм",
                    "article": "3501042", "matrix": "NQ", "drilling_depth": "07-09",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047873", "name": "Коронка импрегнированная ALFA NQ 09-12 высота 12 мм",
                    "article": "3501043", "matrix": "NQ", "drilling_depth": "09-12",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047874", "name": "Коронка импрегнированная ALFA NQ 11-13 высота 12 мм",
                    "article": "3501044", "matrix": "NQ", "drilling_depth": "11-13",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047875", "name": "Коронка импрегнированная ALFA HQ 03-05 высота 12 мм",
                    "article": "3501045", "matrix": "HQ", "drilling_depth": "03-05",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047876", "name": "Коронка импрегнированная ALFA HQ 05-07 высота 12 мм",
                    "article": "3501046", "matrix": "HQ", "drilling_depth": "05-07",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047877", "name": "Коронка импрегнированная ALFA HQ 07-09 высота 12 мм",
                    "article": "3501047", "matrix": "HQ", "drilling_depth": "07-09",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047878", "name": "Коронка импрегнированная ALFA HQ 09-12 высота 12 мм",
                    "article": "3501048", "matrix": "HQ", "drilling_depth": "09-12",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047879", "name": "Коронка импрегнированная ALFA HQ 11-13 высота 12 мм",
                    "article": "3501049", "matrix": "HQ", "drilling_depth": "11-13",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047880", "name": "Коронка импрегнированная ALFA PQ 03-05 высота 12 мм",
                    "article": "3501050", "matrix": "PQ", "drilling_depth": "03-05",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047881", "name": "Коронка импрегнированная ALFA PQ 05-07 высота 12 мм",
                    "article": "3501051", "matrix": "PQ", "drilling_depth": "05-07",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047882", "name": "Коронка импрегнированная ALFA PQ 07-09 высота 12 мм",
                    "article": "3501052", "matrix": "PQ", "drilling_depth": "07-09",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047883", "name": "Коронка импрегнированная ALFA PQ 09-12 высота 12 мм",
                    "article": "3501053", "matrix": "PQ", "drilling_depth": "09-12",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047884", "name": "Коронка импрегнированная ALFA PQ 11-13 высота 12 мм",
                    "article": "3501054", "matrix": "PQ", "drilling_depth": "11-13",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00047885", "name": "Расширитель алмазный ALFA NQ",
                    "article": "3501055", "matrix": "NQ", "drilling_depth": None,
                    "height": None, "thread": None, "product_type": "расширитель"
                },
                {
                    "code_1c": "УТ-00047886", "name": "Расширитель алмазный ALFA HQ",
                    "article": "3501056", "matrix": "HQ", "drilling_depth": None,
                    "height": None, "thread": None, "product_type": "расширитель"
                },
                {
                    "code_1c": "УТ-00047887", "name": "Расширитель алмазный ALFA PQ",
                    "article": "3501057", "matrix": "PQ", "drilling_depth": None,
                    "height": None, "thread": None, "product_type": "расширитель"
                },
                {
                    "code_1c": "УТ-00047888", "name": "Башмак обсадной ALFA NW, резьба W",
                    "article": "3501058", "matrix": "NW", "drilling_depth": None,
                    "height": None, "thread": "W", "product_type": "башмак"
                },
                {
                    "code_1c": "УТ-00047889", "name": "Башмак обсадной ALFA HW, резьба W",
                    "article": "3501059", "matrix": "HW", "drilling_depth": None,
                    "height": None, "thread": "W", "product_type": "башмак"
                },
                {
                    "code_1c": "УТ-00047890", "name": "Башмак обсадной ALFA HWT, резьба WT",
                    "article": "3501060", "matrix": "HWT", "drilling_depth": None,
                    "height": None, "thread": "WT", "product_type": "башмак"
                },
                {
                    "code_1c": "УТ-00047891", "name": "Башмак обсадной ALFA PWT, резьба WT",
                    "article": "3501061", "matrix": "PWT", "drilling_depth": None,
                    "height": None, "thread": "WT", "product_type": "башмак"
                },
                {
                    "code_1c": "УТ-00050693", "name": "Коронка импрегнированная ALFA HQ3 05-07 высота 12 мм",
                    "article": "3501062", "matrix": "HQ3", "drilling_depth": "05-07",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052789", "name": "Коронка импрегнированная ALFA NQ3 03-05 высота 12 мм",
                    "article": "3501063", "matrix": "NQ3", "drilling_depth": "03-05",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052790", "name": "Коронка импрегнированная ALFA NQ3 05-07 высота 12 мм",
                    "article": "3501064", "matrix": "NQ3", "drilling_depth": "05-07",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052791", "name": "Коронка импрегнированная ALFA NQ3 07-09 высота 12 мм",
                    "article": "3501065", "matrix": "NQ3", "drilling_depth": "07-09",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052792", "name": "Коронка импрегнированная ALFA NQ3 09-12 высота 12 мм",
                    "article": "3501066", "matrix": "NQ3", "drilling_depth": "09-12",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052793", "name": "Коронка импрегнированная ALFA NQ3 11-13 высота 12 мм",
                    "article": "3501067", "matrix": "NQ3", "drilling_depth": "11-13",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052794", "name": "Коронка импрегнированная ALFA HQ3 03-05 высота 12 мм",
                    "article": "3501068", "matrix": "HQ3", "drilling_depth": "03-05",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052795", "name": "Коронка импрегнированная ALFA HQ3 07-09 высота 12 мм",
                    "article": "3501069", "matrix": "HQ3", "drilling_depth": "07-09",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052796", "name": "Коронка импрегнированная ALFA HQ3 09-12 высота 12 мм",
                    "article": "3501070", "matrix": "HQ3", "drilling_depth": "09-12",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052797", "name": "Коронка импрегнированная ALFA HQ3 11-13 высота 12 мм",
                    "article": "3501071", "matrix": "HQ3", "drilling_depth": "11-13",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052798", "name": "Коронка импрегнированная ALFA PQ3 03-05 высота 12 мм",
                    "article": "3501072", "matrix": "PQ3", "drilling_depth": "03-05",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052799", "name": "Коронка импрегнированная ALFA PQ3 05-07 высота 12 мм",
                    "article": "3501073", "matrix": "PQ3", "drilling_depth": "05-07",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052800", "name": "Коронка импрегнированная ALFA PQ3 07-09 высота 12 мм",
                    "article": "3501074", "matrix": "PQ3", "drilling_depth": "07-09",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052801", "name": "Коронка импрегнированная ALFA PQ3 09-12 высота 12 мм",
                    "article": "3501075", "matrix": "PQ3", "drilling_depth": "09-12",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                },
                {
                    "code_1c": "УТ-00052802", "name": "Коронка импрегнированная ALFA PQ3 11-13 высота 12 мм",
                    "article": "3501076", "matrix": "PQ3", "drilling_depth": "11-13",
                    "height": "12 мм", "thread": None, "product_type": "коронка"
                }
            ]

            nomenclature = []
            for nom_data in nomenclature_data:
                nom = VEDNomenclature(**nom_data)
                db_session.add(nom)
                nomenclature.append(nom)
        else:
            nomenclature = existing_nomenclature

        # 5. Создаем ВЭД паспорта (если их нет)
        print("📄 Создание ВЭД паспортов...")
        passports_result = await db_session.execute(select(VedPassport))
        existing_passports = passports_result.scalars().all()

        if not existing_passports and nomenclature:
            passports_data = [
                {
                    "passport_number": "VED-001-2025",
                    "title": "Паспорт на коронку HQ-001",
                    "description": "Тестовый паспорт для коронки HQ",
                    "status": "active",
                    "order_number": "ORD-001",
                    "quantity": 5,
                    "created_by": admin_user.id if admin_user else 1,
                    "nomenclature_id": nomenclature[0].id
                },
                {
                    "passport_number": "VED-002-2025",
                    "title": "Паспорт на коронку PQ-001",
                    "description": "Тестовый паспорт для коронки PQ",
                    "status": "active",
                    "order_number": "ORD-002",
                    "quantity": 3,
                    "created_by": admin_user.id if admin_user else 1,
                    "nomenclature_id": nomenclature[1].id if len(nomenclature) > 1 else nomenclature[0].id
                }
            ]

            for pass_data in passports_data:
                passport = VedPassport(**pass_data)
                db_session.add(passport)

        # 6. Создаем новости всех типов (если их нет)
        print("📰 Создание новостей...")
        news_result = await db_session.execute(select(News))
        existing_news = news_result.scalars().all()

        if not existing_news:
            news_data = [
                {
                    "title": "Добро пожаловать в систему Felix!",
                    "content": "Мы рады представить новую корпоративную платформу для управления алмазным бурением.",
                    "author_name": "Администратор",
                    "category": "general",
                    "is_published": True,
                    "published_at": datetime.now(),
                    "author_id": admin_user.id if admin_user else 1
                },
                {
                    "title": "Техническое обслуживание оборудования",
                    "content": "Напоминаем о необходимости регулярного технического обслуживания бурового оборудования.",
                    "author_name": "Технический отдел",
                    "category": "technical",
                    "is_published": True,
                    "published_at": datetime.now(),
                    "author_id": admin_user.id if admin_user else 1
                },
                {
                    "title": "Корпоративный пикник",
                    "content": "Приглашаем всех сотрудников на корпоративный пикник в эту субботу.",
                    "author_name": "Администрация",
                    "category": "event",
                    "is_published": True,
                    "published_at": datetime.now(),
                    "author_id": admin_user.id if admin_user else 1
                },
                {
                    "title": "Важное объявление",
                    "content": "В связи с проведением ремонтных работ доступ к офису будет ограничен.",
                    "author_name": "Администрация",
                    "category": "announcement",
                    "is_published": True,
                    "published_at": datetime.now(),
                    "author_id": admin_user.id if admin_user else 1
                }
            ]

            for news_item_data in news_data:
                news_item = News(**news_item_data)
                db_session.add(news_item)

        # 7. Создаем события всех типов (если их нет)
        print("📅 Создание событий...")
        events_result = await db_session.execute(select(Event))
        existing_events = events_result.scalars().all()

        if not existing_events:
            events_data = [
                {
                    "title": "Планерка отдела разработки",
                    "description": "Еженедельная планерка отдела разработки",
                    "event_type": "meeting",
                    "start_date": datetime.now() + timedelta(days=1),
                    "end_date": datetime.now() + timedelta(days=1, hours=1),
                    "location": "Конференц-зал №1",
                    "organizer_id": admin_user.id if admin_user else 1,
                    "is_public": False
                },
                {
                    "title": "Техническое совещание",
                    "description": "Обсуждение технических вопросов бурения",
                    "event_type": "conference",
                    "start_date": datetime.now() + timedelta(days=2),
                    "end_date": datetime.now() + timedelta(days=2, hours=2),
                    "location": "Конференц-зал №2",
                    "organizer_id": test_user.id if test_user else 1,
                    "is_public": True
                },
                {
                    "title": "Тренинг по безопасности",
                    "description": "Обязательный тренинг по технике безопасности",
                    "event_type": "training",
                    "start_date": datetime.now() + timedelta(days=3),
                    "end_date": datetime.now() + timedelta(days=3, hours=3),
                    "location": "Актовая зала",
                    "organizer_id": admin_user.id if admin_user else 1,
                    "is_public": True
                }
            ]

            events = []
            for event_data in events_data:
                event = Event(**event_data)
                db_session.add(event)
                events.append(event)

            await db_session.flush()

            # Добавляем участников к событиям
            event_participants_data = [
                {"event_id": events[0].id, "user_id": admin_user.id if admin_user else 1},
                {"event_id": events[0].id, "user_id": test_user.id if test_user else 1},
                {"event_id": events[1].id, "user_id": admin_user.id if admin_user else 1},
                {"event_id": events[2].id, "user_id": admin_user.id if admin_user else 1},
                {"event_id": events[2].id, "user_id": test_user.id if test_user else 1}
            ]

            for participant_data in event_participants_data:
                participant = EventParticipant(**participant_data)
                db_session.add(participant)

        # 8. Создаем чат ботов (если их нет)
        print("🤖 Создание чат ботов...")
        bots_result = await db_session.execute(select(ChatBot))
        existing_bots = bots_result.scalars().all()

        if not existing_bots:
            bots_data = [
                {
                    "name": "Техническая поддержка",
                    "description": "Бот для технической поддержки",
                    "is_active": True,
                    "created_by": admin_user.id if admin_user else 1
                },
                {
                    "name": "Новости компании",
                    "description": "Бот для новостей и объявлений",
                    "is_active": True,
                    "created_by": admin_user.id if admin_user else 1
                }
            ]

            bots = []
            for bot_data in bots_data:
                bot = ChatBot(**bot_data)
                db_session.add(bot)
                bots.append(bot)
        else:
            bots = existing_bots

        # 9. Создаем чат комнаты (если их нет)
        print("💬 Создание чат комнат...")
        rooms_result = await db_session.execute(select(ChatRoom))
        existing_rooms = rooms_result.scalars().all()

        if not existing_rooms:
            rooms_data = [
                {
                    "name": "Общий чат",
                    "description": "Основной чат для всех сотрудников",
                    "is_private": False,
                    "created_by": admin_user.id if admin_user else 1
                },
                {
                    "name": "Техническая поддержка",
                    "description": "Чат для технических вопросов",
                    "is_private": False,
                    "created_by": admin_user.id if admin_user else 1
                },
                {
                    "name": "Отдел разработки",
                    "description": "Чат отдела разработки",
                    "is_private": True,
                    "created_by": admin_user.id if admin_user else 1
                }
            ]

            rooms = []
            for room_data in rooms_data:
                room = ChatRoom(**room_data)
                db_session.add(room)
                rooms.append(room)

            await db_session.flush()

            # 10. Добавляем участников в чаты
            print("👥 Добавление участников в чаты...")
            participants_data = [
                {"room_id": rooms[0].id, "user_id": admin_user.id if admin_user else 1, "is_admin": True},
                {"room_id": rooms[0].id, "user_id": test_user.id if test_user else 1, "is_admin": False},
                {"room_id": rooms[1].id, "bot_id": bots[0].id, "is_admin": False},
                {"room_id": rooms[2].id, "user_id": admin_user.id if admin_user else 1, "is_admin": True}
            ]

            for participant_data in participants_data:
                participant = ChatParticipant(**participant_data)
                db_session.add(participant)

            # 11. Создаем сообщения в чатах
            print("💬 Создание сообщений в чатах...")
            messages_data = [
                {
                    "room_id": rooms[0].id,
                    "sender_id": admin_user.id if admin_user else 1,
                    "content": "Добро пожаловать в общий чат!"
                },
                {
                    "room_id": rooms[0].id,
                    "sender_id": test_user.id if test_user else 1,
                    "content": "Спасибо! Рад присоединиться."
                },
                {
                    "room_id": rooms[1].id,
                    "bot_id": bots[0].id,
                    "content": "Здравствуйте! Я бот технической поддержки. Чем могу помочь?"
                },
                {
                    "room_id": rooms[2].id,
                    "sender_id": admin_user.id if admin_user else 1,
                    "content": "Приветствую команду разработки!"
                }
            ]

            for message_data in messages_data:
                message = ChatMessage(**message_data)
                db_session.add(message)

        # 12. Создаем папки чатов (если их нет)
        print("📁 Создание папок чатов...")
        folders_result = await db_session.execute(select(ChatFolder))
        existing_folders = folders_result.scalars().all()

        if not existing_folders:
            folders_data = [
                {
                    "name": "Рабочие чаты",
                    "description": "Папка для рабочих обсуждений",
                    "user_id": admin_user.id if admin_user else 1,
                    "created_by": admin_user.id if admin_user else 1
                },
                {
                    "name": "Техническая поддержка",
                    "description": "Папка для технических вопросов",
                    "user_id": test_user.id if test_user else 1,
                    "created_by": test_user.id if test_user else 1
                }
            ]

            for folder_data in folders_data:
                folder = ChatFolder(**folder_data)
                db_session.add(folder)

        # Сохраняем все изменения
        await db_session.commit()

        # Подсчет созданных элементов
        news_count = len(news_data) if 'news_data' in locals() else 0
        events_count = len(events) if 'events' in locals() else 0
        rooms_count = len(rooms) if 'rooms' in locals() else 0
        messages_count = len(messages_data) if 'messages_data' in locals() else 0
        folders_count = len(folders_data) if 'folders_data' in locals() else 0

        print("✅ ДАННЫЕ УСПЕШНО ИНИЦИАЛИЗИРОВАНЫ!")
        print("📊 СОЗДАНО:")
        print(f"   • {len(departments)} отделов")
        print(f"   • {len([admin_user, test_user])} пользователей")
        print(f"   • {len(employees)} сотрудников")
        print(f"   • {len(nomenclature)} номенклатур ВЭД")
        print(f"   • {news_count} новостей")
        print(f"   • {events_count} событий")
        print(f"   • {len(bots)} чат ботов")
        print(f"   • {rooms_count} чат комнат")
        print(f"   • {messages_count} сообщений")
        print(f"   • {folders_count} папок чатов")
        # 8. Создаем тестовых заказчиков (компании)
        print("🏢 Создание тестовых заказчиков...")
        customer_result = await db_session.execute(select(CustomerProfile))
        existing_customers = customer_result.scalars().all()

        if not existing_customers:
            # Создаем пользователей-заказчиков
            customer_users_data = [
                {
                    "username": "customer1",
                    "email": "customer1@test.com",
                    "first_name": "Иван",
                    "last_name": "Иванов",
                    "middle_name": "Иванович",
                    "phone": "+7(999)123-45-67",
                    "company_name": "ООО РемонтСервис",
                    "contact_person": "Иван Иванович Иванов",
                    "company_phone": "+7(999)123-45-67",
                    "company_email": "info@remontservice.ru",
                    "address": "г. Москва, ул. Ленина, 10"
                },
                {
                    "username": "customer2",
                    "email": "customer2@test.com",
                    "first_name": "Петр",
                    "last_name": "Петров",
                    "middle_name": "Петрович",
                    "phone": "+7(999)987-65-43",
                    "company_name": "ИП Петров П.П.",
                    "contact_person": "Петр Петрович Петров",
                    "company_phone": "+7(999)987-65-43",
                    "company_email": "petrov@individual.ru",
                    "address": "г. Санкт-Петербург, ул. Невский, 25"
                }
            ]

            customer_users = []
            customer_profiles = []

            for user_data in customer_users_data:
                # Создаем пользователя
                customer_user = User(
                    username=user_data["username"],
                    email=user_data["email"],
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    middle_name=user_data["middle_name"],
                    hashed_password=get_password_hash("customer123"),
                    role=UserRole.CUSTOMER,
                    phone=user_data["phone"],
                    is_active=True
                )
                db_session.add(customer_user)
                customer_users.append(customer_user)
                users_count += 1

                # Создаем профиль заказчика
                customer_profile = CustomerProfile(
                    user_id=customer_user.id,  # Будет установлено после flush
                    company_name=user_data["company_name"],
                    contact_person=user_data["contact_person"],
                    phone=user_data["company_phone"],
                    email=user_data["company_email"],
                    address=user_data["address"]
                )
                customer_profiles.append(customer_profile)

            await db_session.flush()

            # Устанавливаем правильные user_id для профилей
            for i, profile in enumerate(customer_profiles):
                profile.user_id = customer_users[i].id
                db_session.add(profile)

            await db_session.flush()
            customers_count = len(customer_users)
        else:
            customers_count = len(existing_customers)

        # 9. Создаем тестовых исполнителей
        print("👷 Создание тестовых исполнителей...")
        contractor_result = await db_session.execute(select(ContractorProfile))
        existing_contractors = contractor_result.scalars().all()

        if not existing_contractors:
            # Создаем пользователей-исполнителей
            contractor_users_data = [
                {
                    "username": "contractor1",
                    "email": "contractor1@test.com",
                    "first_name": "Алексей",
                    "last_name": "Сидоров",
                    "middle_name": "Владимирович",
                    "phone": "+7(999)111-22-33",
                    "specialization": "Электрик",
                    "experience_years": 5,
                    "skills": "Ремонт бытовой техники, электромонтажные работы"
                },
                {
                    "username": "contractor2",
                    "email": "contractor2@test.com",
                    "first_name": "Мария",
                    "last_name": "Кузнецова",
                    "middle_name": "Сергеевна",
                    "phone": "+7(999)444-55-66",
                    "specialization": "Сантехник",
                    "experience_years": 7,
                    "skills": "Установка сантехники, ремонт трубопроводов"
                }
            ]

            contractor_users = []
            contractor_profiles = []

            for user_data in contractor_users_data:
                # Создаем пользователя
                contractor_user = User(
                    username=user_data["username"],
                    email=user_data["email"],
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    middle_name=user_data["middle_name"],
                    hashed_password=get_password_hash("contractor123"),
                    role=UserRole.CONTRACTOR,
                    phone=user_data["phone"],
                    is_active=True
                )
                db_session.add(contractor_user)
                contractor_users.append(contractor_user)
                users_count += 1

                # Создаем профиль исполнителя
                # Формируем профессиональную информацию
                professional_info = []
                if user_data.get("specialization") or user_data.get("experience_years") or user_data.get("skills"):
                    professional_info_item = {}
                    if user_data.get("specialization"):
                        professional_info_item["specialization"] = user_data["specialization"]
                    if user_data.get("experience_years"):
                        professional_info_item["experience_years"] = user_data["experience_years"]
                    if user_data.get("skills"):
                        professional_info_item["skills"] = user_data["skills"]
                    if professional_info_item:
                        professional_info.append(professional_info_item)

                contractor_profile = ContractorProfile(
                    user_id=contractor_user.id,  # Будет установлено после flush
                    last_name=user_data["last_name"],
                    first_name=user_data["first_name"],
                    patronymic=user_data["middle_name"],
                    phone=user_data["phone"],
                    email=user_data["email"],
                    professional_info=professional_info,
                    general_description=f"Исполнитель: {user_data['first_name']} {user_data['last_name']}"
                )
                contractor_profiles.append(contractor_profile)

            await db_session.flush()

            # Устанавливаем правильные user_id для профилей
            for i, profile in enumerate(contractor_profiles):
                profile.user_id = contractor_users[i].id
                db_session.add(profile)

            await db_session.flush()
            contractors_count = len(contractor_users)
        else:
            contractors_count = len(existing_contractors)

        # 10. Создаем сервисного инженера
        print("🔧 Создание сервисного инженера...")
        service_engineer_result = await db_session.execute(
            select(User).where(User.role == UserRole.SERVICE_ENGINEER)
        )
        existing_service_engineers = service_engineer_result.scalars().all()

        if not existing_service_engineers:
            service_engineer = User(
                username="service_engineer",
                email="engineer@almazgeobur.ru",
                first_name="Анна",
                last_name="Сервисова",
                middle_name="Игоревна",
                hashed_password=get_password_hash("engineer123"),
                role=UserRole.SERVICE_ENGINEER,
                phone="+7(999)777-88-99",
                is_active=True,
                position="Сервисный инженер"
            )
            db_session.add(service_engineer)
            users_count += 1
            await db_session.flush()
            service_engineers_count = 1
        else:
            service_engineers_count = len(existing_service_engineers)

        # 11. Создаем тестовые заявки на ремонт
        print("📋 Создание тестовых заявок...")
        requests_result = await db_session.execute(select(RepairRequest))
        existing_requests = requests_result.scalars().all()

        if not existing_requests:
            # Получаем профили заказчиков
            customer_profiles_result = await db_session.execute(select(CustomerProfile).limit(2))
            customer_profiles = customer_profiles_result.scalars().all()

            if customer_profiles:
                repair_requests_data = [
                    {
                        "title": "Ремонт электрики в офисе",
                        "description": "Необходимо заменить розетки и выключатели в кабинете директора. Общая площадь - 25 кв.м.",
                        "urgency": "средне",
                        "address": "г. Москва, ул. Тверская, 15, офис 301",
                        "city": "Москва",
                        "region": "Московская область",
                        "customer_profile": customer_profiles[0]
                    },
                    {
                        "title": "Установка сантехники в квартире",
                        "description": "Требуется установка унитаза, раковины и смесителя в санузле. Замена труб водоснабжения.",
                        "urgency": "высокая",
                        "address": "г. Санкт-Петербург, пр. Невский, 45, кв. 12",
                        "city": "Санкт-Петербург",
                        "region": "Ленинградская область",
                        "customer_profile": customer_profiles[1] if len(customer_profiles) > 1 else customer_profiles[0]
                    }
                ]

                repair_requests = []
                for request_data in repair_requests_data:
                    repair_request = RepairRequest(
                        customer_id=request_data["customer_profile"].id,
                        title=request_data["title"],
                        description=request_data["description"],
                        urgency=request_data["urgency"],
                        address=request_data["address"],
                        city=request_data["city"],
                        region=request_data["region"],
                        status=RequestStatus.NEW
                    )
                    db_session.add(repair_request)
                    repair_requests.append(repair_request)

                await db_session.flush()
                requests_count = len(repair_requests)
            else:
                requests_count = 0
        else:
            requests_count = len(existing_requests)

        # Создание тестового Telegram бота
        print("🤖 Проверка/создание Telegram бота...")
        # Проверяем, существует ли уже бот с таким токеном
        existing_bot_result = await db_session.execute(
            select(TelegramBot).where(TelegramBot.token == "123456789:AAFakeTokenForTestingPurposes123456789")
        )
        existing_bot = existing_bot_result.scalars().first()

        if existing_bot:
            print("🤖 Telegram бот уже существует, пропускаем создание")
            telegram_bot = existing_bot
        else:
            print("🤖 Создание нового Telegram бота...")
            telegram_bot = TelegramBot(
                name="Repair Bot",
                token="123456789:AAFakeTokenForTestingPurposes123456789",  # Тестовый токен
                is_active=True,
                webhook_url=None
            )
            db_session.add(telegram_bot)

        # Создание связи contractor1 с Telegram
        contractor_result = await db_session.execute(
            select(User).where(User.username == "contractor1")
        )
        contractor_user = contractor_result.scalars().first()

        if contractor_user:
            # Проверяем, существует ли уже Telegram пользователь
            existing_telegram_user_result = await db_session.execute(
                select(TelegramUser).where(TelegramUser.telegram_id == 123456789)
            )
            existing_telegram_user = existing_telegram_user_result.scalars().first()

            if not existing_telegram_user:
                telegram_user = TelegramUser(
                    user_id=contractor_user.id,
                    telegram_id=123456789,  # Тестовый Telegram ID
                    username="contractor_test",
                    first_name="Исполнитель",
                    last_name="Тестовый",
                    is_bot_user=False
                )
                db_session.add(telegram_user)
            else:
                print("🤖 Telegram пользователь уже существует, пропускаем создание")

        await db_session.commit()
        print("✅ Telegram бот создан")

        print("")
        print("🎉 ДОСТУП К СИСТЕМЕ:")
        print("   Admin: admin / admin123")
        print("   Test:  testuser / test123")
        print("   Заказчик: customer1 / customer123")
        print("   Исполнитель: contractor1 / contractor123")
        print("   Сервисный инженер: service_engineer / engineer123")
        print("")
        print("📊 СТАТИСТИКА СОЗДАННЫХ ДАННЫХ:")
        print(f"   • {len(departments)} отделов")
        print(f"   • {users_count} пользователей")
        print(f"   • {employees_count} сотрудников компании")
        print(f"   • {nomenclatures_count} позиций номенклатуры")
        print(f"   • {passports_count} ВЭД паспортов")
        print(f"   • {news_count} новостей")
        print(f"   • {events_count} событий")
        print(f"   • {len(bots)} чат ботов")
        print(f"   • {rooms_count} чат комнат")
        print(f"   • {messages_count} сообщений")
        print(f"   • {folders_count} папок чатов")
        print(f"   • {customers_count} заказчиков")
        print(f"   • {contractors_count} исполнителей")
        print(f"   • {service_engineers_count} сервисных инженеров")
        print(f"   • {requests_count} заявок на ремонт")
        print("   • 1 Telegram бот")
        print("   • 1 Telegram пользователь")

    except Exception as e:
        print(f"❌ Ошибка инициализации данных: {e}")
        import traceback
        traceback.print_exc()
        await db_session.rollback()

async def init_data_if_needed():
    """
    Инициализирует данные только если база данных пустая
    """
    from database import async_session

    async with await async_session() as db:
        try:
            # Проверяем, есть ли уже данные
            result = await db.execute(select(User).where(User.username == "admin"))
            admin_exists = result.scalar_one_or_none()

            if not admin_exists:
                print("📝 База данных пуста, инициализируем данные...")
                await init_database_data(db)
            else:
                print("✅ Данные уже инициализированы")

        except Exception as e:
            print(f"❌ Ошибка проверки инициализации: {e}")
            import traceback
            traceback.print_exc()
