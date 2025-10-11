"""
Создание пользователей всех типов
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import User, Department, UserRole
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_department_if_not_exists(db, name: str, description: str = ""):
    """Создает отдел если его не существует"""
    dept = db.query(Department).filter(Department.name == name).first()
    if not dept:
        dept = Department(name=name, description=description)
        db.add(dept)
        db.commit()
        db.refresh(dept)
    return dept

def create_users():
    db = SessionLocal()
    try:
        # Создаем отделы
        departments = {
            "admin": create_department_if_not_exists(db, "Администрация", "Административный отдел"),
            "manager": create_department_if_not_exists(db, "Управление", "Отдел управления"),
            "employee": create_department_if_not_exists(db, "Производство", "Производственный отдел"),
            "user": create_department_if_not_exists(db, "Общий", "Общий отдел"),
            "ved_passport": create_department_if_not_exists(db, "ВЭД", "Отдел внешнеэкономической деятельности")
        }
        
        # Пользователи для создания
        users_to_create = [
            # ADMIN (2 пользователя)
            {
                "username": "admin1",
                "email": "admin1@almazgeobur.ru",
                "first_name": "Иван",
                "last_name": "Админов",
                "middle_name": "Петрович",
                "role": UserRole.ADMIN,
                "department": "admin",
                "position": "Главный администратор"
            },
            {
                "username": "admin2",
                "email": "admin2@almazgeobur.ru",
                "first_name": "Мария",
                "last_name": "Системова",
                "middle_name": "Ивановна",
                "role": UserRole.ADMIN,
                "department": "admin",
                "position": "Системный администратор"
            },
            
            # MANAGER (2 пользователя)
            {
                "username": "manager1",
                "email": "manager1@almazgeobur.ru",
                "first_name": "Александр",
                "last_name": "Менеджеров",
                "middle_name": "Сергеевич",
                "role": UserRole.MANAGER,
                "department": "manager",
                "position": "Руководитель отдела"
            },
            {
                "username": "manager2",
                "email": "manager2@almazgeobur.ru",
                "first_name": "Елена",
                "last_name": "Управленцева",
                "middle_name": "Александровна",
                "role": UserRole.MANAGER,
                "department": "manager",
                "position": "Заместитель руководителя"
            },
            
            # EMPLOYEE (2 пользователя)
            {
                "username": "employee1",
                "email": "employee1@almazgeobur.ru",
                "first_name": "Дмитрий",
                "last_name": "Работников",
                "middle_name": "Николаевич",
                "role": UserRole.EMPLOYEE,
                "department": "employee",
                "position": "Инженер"
            },
            {
                "username": "employee2",
                "email": "employee2@almazgeobur.ru",
                "first_name": "Ольга",
                "last_name": "Сотрудникова",
                "middle_name": "Дмитриевна",
                "role": UserRole.EMPLOYEE,
                "department": "employee",
                "position": "Техник"
            },
            
            # USER (2 пользователя)
            {
                "username": "user1",
                "email": "user1@almazgeobur.ru",
                "first_name": "Сергей",
                "last_name": "Пользователев",
                "middle_name": "Владимирович",
                "role": UserRole.USER,
                "department": "user",
                "position": "Специалист"
            },
            {
                "username": "user2",
                "email": "user2@almazgeobur.ru",
                "first_name": "Анна",
                "last_name": "Клиентова",
                "middle_name": "Сергеевна",
                "role": UserRole.USER,
                "department": "user",
                "position": "Консультант"
            },
            
            # VED_PASSPORT (2 пользователя)
            {
                "username": "ved1",
                "email": "ved1@almazgeobur.ru",
                "first_name": "Владимир",
                "last_name": "Вэдов",
                "middle_name": "Андреевич",
                "role": UserRole.VED_PASSPORT,
                "department": "ved_passport",
                "position": "Специалист по ВЭД"
            },
            {
                "username": "ved2",
                "email": "ved2@almazgeobur.ru",
                "first_name": "Татьяна",
                "last_name": "Паспортова",
                "middle_name": "Владимировна",
                "role": UserRole.VED_PASSPORT,
                "department": "ved_passport",
                "position": "Эксперт по ВЭД"
            }
        ]
        
        created_count = 0
        skipped_count = 0
        
        for user_data in users_to_create:
            # Проверяем, существует ли пользователь
            existing_user = db.query(User).filter(User.username == user_data["username"]).first()
            if existing_user:
                print(f"⏭️  Пользователь {user_data['username']} уже существует, пропускаем")
                skipped_count += 1
                continue
            
            # Создаем пользователя
            user = User(
                username=user_data["username"],
                email=user_data["email"],
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                middle_name=user_data["middle_name"],
                hashed_password=get_password_hash("password123"),
                role=user_data["role"],
                department_id=departments[user_data["department"]].id,
                position=user_data["position"],
                is_active=True,
                is_password_changed=False
            )
            
            db.add(user)
            created_count += 1
            print(f"✅ Создан пользователь: {user_data['username']} ({user_data['role']}) - {user_data['first_name']} {user_data['last_name']}")
        
        db.commit()
        
        print(f"\n📊 Итого:")
        print(f"   Создано пользователей: {created_count}")
        print(f"   Пропущено (уже существуют): {skipped_count}")
        print(f"\n🔑 Пароль для всех новых пользователей: password123")
        print(f"   (Рекомендуется изменить при первом входе)")
        
        # Выводим список всех пользователей по ролям
        print(f"\n👥 Список пользователей по ролям:")
        for role in UserRole:
            users = db.query(User).filter(User.role == role).all()
            print(f"\n   {role.value.upper()}:")
            for user in users:
                print(f"     - {user.username}: {user.first_name} {user.last_name} ({user.email})")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_users()
