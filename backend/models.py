from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func, select
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.asyncio import AsyncSession
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
    department = relationship("Department", foreign_keys=[department_id], back_populates="employees", lazy="selectin")

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
    employees = relationship("User", foreign_keys=[User.department_id], back_populates="department", lazy="selectin")

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
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    organizer = relationship("User", foreign_keys=[organizer_id], lazy="selectin")
    participants = relationship("EventParticipant", back_populates="event", lazy="selectin")

class EventParticipant(Base):
    """Участники событий"""
    __tablename__ = "event_participants"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")  # pending, confirmed, declined
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    event = relationship("Event", back_populates="participants", lazy="selectin")
    user = relationship("User", lazy="selectin")

class News(Base):
    """Новости и объявления"""
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    category = Column(String, default="general")
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author_name = Column(String, nullable=True)
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
    project_id = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class TeamMember(Base):
    """Участники команды"""
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, default="member")  # member, lead, manager
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    team = relationship("Team", lazy="selectin")
    user = relationship("User", lazy="selectin")

class ChatRoom(Base):
    """Чат-комнаты"""
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_private = Column(Boolean, default=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    creator = relationship("User", foreign_keys=[creator_id], lazy="selectin")

class ChatMessage(Base):
    """Сообщения в чате"""
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    room = relationship("ChatRoom", lazy="selectin")
    sender = relationship("User", foreign_keys=[sender_id], lazy="selectin")

class ChatParticipant(Base):
    """Участники чата"""
    __tablename__ = "chat_participants"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    bot_id = Column(Integer, ForeignKey("chat_bots.id"), nullable=True)
    is_admin = Column(Boolean, default=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    last_read_at = Column(DateTime(timezone=True), nullable=True)

    # Связи
    room = relationship("ChatRoom", lazy="selectin")
    user = relationship("User", lazy="selectin")
    bot = relationship("ChatBot", lazy="selectin")

class ChatFolder(Base):
    """Папки для организации чатов"""
    __tablename__ = "chat_folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")

class ChatRoomFolder(Base):
    """Связь чат-комнат с папками"""
    __tablename__ = "chat_room_folders"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    folder_id = Column(Integer, ForeignKey("chat_folders.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    room = relationship("ChatRoom", lazy="selectin")
    folder = relationship("ChatFolder", lazy="selectin")

class ChatBot(Base):
    """Чат-боты"""
    __tablename__ = "chat_bots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    model_id = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

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


class VedPassport(Base):
    """ВЭД паспорта"""
    __tablename__ = "ved_passports"

    id = Column(Integer, primary_key=True, index=True)
    passport_number = Column(String, nullable=False, unique=True)
    title = Column(String, nullable=True)  # Теперь nullable, генерируется автоматически
    description = Column(String, nullable=True)
    status = Column(String, default="active")  # active, archived, draft
    order_number = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    nomenclature_id = Column(Integer, ForeignKey("ved_nomenclature.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")
    nomenclature = relationship("VEDNomenclature", lazy="selectin")

    @staticmethod
    async def generate_passport_number(db: AsyncSession, matrix: str, drilling_depth: str = None, article: str = None) -> str:
        """Генерация номера паспорта используя счетчик из БД"""
        current_year = datetime.datetime.now().year
        current_year_suffix = str(current_year)[-2:]  # Последние 2 цифры года
        counter_name = f"ved_passport_{current_year}"

        # Получаем или создаем счетчик для текущего года
        result = await db.execute(
            select(PassportCounter).where(PassportCounter.counter_name == counter_name)
        )
        counter = result.scalar_one_or_none()

        if not counter:
            # Создаем новый счетчик для текущего года
            counter = PassportCounter(
                counter_name=counter_name,
                current_value=0,
                prefix="",
                suffix=current_year_suffix
            )
            db.add(counter)
            await db.commit()
            await db.refresh(counter)
            print(f"DEBUG: Created new counter for year {current_year}")

        # Увеличиваем счетчик
        counter.current_value += 1
        await db.commit()

        # Форматируем серийный номер с ведущими нулями
        serial_number = str(counter.current_value).zfill(6)

        # Формируем номер паспорта
        passport_number = f"{serial_number}{current_year_suffix}"

        print(f"DEBUG: Generated passport number: {passport_number} (serial: {counter.current_value}, year: {current_year})")
        return passport_number

class VedPassportRole(Base):
    """Роли пользователей в ВЭД паспортах"""
    __tablename__ = "ved_passport_roles"

    id = Column(Integer, primary_key=True, index=True)
    passport_id = Column(Integer, ForeignKey("ved_passports.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)  # owner, editor, viewer
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    passport = relationship("VedPassport", lazy="selectin")
    user = relationship("User", lazy="selectin")

class PassportCounter(Base):
    """Счетчики для ВЭД паспортов"""
    __tablename__ = "passport_counters"

    id = Column(Integer, primary_key=True, index=True)
    counter_name = Column(String, nullable=False, unique=True)
    current_value = Column(Integer, default=0)
    prefix = Column(String, nullable=True)
    suffix = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
