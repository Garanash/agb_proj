import asyncio
import asyncpg
from sqlalchemy.ext.asyncio import AsyncSession
from database import engine, get_db
from models import User, News, UserRole, NewsCategory, Department
from passlib.context import CryptContext
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_test_data():
    """Создание тестовых данных"""
    async with engine.begin() as conn:
        # Получаем сессию
        async_session = AsyncSession(engine)
        
        try:
            # Создаем тестовых пользователей
            admin_user = User(
                username="asistemnyagb",
                email="admin@almazgeobur.kz",
                first_name="Александр",
                last_name="Системный",
                middle_name="Администраторович",
                hashed_password=pwd_context.hash("admin123"),
                role=UserRole.admin,
                is_active=True
            )
            
            manager_user = User(
                username="miproektovagb",
                email="manager@almazgeobur.kz", 
                first_name="Михаил",
                last_name="Проектов",
                middle_name="Иванович",
                hashed_password=pwd_context.hash("manager123"),
                role=UserRole.manager,
                is_active=True
            )
            
            employee_user = User(
                username="skompaniiagb",
                email="employee@almazgeobur.kz",
                first_name="Сергей",
                last_name="Компании",
                middle_name="Константинович",
                hashed_password=pwd_context.hash("employee123"),
                role=UserRole.employee,
                is_active=True
            )
            
            async_session.add_all([admin_user, manager_user, employee_user])
            await async_session.commit()
            
            # Обновляем объекты чтобы получить ID
            await async_session.refresh(admin_user)
            await async_session.refresh(manager_user)
            await async_session.refresh(employee_user)
            
            # Создаем отделы
            departments = [
                Department(
                    name="Администрация",
                    description="Административный отдел компании",
                    head_id=admin_user.id
                ),
                Department(
                    name="Геологоразведка",
                    description="Отдел геологоразведочных работ",
                    head_id=manager_user.id
                ),
                Department(
                    name="Буровые работы",
                    description="Отдел буровых работ"
                ),
                Department(
                    name="Техническое обслуживание",
                    description="Отдел технического обслуживания оборудования"
                ),
                Department(
                    name="Бухгалтерия",
                    description="Финансово-экономический отдел"
                )
            ]
            
            async_session.add_all(departments)
            await async_session.commit()
            
            # Обновляем отделы для получения ID
            for dept in departments:
                await async_session.refresh(dept)
            
            # Назначаем сотрудников в отделы
            admin_user.department_id = departments[0].id  # Администрация
            manager_user.department_id = departments[1].id  # Геологоразведка
            employee_user.department_id = departments[2].id  # Буровые работы
            
            await async_session.commit()
            
            # Создаем тестовые новости
            news_items = [
                News(
                    title="Добро пожаловать в Felix!",
                    content="Представляем новую корпоративную платформу Felix для управления проектами и коммуникации в компании Алмазгеобур. Платформа включает календарь событий, систему новостей и многое другое.",
                    category=NewsCategory.general,
                    author_id=admin_user.id,
                    author_name=admin_user.full_name,
                    is_published=True,
                    created_at=datetime.utcnow()
                ),
                News(
                    title="Новая технология бурения",
                    content="В компанию внедрена инновационная технология алмазного бурения, которая позволит увеличить эффективность работ на 30%. Обучение персонала начнется на следующей неделе.",
                    category=NewsCategory.technical,
                    author_id=manager_user.id,
                    author_name=manager_user.full_name,
                    is_published=True,
                    created_at=datetime.utcnow() - timedelta(days=1)
                ),
                News(
                    title="Корпоративное мероприятие",
                    content="Приглашаем всех сотрудников на корпоративное мероприятие, посвященное Дню геолога. Мероприятие состоится 15 декабря в 18:00 в конференц-зале.",
                    category=NewsCategory.event,
                    author_id=admin_user.id,
                    author_name=admin_user.full_name,
                    is_published=True,
                    created_at=datetime.utcnow() - timedelta(days=2)
                ),
                News(
                    title="Завершен проект 'Северное месторождение'",
                    content="Успешно завершены геологоразведочные работы на Северном месторождении. По результатам работ подтверждены запасы руды категории C1 в объеме 2.5 млн тонн.",
                    category=NewsCategory.projects,
                    author_id=manager_user.id,
                    author_name=manager_user.full_name,
                    is_published=True,
                    created_at=datetime.utcnow() - timedelta(days=3)
                ),
                News(
                    title="Корпоративное мероприятие",
                    content="15 декабря в 18:00 состоится корпоративное мероприятие, посвященное Дню геолога. Место проведения - конференц-зал главного офиса.",
                    category=NewsCategory.general,
                    author_id=admin_user.id,
                    author_name=admin_user.full_name,
                    is_published=True,
                    created_at=datetime.utcnow() - timedelta(days=4)
                )
            ]
            
            async_session.add_all(news_items)
            await async_session.commit()
            
            print("✅ Тестовые данные успешно созданы!")
            print("\n🔑 Данные для входа:")
            print("Администратор: admin / admin123")
            print("Менеджер: manager / manager123") 
            print("Сотрудник: employee / employee123")
            
        except Exception as e:
            print(f"❌ Ошибка при создании тестовых данных: {e}")
            await async_session.rollback()
        finally:
            await async_session.close()

if __name__ == "__main__":
    asyncio.run(create_test_data())
