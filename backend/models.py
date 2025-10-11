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
    participants = relationship("ChatParticipant", back_populates="room", lazy="selectin")
    messages = relationship("ChatMessage", back_populates="room", lazy="selectin")

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


# Модели для системы сопоставления артикулов

class ArticleMapping(Base):
    """Соответствия артикулов контрагентов с нашей базой данных"""
    __tablename__ = "article_mappings"

    id = Column(Integer, primary_key=True, index=True)
    contractor_article = Column(String, nullable=False, index=True)  # Артикул контрагента
    contractor_description = Column(String, nullable=False)  # Описание контрагента
    agb_article = Column(String, nullable=False, index=True)  # Наш артикул
    agb_description = Column(String, nullable=False)  # Наше описание
    confidence = Column(Float, default=0.0)  # Уверенность в сопоставлении (0-1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class MatchingNomenclature(Base):
    """Номенклатура для сопоставления артикулов"""
    __tablename__ = "matching_nomenclatures"

    id = Column(Integer, primary_key=True, index=True)
    agb_article = Column(String, nullable=False, index=True)
    agb_description = Column(String, nullable=False)
    bl_article = Column(String, nullable=True, index=True)
    bl_description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ApiKey(Base):
    """Модель для хранения API ключей"""
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    key_value = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AiProcessingLog(Base):
    """Лог обработки ИИ-запросов"""
    __tablename__ = "ai_processing_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    request_type = Column(String, nullable=False)  # article_matching, chat, etc.
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    processing_time = Column(Float, nullable=True)  # В секундах
    success = Column(Boolean, default=True)
    error_message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    user = relationship("User", lazy="selectin")

class AppSettings(Base):
    """Настройки приложения"""
    __tablename__ = "app_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, nullable=False)
    value = Column(JSON, nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class AIChatSession(Base):
    """Сессия чата с ИИ"""
    __tablename__ = "ai_chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    user = relationship("User", back_populates="chat_sessions", lazy="selectin")
    messages = relationship("AIChatMessage", back_populates="session", lazy="selectin")

class AIChatMessage(Base):
    """Сообщение в чате с ИИ"""
    __tablename__ = "ai_chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("ai_chat_sessions.id"), nullable=False)
    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    session = relationship("AIChatSession", back_populates="messages", lazy="selectin")

class FoundMatch(Base):
    """Найденные и подтвержденные сопоставления"""
    __tablename__ = "found_matches"

    id = Column(Integer, primary_key=True, index=True)
    contractor_article = Column(String, nullable=False, index=True)
    contractor_description = Column(String, nullable=False)
    matched_article = Column(String, nullable=True, index=True)
    matched_description = Column(String, nullable=True)
    confidence = Column(Float, default=0.0)
    match_type = Column(String, default="manual")  # manual, ai, hybrid
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    creator = relationship("User", lazy="selectin")


# Модели для поиска поставщиков артикулов

class Supplier(Base):
    """Поставщики артикулов"""
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    website = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    articles = relationship("SupplierArticle", back_populates="supplier", lazy="selectin")

class SupplierArticle(Base):
    """Артикулы поставщиков"""
    __tablename__ = "supplier_articles"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    article = Column(String, nullable=False, index=True)
    description = Column(String, nullable=False)
    price = Column(Float, nullable=True)
    currency = Column(String, default="RUB")
    availability = Column(String, default="in_stock")  # in_stock, out_of_stock, limited
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    supplier = relationship("Supplier", back_populates="articles", lazy="selectin")

class ArticleSearchRequest(Base):
    """Запросы на поиск артикулов"""
    __tablename__ = "article_search_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    search_query = Column(String, nullable=False)
    search_type = Column(String, default="article")  # article, description, both
    status = Column(String, default="pending")  # pending, processing, completed, failed
    results_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Связи
    user = relationship("User", lazy="selectin")
    results = relationship("ArticleSearchResult", back_populates="request", lazy="selectin")

class ArticleSearchResult(Base):
    """Результаты поиска артикулов"""
    __tablename__ = "article_search_results"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("article_search_requests.id"), nullable=False)
    article = Column(String, nullable=False)
    
    # Информация о поставщике
    company_name = Column(String, nullable=False)
    contact_person = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    address = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    
    # Ценовая информация
    price = Column(Float, nullable=True)
    currency = Column(String, default="RUB")
    min_order_quantity = Column(Integer, nullable=True)
    availability = Column(String, default="in_stock")
    confidence_score = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    request = relationship("ArticleSearchRequest", back_populates="results", lazy="selectin")

class SupplierValidationLog(Base):
    """Лог валидации поставщиков"""
    __tablename__ = "supplier_validation_logs"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    validation_type = Column(String, nullable=False)  # website_check, email_check, etc.
    status = Column(String, nullable=False)  # success, failed, warning
    message = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    supplier = relationship("Supplier", lazy="selectin")


class ArticleMatchingRequest(Base):
    """Запросы на сопоставление артикулов"""
    __tablename__ = "article_matching_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    contractor_article = Column(String, nullable=False)
    contractor_description = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    user = relationship("User", lazy="selectin")
    results = relationship("ArticleMatchingResult", back_populates="request", lazy="selectin")


class ArticleMatchingResult(Base):
    """Результаты сопоставления артикулов"""
    __tablename__ = "article_matching_results"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("article_matching_requests.id"), nullable=False)
    contractor_article = Column(String, nullable=False)
    contractor_name = Column(String, nullable=True)
    matched_article = Column(String, nullable=True)
    matched_description = Column(String, nullable=True)
    confidence = Column(Float, default=0.0)
    match_type = Column(String, default="no_match")  # exact, partial, no_match
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    request = relationship("ArticleMatchingRequest", back_populates="results", lazy="selectin")
