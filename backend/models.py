from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    employee = "employee"


class NewsCategory(str, enum.Enum):
    general = "general"
    technical = "technical"
    event = "event"


class EventType(str, enum.Enum):
    event = "event"
    measurement = "measurement"
    installation = "installation"


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    head_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Руководитель отдела
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    head = relationship("User", foreign_keys=[head_id])
    employees = relationship("User", back_populates="department_rel", foreign_keys="User.department_id")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False)  # Имя
    last_name = Column(String, nullable=False)   # Фамилия
    middle_name = Column(String, nullable=True)  # Отчество
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.employee)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String, nullable=True)  # URL аватара пользователя
    phone = Column(String, nullable=True)  # Телефон
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)  # ID отдела
    position = Column(String, nullable=True)  # Должность
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    events = relationship("Event", back_populates="creator", foreign_keys="Event.creator_id")
    department_rel = relationship("Department", back_populates="employees", foreign_keys=[department_id])

    @property
    def full_name(self):
        """Полное имя пользователя"""
        if self.middle_name:
            return f"{self.last_name} {self.first_name} {self.middle_name}"
        return f"{self.last_name} {self.first_name}"

    @staticmethod
    def generate_username(first_name: str, last_name: str, middle_name: str = None, prefix: str = "АГБ"):
        """Генерация имени пользователя на основе ФИО"""
        import re
        
        # Транслитерация с русского на английский
        translit_map = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
            'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        }
        
        def transliterate(text):
            text = text.lower()
            result = ""
            for char in text:
                result += translit_map.get(char, char)
            return result
        
        # Первая буква имени
        first_letter = transliterate(first_name[0]) if first_name else ""
        # Первая буква отчества (если есть)
        middle_letter = transliterate(middle_name[0]) if middle_name else ""
        # Фамилия целиком
        last_name_translit = transliterate(last_name)
        
        # Формируем username
        username = f"{first_letter}{middle_letter}{last_name_translit}{prefix}"
        return username.lower()


class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(Enum(NewsCategory), default=NewsCategory.general)
    author_id = Column(Integer, nullable=False)  # Ссылка на пользователя
    author_name = Column(String, nullable=False)  # Имя автора для быстрого доступа
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    session_token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_datetime = Column(DateTime(timezone=True), nullable=False)
    end_datetime = Column(DateTime(timezone=True), nullable=False)
    event_type = Column(Enum(EventType), default=EventType.event)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    creator = relationship("User", back_populates="events", foreign_keys=[creator_id])