#!/usr/bin/env python3
"""
Скрипт для создания пользователя admin
"""

import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

# Настройки базы данных
DATABASE_URL = "postgresql://agb_user:secure_password_2024@localhost:15432/agb_prod"

# Создаем движок базы данных
engine = create_engine(DATABASE_URL)

# Создаем сессию
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Контекст для хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Хеширует пароль"""
    return pwd_context.hash(password)

def create_admin_user():
    """Создает пользователя admin"""
    try:
        # Импортируем модель User
        sys.path.append('.')
        sys.path.append('./backend')
        from models import User
        
        db = SessionLocal()
        
        # Проверяем, есть ли уже пользователь admin
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            print("✅ Пользователь admin уже существует")
            db.close()
            return
        
        # Создаем нового пользователя admin
        admin_user = User(
            username="admin",
            email="admin@example.com",
            hashed_password=hash_password("admin123"),
            role="admin",
            is_active=True,
            full_name="Администратор системы"
        )
        
        db.add(admin_user)
        db.commit()
        db.close()
        
        print("✅ Пользователь admin успешно создан!")
        print("   Логин: admin")
        print("   Пароль: admin123")
        
    except Exception as e:
        print(f"❌ Ошибка при создании пользователя admin: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_admin_user()
