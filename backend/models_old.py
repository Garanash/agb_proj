from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func, select
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from database import Base
import enum
import datetime
import re

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"
    MANAGER = "manager"
    EMPLOYEE = "employee"
    VED_PASSPORT = "ved_passport"

class NewsCategory(str, enum.Enum):
    GENERAL = "general"
    TECHNICAL = "technical"
    EVENT = "event"
    ANNOUNCEMENT = "announcement"

class Permission(str, enum.Enum):
    READ = "read"
    WRITE = "write"
    DELETE = "delete"
    ADMIN = "admin"

class User(Base):
    """Пользователи системы"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    middle_name = Column(String, nullable=True)
    role = Column(String, default=UserRole.EMPLOYEE)
    is_active = Column(Boolean, default=True)
    avatar_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    position = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    department = relationship("Department", lazy="selectin")

class Department(Base):
    """Подразделения компании"""
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    head_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    head = relationship("User", foreign_keys=[head_id], lazy="selectin")
    employees = relationship("User", back_populates="department", lazy="selectin")

class CompanyEmployee(Base):
    """Сотрудники компании"""
    __tablename__ = "company_employees"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    department = relationship("Department", lazy="selectin")

class EventType(str, enum.Enum):
    MEETING = "meeting"
    CONFERENCE = "conference"
    TRAINING = "training"
    BRIEFING = "briefing"
    CALL = "call"
    OTHER = "other"

class Event(Base):
    """События и мероприятия"""
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    event_type = Column(String, nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    location = Column(String, nullable=True)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    organizer = relationship("User", foreign_keys=[organizer_id], lazy="selectin")

class EventParticipant(Base):
    """Участники событий"""
    __tablename__ = "event_participants"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")  # pending, confirmed, declined
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    event = relationship("Event", lazy="selectin")
    user = relationship("User", lazy="selectin")

class News(Base):
    """Новости и объявления"""
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_published = Column(Boolean, default=True)
    published_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    author = relationship("User", foreign_keys=[author_id], lazy="selectin")

class Team(Base):
    """Команды проекта"""
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    leader_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    leader = relationship("User", foreign_keys=[leader_id], lazy="selectin")

class ChatRoom(Base):
    """Чат-комнаты"""
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_public = Column(Boolean, default=True)
    folder_id = Column(Integer, ForeignKey("chat_folders.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")
    folder = relationship("ChatFolder", lazy="selectin")

class ChatFolder(Base):
    """Папки для организации чат-комнат"""
    __tablename__ = "chat_folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_user_specific = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")

class ChatMessage(Base):
    """Сообщения в чате"""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    message_type = Column(String, default="text")  # text, file, image
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    room = relationship("ChatRoom", lazy="selectin")
    sender = relationship("User", foreign_keys=[sender_id], lazy="selectin")

class ChatParticipant(Base):
    """Участники чат-комнат"""
    __tablename__ = "chat_participants"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    last_read_at = Column(DateTime(timezone=True), nullable=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    room = relationship("ChatRoom", lazy="selectin")
    user = relationship("User", lazy="selectin")

class ChatBot(Base):
    """Чат-боты"""
    __tablename__ = "chat_bots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    model_id = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")

class VEDNomenclature(Base):
    """Номенклатура для паспортов ВЭД"""
    __tablename__ = "ved_nomenclature"

    id = Column(Integer, primary_key=True, index=True)
    code_1c = Column(String, unique=True, nullable=False, index=True)  # Код 1С
    name = Column(String, nullable=False)  # Наименование
    article = Column(String, nullable=False)  # Артикул
    matrix = Column(String, nullable=False)  # Матрица (NQ, HQ, PQ, HQ3, NW, HW, HWT, PWT)
    drilling_depth = Column(String, nullable=True)  # Глубина бурения (03-05, 05-07, etc.)
    height = Column(String, nullable=True)  # Высота (12 мм, 15 мм, etc.)
    thread = Column(String, nullable=True)  # Резьба (W, WT)
    product_type = Column(String, nullable=False)  # Тип продукта (коронка, расширитель, башмак)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class PassportCounter(Base):
    """Счетчик паспортов для каждого года"""
    __tablename__ = "passport_counters"
    
    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False, unique=True, index=True)
    current_serial = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def __repr__(self):
        return f"<PassportCounter(year={self.year}, current_serial={self.current_serial})>"

class VEDPassport(Base):
    """Паспорт ВЭД"""
    __tablename__ = "ved_passports"

    id = Column(Integer, primary_key=True, index=True)
    passport_number = Column(String, unique=True, nullable=False, index=True)  # Номер паспорта
    order_number = Column(String, nullable=False)  # Номер заказа покупателя
    nomenclature_id = Column(Integer, ForeignKey("ved_nomenclature.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)  # Количество
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="active")  # active, completed, processing
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    nomenclature = relationship("VEDNomenclature", lazy="selectin")
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")

    @staticmethod
    async def generate_passport_number(db, matrix: str, drilling_depth: str = None, article: str = None) -> str:
        """Генерация номера паспорта используя счетчик из БД"""
        current_year = datetime.datetime.now().year
        current_year_suffix = str(current_year)[-2:]  # Последние 2 цифры года
        
        # Получаем или создаем счетчик для текущего года
        counter = db.query(PassportCounter).filter(PassportCounter.year == current_year).first()
        
        if not counter:
            # Создаем новый счетчик для текущего года
            counter = PassportCounter(year=current_year, current_serial=0)
            db.add(counter)
            db.commit()
            db.refresh(counter)
            print(f"DEBUG: Created new counter for year {current_year}")
        
        # Увеличиваем счетчик
        counter.current_serial += 1
        db.commit()
        
        # Форматируем серийный номер с ведущими нулями
        serial_number = str(counter.current_serial).zfill(6)
        
        # Формируем номер паспорта
        passport_number = f"{serial_number}{current_year_suffix}"
        
        print(f"DEBUG: Generated passport number: {passport_number} (serial: {counter.current_serial}, year: {current_year})")
        return passport_number
