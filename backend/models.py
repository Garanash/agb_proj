from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Enum, ForeignKey, select
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    manager = "manager"
    employee = "employee"
    ved_passport = "ved_passport"


class Permission(str, enum.Enum):
    # Основные разрешения
    VIEW_DASHBOARD = "view_dashboard"
    VIEW_NEWS = "view_news"
    CREATE_NEWS = "create_news"
    EDIT_NEWS = "edit_news"
    DELETE_NEWS = "delete_news"
    
    # Календарь
    VIEW_CALENDAR = "view_calendar"
    CREATE_EVENTS = "create_events"
    EDIT_EVENTS = "edit_events"
    DELETE_EVENTS = "delete_events"
    
    # Пользователи
    VIEW_USERS = "view_users"
    CREATE_USERS = "create_users"
    EDIT_USERS = "edit_users"
    DELETE_USERS = "delete_users"
    RESET_PASSWORDS = "reset_passwords"
    
    # Отделы
    VIEW_DEPARTMENTS = "view_departments"
    CREATE_DEPARTMENTS = "create_departments"
    EDIT_DEPARTMENTS = "edit_departments"
    DELETE_DEPARTMENTS = "delete_departments"
    
    # Проекты и отчеты
    VIEW_PROJECTS = "view_projects"
    VIEW_REPORTS = "view_reports"
    
    # О нас
    VIEW_ABOUT = "view_about"
    EDIT_ABOUT = "edit_about"
    
    # Настройки
    VIEW_SETTINGS = "view_settings"
    EDIT_SETTINGS = "edit_settings"
    
    # Паспорта ВЭД
    VIEW_VED_PASSPORTS = "view_ved_passports"
    CREATE_VED_PASSPORTS = "create_ved_passports"
    EDIT_VED_PASSPORTS = "edit_ved_passports"
    DELETE_VED_PASSPORTS = "delete_ved_passports"
    VIEW_VED_ARCHIVE = "view_ved_archive"


class NewsCategory(str, enum.Enum):
    general = "general"
    technical = "technical"
    event = "event"


class EventType(str, enum.Enum):
    meeting = "meeting"        # Встреча
    call = "call"             # Созвон
    briefing = "briefing"     # Планерка
    conference = "conference" # Совещание
    other = "other"           # Другое


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
    company_employees = relationship("CompanyEmployee", back_populates="department")


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
    def generate_username(first_name: str, last_name: str, middle_name: str = None, prefix: str = "AGB"):
        
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
        
        # Формируем username с префиксом в начале
        username = f"{prefix}{first_letter}{middle_letter}{last_name_translit}"
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
    event_type = Column(Enum(EventType), default=EventType.meeting)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_public = Column(Boolean, default=False)  # Общее событие для всех пользователей
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    creator = relationship("User", back_populates="events", foreign_keys=[creator_id])
    participants = relationship("EventParticipant", back_populates="event", cascade="all, delete-orphan")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, default=False)  # Системная роль (нельзя удалить)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    users = relationship("UserRoleAssignment", back_populates="role", cascade="all, delete-orphan")


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    permission = Column(Enum(Permission), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    role = relationship("Role", back_populates="permissions")


class UserRoleAssignment(Base):
    __tablename__ = "user_role_assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    user = relationship("User", foreign_keys=[user_id])
    role = relationship("Role", back_populates="users")
    assigned_by_user = relationship("User", foreign_keys=[assigned_by])


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=True)  # Заголовок/должность для отображения
    description = Column(Text, nullable=True)  # Описание сотрудника
    order_index = Column(Integer, default=0)  # Порядок отображения
    is_visible = Column(Boolean, default=True)  # Отображать ли на странице "О нас"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    user = relationship("User")


class ChatFolder(Base):
    __tablename__ = "chat_folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Название папки
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Владелец папки
    order_index = Column(Integer, default=0)  # Порядок отображения
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    user = relationship("User")
    rooms = relationship("ChatRoomFolder", back_populates="folder", cascade="all, delete-orphan")


class ChatRoom(Base):
    __tablename__ = "chat_rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Название беседы
    description = Column(Text, nullable=True)  # Описание беседы
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Создатель беседы
    is_private = Column(Boolean, default=False)  # Приватная беседа
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    creator = relationship("User", foreign_keys=[creator_id])
    participants = relationship("ChatRoomParticipant", back_populates="chat_room", cascade="all, delete-orphan")
    messages = relationship("ChatMessage", back_populates="chat_room", cascade="all, delete-orphan")
    folders = relationship("ChatRoomFolder", back_populates="room", cascade="all, delete-orphan")


