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
    VEDNomenclature, VedPassport
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
                    "code_1c": "KRN-001", "name": "Коронка алмазная HQ",
                    "article": "HQ-001", "matrix": "HQ", "drilling_depth": "05-07",
                    "height": "15 мм", "thread": "W", "product_type": "коронка"
                },
                {
                    "code_1c": "KRN-002", "name": "Коронка алмазная PQ",
                    "article": "PQ-001", "matrix": "PQ", "drilling_depth": "03-05",
                    "height": "12 мм", "thread": "WT", "product_type": "коронка"
                },
                {
                    "code_1c": "EXT-001", "name": "Расширитель HQ",
                    "article": "HQ-EXT-001", "matrix": "HQ", "drilling_depth": "05-07",
                    "height": "18 мм", "thread": "W", "product_type": "расширитель"
                },
                {
                    "code_1c": "BSH-001", "name": "Башмак HQ",
                    "article": "HQ-BSH-001", "matrix": "HQ", "drilling_depth": "05-07",
                    "height": "20 мм", "thread": "W", "product_type": "башмак"
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
        print("")
        print("🔐 ДОСТУП К СИСТЕМЕ:")
        print("   Admin: admin / admin123")
        print("   Test:  testuser / test123")

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
