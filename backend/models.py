from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func, select, BigInteger, Float, Text
from sqlalchemy.dialects.postgresql import JSON
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
    CUSTOMER = "customer"  # Заказчик (компания)
    CONTRACTOR = "contractor"  # Исполнитель (физлицо)
    SERVICE_ENGINEER = "service_engineer"  # Сервисный инженер

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

class RequestStatus(str, enum.Enum):
    NEW = "new"  # Новая заявка
    PROCESSING = "processing"  # В обработке (принята менеджером)
    SENT_TO_BOT = "sent_to_bot"  # Отправлена в бот
    ASSIGNED = "assigned"  # Назначен исполнитель
    COMPLETED = "completed"  # Завершена
    CANCELLED = "cancelled"  # Отменена

class ResponseStatus(str, enum.Enum):
    PENDING = "pending"  # Ожидает рассмотрения
    ACCEPTED = "accepted"  # Принята менеджером
    REJECTED = "rejected"  # Отклонена менеджером
    ASSIGNED = "assigned"  # Исполнитель назначен на заявку

class User(Base):
    """Пользователи системы"""
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    middle_name = Column(String, nullable=True)
    role = Column(String, default=UserRole.EMPLOYEE)
    is_active = Column(Boolean, default=True)
    is_password_changed = Column(Boolean, default=False)  # Флаг смены пароля
    avatar_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    position = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    department = relationship("Department", foreign_keys=[department_id], back_populates="employees", lazy="selectin")
    customer_profile = relationship("CustomerProfile", back_populates="user", lazy="selectin", uselist=False)
    contractor_profile = relationship("ContractorProfile", back_populates="user", lazy="selectin", uselist=False)
    chat_sessions = relationship("AIChatSession", back_populates="user", lazy="selectin")
    
    @property
    def full_name(self) -> str:
        """Полное имя пользователя"""
        if self.middle_name:
            return f"{self.last_name or ''} {self.first_name or ''} {self.middle_name or ''}".strip()
        return f"{self.last_name or ''} {self.first_name or ''}".strip()

class Department(Base):
    """Подразделения компании"""
    __tablename__ = "departments"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    head_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    head = relationship("User", foreign_keys=[head_id], lazy="selectin")
    employees = relationship("User", foreign_keys=[User.department_id], back_populates="department", lazy="selectin")

class CompanyEmployee(Base):
    """Сотрудники компании"""
    __tablename__ = "company_employees"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    middle_name = Column(String, nullable=True)
    position = Column(String, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    department = relationship("Department", lazy="selectin")

    @property
    def full_name(self) -> str:
        """Полное имя сотрудника"""
        if self.middle_name:
            return f"{self.last_name} {self.first_name} {self.middle_name}"
        return f"{self.last_name} {self.first_name}"

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
    __table_args__ = {'extend_existing': True}

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
    __table_args__ = {'extend_existing': True}

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
    __table_args__ = {'extend_existing': True}

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
    __table_args__ = {'extend_existing': True}

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
    __table_args__ = {'extend_existing': True}

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
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_private = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")
    folders = relationship("ChatRoomFolder", lazy="selectin")

class ChatMessage(Base):
    """Сообщения в чате"""
    __tablename__ = "chat_messages"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    bot_id = Column(Integer, ForeignKey("chat_bots.id"), nullable=True)
    content = Column(String, nullable=False)
    is_edited = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    room = relationship("ChatRoom", lazy="selectin")
    sender = relationship("User", foreign_keys=[sender_id], lazy="selectin")
    bot = relationship("ChatBot", lazy="selectin")

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
    chat_room = relationship("ChatRoom", foreign_keys=[room_id], lazy="selectin", overlaps="room")

class ChatFolder(Base):
    """Папки для организации чатов"""
    __tablename__ = "chat_folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_index = Column(Integer, default=0)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")
    user = relationship("User", foreign_keys=[user_id], lazy="selectin")
    room = relationship("ChatRoom", foreign_keys=[room_id], lazy="selectin")