class ChatRoomFolder(Base):
    __tablename__ = "chat_room_folders"

    id = Column(Integer, primary_key=True, index=True)
    folder_id = Column(Integer, ForeignKey("chat_folders.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Пользователь, который добавил чат в папку
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    folder = relationship("ChatFolder", back_populates="rooms")
    room = relationship("ChatRoom", back_populates="folders")
    user = relationship("User")  # Связь с пользователем


class ChatRoomParticipant(Base):
    __tablename__ = "chat_room_participants"

    id = Column(Integer, primary_key=True, index=True)
    chat_room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Может быть NULL для ботов
    bot_id = Column(Integer, ForeignKey("chat_bots.id"), nullable=True)  # ID бота, если сообщение от бота
    is_admin = Column(Boolean, default=False)  # Администратор беседы
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    last_read_at = Column(DateTime(timezone=True), nullable=True)  # Время последнего прочтения

    # Связи
    chat_room = relationship("ChatRoom", back_populates="participants")
    user = relationship("User", foreign_keys=[user_id])
    bot = relationship("ChatBot", back_populates="participants", foreign_keys=[bot_id])


class EventParticipant(Base):
    __tablename__ = "event_participants"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    event = relationship("Event", back_populates="participants")
    user = relationship("User")


class ChatBot(Base):
    __tablename__ = "chat_bots"
    
    # Конфигурация для избежания предупреждения о model_id
    __table_args__ = {'extend_existing': True}
    
    # Pydantic конфигурация для избежания предупреждения о model_id
    model_config = {
        'protected_namespaces': ()
    }

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Имя бота
    description = Column(Text, nullable=True)  # Описание бота
    api_key = Column(String, nullable=False)  # API ключ для VseGPT
    bot_model_id = Column(String, nullable=False)  # ID модели для использования
    system_prompt = Column(Text, nullable=True)  # Системный промпт для бота
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    participants = relationship("ChatRoomParticipant", back_populates="bot")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Может быть NULL для сообщений от бота
    bot_id = Column(Integer, ForeignKey("chat_bots.id"), nullable=True)  # ID бота, если сообщение от бота
    content = Column(Text, nullable=False)  # Содержание сообщения
    is_edited = Column(Boolean, default=False)  # Было ли сообщение отредактировано
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    chat_room = relationship("ChatRoom", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])
    bot = relationship("ChatBot", foreign_keys=[bot_id])


class CompanyEmployee(Base):
    __tablename__ = "company_employees"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)  # Имя
    last_name = Column(String, nullable=False)   # Фамилия
    middle_name = Column(String, nullable=True)  # Отчество
    position = Column(String, nullable=True)     # Должность
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)  # ID отдела
    phone = Column(String, nullable=True)        # Телефон
    email = Column(String, nullable=True)        # Email
    avatar_url = Column(String, nullable=True)   # URL аватара
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    department = relationship("Department", back_populates="company_employees")


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
        """Генерация номера паспорта согласно правилам"""
        import datetime
        from sqlalchemy import func
        
        # Получаем текущий год
        current_year = str(datetime.datetime.now().year)[-2:]
        
        # Получаем следующий серийный номер для текущего года
        # Ищем максимальный серийный номер среди паспортов текущего года
        current_year_start = datetime.datetime.now().replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Получаем все паспорта текущего года
        result = await db.execute(
            select(VEDPassport).where(VEDPassport.created_at >= current_year_start)
        )
        passports_this_year = result.scalars().all()
        
        # Находим максимальный серийный номер
        max_serial = 0
        for passport in passports_this_year:
            try:
                # Извлекаем серийный номер из номера паспорта
                # Ищем 6-значное число в номере паспорта
                import re
                match = re.search(r'\b(\d{6})\b', passport.passport_number)
                if match:
                    serial = int(match.group(1))
                    if serial > max_serial:
                        max_serial = serial
            except (ValueError, IndexError):
                continue
        
        # Следующий серийный номер
        next_serial = max_serial + 1
        serial_number = f"{next_serial:06d}"
        
        # Логируем для отладки
        print(f"DEBUG: max_serial={max_serial}, next_serial={next_serial}, current_year={current_year}")
        
        if drilling_depth:
            # Для коронок: AGB [Глубина бурения] [Матрица] [Серийный номер] [Год]
            passport_number = f"AGB {drilling_depth} {matrix} {serial_number} {current_year}"
        else:
            # Для расширителей и башмаков: AGB [Матрица] [Серийный номер] [Год]
            passport_number = f"AGB {matrix} {serial_number} {current_year}"
        
        print(f"DEBUG: Generated passport number: {passport_number}")
        return passport_number