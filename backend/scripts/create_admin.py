"""
Создание администратора и тестовых данных
"""
import sys
sys.path.append('..')

from database import SessionLocal
from models import User, Department
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_admin():
    db = SessionLocal()
    try:
        # Проверяем, есть ли уже админ
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print("✅ Администратор уже существует")
            return
        
        # Создаем отдел
        dept = db.query(Department).filter(Department.name == "Администрация").first()
        if not dept:
            dept = Department(name="Администрация", description="Административный отдел")
            db.add(dept)
            db.commit()
            db.refresh(dept)
        
        # Создаем администратора
        admin = User(
            username="admin",
            email="admin@almazgeobur.ru",
            first_name="Администратор",
            last_name="Системы",
            middle_name="",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            department_id=dept.id,
            position="Системный администратор",
            is_active=True
        )
        db.add(admin)
        db.commit()
        print("✅ Администратор создан успешно!")
        print("   Логин: admin")
        print("   Пароль: admin123")
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()