class ChatRoomFolder(Base):
    """Связь чат-комнат с папками"""
    __tablename__ = "chat_room_folders"

    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    folder_id = Column(Integer, ForeignKey("chat_folders.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    room = relationship("ChatRoom", lazy="selectin", overlaps="folders")
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
    async def generate_passport_number(db: AsyncSession, matrix: str, drilling_depth: str = None, article: str = None, product_type: str = None) -> str:
        """Генерация номера паспорта используя счетчик из БД

        Правила генерации номеров паспортов:
        Коронки: AGB [Глубина бурения] [Матрица] [Серийный номер] [Год]
        Пример: AGB 05-07 NQ 000001 25

        Расширители и башмаки: AGB [Матрица] [Серийный номер] [Год]
        Пример: AGB NQ 000001 25
        """
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
            # Убираем лишний коммит - пусть будет одна транзакция
            await db.flush()
            print(f"DEBUG: Created new counter for year {current_year}")

        # Увеличиваем счетчик
        counter.current_value += 1
        # Убираем лишний коммит - пусть будет одна транзакция
        await db.flush()

        # Форматируем серийный номер с ведущими нулями
        serial_number = str(counter.current_value).zfill(6)

        # Формируем номер паспорта согласно правилам
        if product_type == "коронка":
            # Коронки: AGB [Глубина бурения] [Матрица] [Серийный номер] [Год]
            if drilling_depth:
                passport_number = f"AGB {drilling_depth} {matrix} {serial_number} {current_year_suffix}"
            else:
                passport_number = f"AGB {matrix} {serial_number} {current_year_suffix}"
        elif product_type in ["расширитель", "башмак"]:
            # Расширители и башмаки: AGB [Матрица] [Серийный номер] [Год]
            passport_number = f"AGB {matrix} {serial_number} {current_year_suffix}"
        else:
            # Если тип продукта не определен, используем общий формат
            passport_number = f"AGB {matrix} {serial_number} {current_year_suffix}"

        print(f"DEBUG: Generated passport number: {passport_number} (serial: {counter.current_value}, year: {current_year}, type: {product_type})")
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


# Новые модели для системы заказов и исполнителей

class CustomerProfile(Base):
    """Профиль заказчика (компания)"""
    __tablename__ = "customer_profiles"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # Данные компании
    company_name = Column(String, nullable=False)
    contact_person = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    address = Column(String, nullable=True)
    inn = Column(String, nullable=True)  # ИНН
    kpp = Column(String, nullable=True)  # КПП
    ogrn = Column(String, nullable=True)  # ОГРН

    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    user = relationship("User", back_populates="customer_profile", lazy="selectin")
    requests = relationship("RepairRequest", back_populates="customer", lazy="selectin")


class ContractorProfile(Base):
    """Профиль исполнителя (физлицо)"""
    __tablename__ = "contractor_profiles"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # Личные данные (используем существующие поля)
    last_name = Column(String, nullable=True, default=None)
    first_name = Column(String, nullable=True, default=None)
    patronymic = Column(String, nullable=True, default=None)
    phone = Column(String, nullable=True, default=None)
    email = Column(String, nullable=True, default=None)

    # Профессиональная информация (JSON массив)
    professional_info = Column(JSON, nullable=True, default=list)

    # Образование (JSON массив)
    education = Column(JSON, nullable=True, default=list)

    # Банковские данные
    bank_name = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    bank_bik = Column(String, nullable=True)

    # Контакты
    telegram_username = Column(String, nullable=True)
    website = Column(String, nullable=True)

    # Общее описание
    general_description = Column(String, nullable=True, default=None)

    # Файлы
    profile_photo_path = Column(String, nullable=True, default=None)  # Путь к фото профиля
    portfolio_files = Column(JSON, nullable=True, default=list)  # Массив файлов портфолио
    document_files = Column(JSON, nullable=True, default=list)  # Массив документов

    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    user = relationship("User", back_populates="contractor_profile", lazy="selectin")
    responses = relationship("ContractorResponse", back_populates="contractor", lazy="selectin")


class RepairRequest(Base):
    """Заявка на ремонт"""
    __tablename__ = "repair_requests"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customer_profiles.id"), nullable=False)

    # Основная информация
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    urgency = Column(String, nullable=True)  # срочно, средне, не срочно
    preferred_date = Column(DateTime, nullable=True)

    # Местоположение
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    region = Column(String, nullable=True)

    # Технические детали (заполняются сервисным инженером)
    equipment_type = Column(String, nullable=True)
    equipment_brand = Column(String, nullable=True)
    equipment_model = Column(String, nullable=True)
    problem_description = Column(String, nullable=True)
    estimated_cost = Column(Integer, nullable=True)  # в рублях
    
    # Дополнительная информация от менеджера сервиса
    manager_comment = Column(String, nullable=True)  # Комментарий менеджера
    final_price = Column(Integer, nullable=True)  # Финальная цена заявки
    sent_to_bot_at = Column(DateTime(timezone=True), nullable=True)  # Когда отправлена в бот

    # Статусы
    status = Column(String, default=RequestStatus.NEW)
    service_engineer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_contractor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)  # Когда обработал инженер
    assigned_at = Column(DateTime(timezone=True), nullable=True)  # Когда назначен исполнитель
    completed_at = Column(DateTime(timezone=True), nullable=True)  # Когда завершена

    # Связи
    customer = relationship("CustomerProfile", back_populates="requests", lazy="selectin")
    service_engineer = relationship("User", foreign_keys=[service_engineer_id], lazy="selectin")
    assigned_contractor = relationship("User", foreign_keys=[assigned_contractor_id], lazy="selectin")
    responses = relationship("ContractorResponse", back_populates="request", lazy="selectin")


class ContractorResponse(Base):
    """Отклик исполнителя на заявку"""
    __tablename__ = "contractor_responses"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("repair_requests.id"), nullable=False)
    contractor_id = Column(Integer, ForeignKey("contractor_profiles.id"), nullable=False)

    # Отклик
    proposed_cost = Column(Integer, nullable=True)  # Предлагаемая стоимость
    estimated_days = Column(Integer, nullable=True)  # Ожидаемое время выполнения
    comment = Column(String, nullable=True)  # Комментарий исполнителя

    # Статус отклика
    status = Column(String, default=ResponseStatus.PENDING)

    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)  # Когда рассмотрел менеджер

    # Связи
    request = relationship("RepairRequest", back_populates="responses", lazy="selectin")
    contractor = relationship("ContractorProfile", back_populates="responses", lazy="selectin")





# Модели для Telegram бота
class TelegramBot(Base):
    """Настройки Telegram бота"""
    __tablename__ = "telegram_bots"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    token = Column(String, nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    webhook_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class TelegramUser(Base):
    """Связь пользователей с Telegram"""
    __tablename__ = "telegram_users"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    telegram_id = Column(BigInteger, nullable=False, unique=True)
    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    is_bot_user = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    user = relationship("User", lazy="selectin")


class TelegramNotification(Base):
    """Уведомления в Telegram"""
    __tablename__ = "telegram_notifications"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    telegram_user_id = Column(Integer, ForeignKey("telegram_users.id"), nullable=False)
    message_type = Column(String, nullable=False)  # 'new_request', 'response_received', etc.
    message_text = Column(String, nullable=False)
    message_id = Column(BigInteger, nullable=True)  # ID сообщения в Telegram
    chat_id = Column(BigInteger, nullable=False)
    repair_request_id = Column(Integer, ForeignKey("repair_requests.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    telegram_user = relationship("TelegramUser", lazy="selectin")
    repair_request = relationship("RepairRequest", foreign_keys=[repair_request_id], lazy="selectin")


# Модели для системы сопоставления артикулов

class ArticleMapping(Base):
    """Соответствия артикулов контрагентов с нашей базой данных"""
    __tablename__ = "article_mappings"

    id = Column(Integer, primary_key=True, index=True)
    contractor_article = Column(String, nullable=False, index=True)  # Артикул контрагента
    contractor_description = Column(String, nullable=False)  # Описание контрагента
    agb_article = Column(String, nullable=False)  # Артикул АГБ
    agb_description = Column(String, nullable=False)  # Описание АГБ
    bl_article = Column(String, nullable=True)  # Артикул BL (если есть)
    bl_description = Column(String, nullable=True)  # Описание BL
    match_confidence = Column(Integer, default=0)  # Уверенность сопоставления (0-100)
    packaging_factor = Column(Integer, default=1)  # Коэффициент фасовки
    recalculated_quantity = Column(Integer, default=0)  # Пересчитанное количество
    unit = Column(String, nullable=False, default="шт")  # Единица измерения
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    nomenclature_id = Column(Integer, ForeignKey("ved_nomenclature.id"), nullable=True)
    nomenclature = relationship("VEDNomenclature", lazy="selectin")


class ContractorRequest(Base):
    """Заявки от контрагентов на сопоставление артикулов"""
    __tablename__ = "contractor_requests"

    id = Column(Integer, primary_key=True, index=True)
    request_number = Column(String, nullable=False, unique=True, index=True)  # Номер заявки
    contractor_name = Column(String, nullable=False)  # Название контрагента
    request_date = Column(DateTime, nullable=False)  # Дата заявки
    status = Column(String, default="new")  # new, processing, completed, cancelled
    total_items = Column(Integer, default=0)  # Общее количество позиций
    matched_items = Column(Integer, default=0)  # Количество сопоставленных позиций
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    processed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Связи
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")
    processor = relationship("User", foreign_keys=[processed_by], lazy="selectin")
    items = relationship("ContractorRequestItem", back_populates="request", lazy="selectin")


class ContractorRequestItem(Base):
    """Позиции в заявке контрагента"""
    __tablename__ = "contractor_request_items"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("contractor_requests.id"), nullable=False)
    line_number = Column(Integer, nullable=False)  # Номер строки в заявке
    contractor_article = Column(String, nullable=False)  # Артикул контрагента
    description = Column(String, nullable=False)  # Описание товара
    unit = Column(String, nullable=False, default="шт")  # Единица измерения
    quantity = Column(Integer, nullable=False)  # Количество
    category = Column(String, nullable=True)  # Категория (например, "Для бурения")
    
    # Результаты сопоставления
    matched_nomenclature_id = Column(Integer, ForeignKey("ved_nomenclature.id"), nullable=True)
    agb_article = Column(String, nullable=True)  # Найденный артикул АГБ
    bl_article = Column(String, nullable=True)  # Найденный артикул BL
    packaging_factor = Column(Integer, default=1)  # Коэффициент фасовки
    recalculated_quantity = Column(Integer, nullable=True)  # Пересчитанное количество
    match_confidence = Column(Integer, default=0)  # Уверенность в сопоставлении (0-100)
    match_status = Column(String, default="pending")  # pending, matched, unmatched, manual
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    request = relationship("ContractorRequest", back_populates="items", lazy="selectin")
    matched_nomenclature = relationship("VEDNomenclature", lazy="selectin")


class MatchingNomenclature(Base):
    """Номенклатура для сопоставления артикулов"""
    __tablename__ = "matching_nomenclatures"

    id = Column(Integer, primary_key=True, index=True)
    agb_article = Column(String, nullable=False, index=True)  # Артикул АГБ
    name = Column(String, nullable=False)  # Наименование
    code_1c = Column(String, nullable=True)  # Код 1С (УТ-код)
    bl_article = Column(String, nullable=True)  # Артикул BL
    packaging = Column(Float, nullable=True)  # Фасовка
    unit = Column(String, nullable=True, default="шт")  # Единица измерения
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ApiKey(Base):
    """Модель для хранения API ключей"""
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Название ключа
    provider = Column(String, nullable=False)  # openai, polza, custom
    key = Column(String, nullable=False)  # Зашифрованный ключ
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_used = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)


class AiProcessingLog(Base):
    """Лог обработки ИИ-запросов"""
    __tablename__ = "ai_processing_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=True)
    request_type = Column(String, nullable=False)  # file_upload, text_input
    file_path = Column(String, nullable=True)  # Путь к обработанному файлу
    input_text = Column(Text, nullable=True)  # Входной текст
    ai_response = Column(Text, nullable=True)  # Ответ ИИ
    processing_time = Column(Float, nullable=True)  # Время обработки в секундах
    status = Column(String, nullable=False)  # success, error, processing
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AppSettings(Base):
    """Настройки приложения"""
    __tablename__ = "app_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False, index=True)  # Ключ настройки
    value = Column(Text, nullable=False)  # Значение настройки
    description = Column(Text, nullable=True)  # Описание настройки
    is_encrypted = Column(Boolean, default=False)  # Зашифровано ли значение
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AIChatSession(Base):
    """Сессия чата с ИИ"""
    __tablename__ = "ai_chat_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)  # Название сессии (автогенерируемое)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    user = relationship("User", back_populates="chat_sessions", lazy="selectin")
    messages = relationship("AIChatMessage", back_populates="session", cascade="all, delete-orphan", lazy="selectin")


class AIChatMessage(Base):
    """Сообщение в чате с ИИ"""
    __tablename__ = "ai_chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("ai_chat_sessions.id"), nullable=False)
    message_type = Column(String, nullable=False)  # 'user', 'ai', 'system'
    content = Column(Text, nullable=False)  # Текст сообщения
    files_data = Column(JSON, nullable=True)  # Данные о прикрепленных файлах
    matching_results = Column(JSON, nullable=True)  # Результаты сопоставления
    search_query = Column(String, nullable=True)  # Поисковый запрос
    search_type = Column(String, nullable=True)  # Тип поиска (артикул, наименование, код)
    is_processing = Column(Boolean, default=False)  # Обрабатывается ли сообщение
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Связи
    session = relationship("AIChatSession", back_populates="messages")


