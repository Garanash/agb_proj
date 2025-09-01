from pydantic import BaseModel, validator
from datetime import datetime, timezone
from typing import Optional, List, Union
from models import UserRole, NewsCategory, EventType, Permission


class UserBase(BaseModel):
    username: str
    email: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    
    @validator('email')
    def validate_email(cls, v):
        if not v or '@' not in v:
            raise ValueError('Некорректный email адрес')
        return v


class UserCreate(BaseModel):
    email: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    password: str
    role: Optional[UserRole] = UserRole.EMPLOYEE
    username: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    position: Optional[str] = None


class UserUpdate(BaseModel):
    # username нельзя изменять
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    position: Optional[str] = None


class UserProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    position: Optional[str] = None
    avatar_url: Optional[str] = None


class User(UserBase):
    id: int
    role: UserRole
    is_active: bool
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[int] = None
    position: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    @property
    def full_name(self) -> str:
        """Полное имя пользователя"""
        if self.middle_name:
            return f"{self.last_name} {self.first_name} {self.middle_name}"
        return f"{self.last_name} {self.first_name}"

    class Config:
        from_attributes = True


# Схемы для отделов
class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentCreate(DepartmentBase):
    head_id: Optional[int] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    head_id: Optional[int] = None
    is_active: Optional[bool] = None


class Department(DepartmentBase):
    id: int
    head_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    head: Optional[User] = None
    employees: List[User] = []
    # Исключаем company_employees для избежания циклической ссылки

    class Config:
        from_attributes = True


class DepartmentList(DepartmentBase):
    id: int
    head_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    head: Optional[User] = None
    users: List[User] = []
    # Исключаем company_employees для избежания циклической ссылки

    class Config:
        from_attributes = True


class DepartmentCreateResponse(DepartmentBase):
    id: int
    head_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Исключаем связанные данные для избежания ошибок

    class Config:
        from_attributes = True


class CompanyEmployeeBase(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    position: str
    department_id: int
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True


class CompanyEmployeeCreate(CompanyEmployeeBase):
    pass


class CompanyEmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    position: Optional[str] = None
    department_id: Optional[int] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class CompanyEmployee(CompanyEmployeeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Исключаем department для избежания циклической ссылки

    class Config:
        from_attributes = True


class CompanyEmployeeList(CompanyEmployeeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Исключаем department для избежания циклической ссылки

    class Config:
        from_attributes = True


class CompanyEmployeeCreateResponse(CompanyEmployeeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    # Исключаем связанные данные для избежания ошибок

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: User


class NewsBase(BaseModel):
    title: str
    content: str
    category: NewsCategory


class NewsCreate(NewsBase):
    is_published: bool = True


class NewsUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[NewsCategory] = None
    is_published: Optional[bool] = None


class News(NewsBase):
    id: int
    author_id: int
    author_name: str
    is_published: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Схемы для событий
class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    start_date: datetime  # Исправлено: соответствует модели базы данных
    end_date: datetime    # Исправлено: соответствует модели базы данных
    event_type: EventType
    is_public: bool = False  # Общее событие для всех пользователей


class EventCreate(EventBase):
    participants: List[int] = []  # Список ID пользователей-участников

    @validator('start_date', 'end_date')
    def validate_datetime_format(cls, v):
        """Валидация формата даты и времени"""
        # Pydantic v1 автоматически конвертирует ISO строки в datetime объекты
        return v

    @validator('end_date')
    def validate_end_after_start(cls, v, values):
        """Проверка, что дата окончания после даты начала"""
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('Дата окончания должна быть после даты начала')
        return v


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None  # Исправлено: соответствует модели базы данных
    end_date: Optional[datetime] = None    # Исправлено: соответствует модели базы данных
    event_type: Optional[EventType] = None
    is_public: Optional[bool] = None
    is_active: Optional[bool] = None
    participants: Optional[List[int]] = None


class EventParticipant(BaseModel):
    id: int
    event_id: int
    user_id: int
    created_at: datetime
    user: User

    class Config:
        from_attributes = True


class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    start_date: datetime  # Исправлено: соответствует модели базы данных
    end_date: datetime    # Исправлено: соответствует модели базы данных
    event_type: EventType
    is_public: bool
    organizer_id: int    # Исправлено: соответствует модели базы данных
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    participants: List[EventParticipant] = []

    class Config:
        from_attributes = True


# Схемы для сброса пароля
class PasswordReset(BaseModel):
    user_id: int
    new_password: str


# Схемы для ролей
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None


class RoleCreate(RoleBase):
    permissions: List[Permission] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    permissions: Optional[List[Permission]] = None


class Role(RoleBase):
    id: int
    is_system: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    permissions: List[Permission] = []

    class Config:
        from_attributes = True


# Схемы для назначения ролей
class UserRoleAssignmentCreate(BaseModel):
    user_id: int
    role_id: int


class UserRoleAssignment(BaseModel):
    id: int
    user_id: int
    role_id: int
    assigned_by: int
    created_at: datetime

    class Config:
        from_attributes = True


# Схемы для команды
class TeamMemberBase(BaseModel):
    user_id: int
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: int = 0
    is_visible: bool = True


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    is_visible: Optional[bool] = None


class TeamMember(TeamMemberBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Схема для получения информации о команде с данными пользователя
class TeamMemberWithUser(BaseModel):
    id: int
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: int
    is_visible: bool
    user: User
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Схемы для бота
class ChatBotBase(BaseModel):
    name: str
    description: Optional[str] = None
    api_key: str
    bot_model_id: str
    system_prompt: Optional[str] = None

    model_config = {
        'protected_namespaces': ()
    }


class ChatBotCreate(ChatBotBase):
    pass


class ChatBotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    api_key: Optional[str] = None
    bot_model_id: Optional[str] = None
    system_prompt: Optional[str] = None
    is_active: Optional[bool] = None


class ChatBot(ChatBotBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Схемы для чата
class ChatFolderBase(BaseModel):
    name: str
    order_index: int = 0


class ChatFolderCreate(ChatFolderBase):
    pass


class ChatFolderUpdate(BaseModel):
    name: Optional[str] = None
    order_index: Optional[int] = None


class ChatFolderRoomAdd(BaseModel):
    room_id: int


class ChatFolder(ChatFolderBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatRoomFolder(BaseModel):
    id: int
    folder_id: int
    room_id: int
    user_id: int  # Пользователь, который добавил чат в папку
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRoomBase(BaseModel):
    name: str


class ChatRoomCreate(ChatRoomBase):
    description: Optional[str] = None
    is_private: Optional[bool] = False
    participants: Optional[List[int]] = []  # Список ID пользователей для добавления
    bots: Optional[List[int]] = []  # Список ID ботов для добавления


class ChatRoomUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class ChatParticipantBase(BaseModel):
    user_id: Optional[int] = None
    bot_id: Optional[int] = None
    is_admin: bool = False

    @validator('user_id', 'bot_id')
    def validate_participant(cls, v, values):
        if 'user_id' in values and 'bot_id' in values:
            if (values['user_id'] is None and values['bot_id'] is None) or \
               (values['user_id'] is not None and values['bot_id'] is not None):
                raise ValueError('Должен быть указан либо user_id, либо bot_id')
        return v


class ChatParticipantCreate(ChatParticipantBase):
    pass


class ChatMessageBase(BaseModel):
    content: str


class ChatMessageCreate(ChatMessageBase):
    pass


class ChatMessageUpdate(BaseModel):
    content: str


class ChatMessage(ChatMessageBase):
    id: int
    room_id: int
    sender_id: Optional[int] = None
    bot_id: Optional[int] = None
    is_edited: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: int
    room_id: int
    sender_id: Optional[int] = None
    bot_id: Optional[int] = None
    content: str
    is_edited: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    sender: Optional[User] = None  # Полные данные отправителя
    bot: Optional[ChatBot] = None  # Полные данные бота

    class Config:
        from_attributes = True


class SystemMessage(BaseModel):
    id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatParticipant(ChatParticipantBase):
    id: int
    room_id: int
    user_id: Optional[int] = None
    bot_id: Optional[int] = None
    is_admin: bool
    joined_at: datetime
    last_read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatParticipantResponse(BaseModel):
    id: int
    room_id: int
    user_id: Optional[int] = None
    bot_id: Optional[int] = None
    is_admin: bool
    joined_at: datetime
    last_read_at: Optional[datetime] = None
    user: Optional[User] = None  # Полные данные пользователя
    bot: Optional[ChatBot] = None  # Полные данные бота

    class Config:
        from_attributes = True


class ChatRoomDetailResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    created_by: int
    is_private: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    participants: List[ChatParticipantResponse] = []  # Используем правильную схему
    messages: List[ChatMessageResponse] = []

    class Config:
        from_attributes = True


class ChatRoom(ChatRoomBase):
    id: int
    description: Optional[str] = None
    created_by: int
    is_private: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: User
    participants: List[ChatParticipantResponse] = []  # Используем правильную схему
    messages: List[ChatMessageResponse] = []  # Используем правильную схему

    class Config:
        from_attributes = True


class ChatRoomCreateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_private: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: int
    folders: List[ChatRoomFolder] = []  # Добавляем папки

    class Config:
        from_attributes = True


# Схемы для номенклатуры и паспортов ВЭД
class VEDNomenclatureBase(BaseModel):
    code_1c: str
    name: str
    article: str
    matrix: str
    drilling_depth: Optional[str] = None
    height: Optional[str] = None
    thread: Optional[str] = None
    product_type: str


class VEDNomenclatureCreate(VEDNomenclatureBase):
    pass


class VEDNomenclatureUpdate(BaseModel):
    code_1c: Optional[str] = None
    name: Optional[str] = None
    article: Optional[str] = None
    matrix: Optional[str] = None
    drilling_depth: Optional[str] = None
    height: Optional[str] = None
    thread: Optional[str] = None
    product_type: Optional[str] = None
    is_active: Optional[bool] = None


class VEDNomenclature(VEDNomenclatureBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class VedPassportBase(BaseModel):
    title: Optional[str] = None  # Опционально, генерируется автоматически
    order_number: str
    nomenclature_id: int
    quantity: int = 1


class VedPassportCreate(VedPassportBase):
    pass


class VedPassportUpdate(BaseModel):
    order_number: Optional[str] = None
    nomenclature_id: Optional[int] = None
    quantity: Optional[int] = None
    status: Optional[str] = None


class VedPassport(VedPassportBase):
    id: int
    passport_number: str
    created_by: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    nomenclature: VEDNomenclature

    class Config:
        from_attributes = True


class VedPassportWithCreator(VedPassport):
    creator: User

    class Config:
        from_attributes = True


class BulkPassportCreate(BaseModel):
    title: Optional[str] = None  # Заголовок для паспортов
    order_number: str
    items: List[dict]  # Список позиций с кодом 1С и количеством


class PassportGenerationResult(BaseModel):
    success: bool
    message: str
    passports: List[VedPassport] = []
    errors: List[str] = []


# Новые схемы для системы заказов и исполнителей

class CustomerProfileBase(BaseModel):
    company_name: str
    contact_person: str
    phone: str
    email: str
    address: Optional[str] = None
    inn: Optional[str] = None
    kpp: Optional[str] = None
    ogrn: Optional[str] = None


class CustomerProfileCreate(CustomerProfileBase):
    pass


class CustomerProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    inn: Optional[str] = None
    kpp: Optional[str] = None
    ogrn: Optional[str] = None


class CustomerProfile(CustomerProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProfessionalInfoItem(BaseModel):
    specialization: str
    experience_years: Optional[int] = None
    skills: Optional[str] = None
    description: Optional[str] = None


class EducationItem(BaseModel):
    institution: str
    degree: str
    field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None
    description: Optional[str] = None


class FileInfo(BaseModel):
    name: str
    path: str
    size: int
    url: str


class ContractorProfileBase(BaseModel):
    # Личные данные
    last_name: Optional[str] = None
    first_name: Optional[str] = None
    patronymic: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

    # Профессиональная информация
    professional_info: List[ProfessionalInfoItem] = []

    # Образование
    education: List[EducationItem] = []

    # Банковские данные
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    bank_bik: Optional[str] = None

    # Контакты
    telegram_username: Optional[str] = None
    website: Optional[str] = None

    # Общее описание
    general_description: Optional[str] = None

    # Файлы
    profile_photo_url: Optional[str] = None
    portfolio_files: List[FileInfo] = []
    document_files: List[FileInfo] = []


class ContractorProfileCreate(ContractorProfileBase):
    pass


class ContractorProfileUpdate(ContractorProfileBase):
    pass


class ContractorProfile(ContractorProfileBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RepairRequestBase(BaseModel):
    title: str
    description: str
    urgency: Optional[str] = None
    preferred_date: Optional[datetime] = None
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None


class RepairRequestCreate(RepairRequestBase):
    pass


class RepairRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    urgency: Optional[str] = None
    preferred_date: Optional[datetime] = None
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    equipment_type: Optional[str] = None
    equipment_brand: Optional[str] = None
    equipment_model: Optional[str] = None
    problem_description: Optional[str] = None
    estimated_cost: Optional[int] = None
    status: Optional[str] = None
    service_engineer_id: Optional[int] = None
    assigned_contractor_id: Optional[int] = None


class RepairRequest(RepairRequestBase):
    id: int
    customer_id: int
    equipment_type: Optional[str] = None
    equipment_brand: Optional[str] = None
    equipment_model: Optional[str] = None
    problem_description: Optional[str] = None
    estimated_cost: Optional[int] = None
    status: str
    service_engineer_id: Optional[int] = None
    assigned_contractor_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    processed_at: Optional[datetime] = None
    assigned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContractorResponseBase(BaseModel):
    proposed_cost: Optional[int] = None
    estimated_days: Optional[int] = None
    comment: Optional[str] = None


class ContractorResponseCreate(ContractorResponseBase):
    pass


class ContractorResponseUpdate(BaseModel):
    proposed_cost: Optional[int] = None
    estimated_days: Optional[int] = None
    comment: Optional[str] = None
    status: Optional[str] = None


class ContractorResponse(ContractorResponseBase):
    id: int
    request_id: int
    contractor_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CustomerRegistration(BaseModel):
    # Данные пользователя
    email: str
    password: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    phone: Optional[str] = None

    # Данные компании
    company_name: str
    contact_person: str
    company_phone: str
    company_email: str
    address: Optional[str] = None
    inn: Optional[str] = None
    kpp: Optional[str] = None
    ogrn: Optional[str] = None


class ContractorRegistration(BaseModel):
    # Данные пользователя
    email: str
    password: str
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    phone: Optional[str] = None

    # Паспортные данные
    passport_series: Optional[str] = None
    passport_number: Optional[str] = None
    passport_issued_by: Optional[str] = None
    passport_issued_date: Optional[datetime] = None
    passport_division_code: Optional[str] = None

    # Адрес
    registration_address: Optional[str] = None

    # Профессиональные данные
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[str] = None


class TelegramNotificationBase(BaseModel):
    notification_type: str
    message: str


class TelegramNotificationCreate(TelegramNotificationBase):
    user_id: int
    request_id: Optional[int] = None
    response_id: Optional[int] = None


class TelegramNotification(TelegramNotificationBase):
    id: int
    user_id: int
    request_id: Optional[int] = None
    response_id: Optional[int] = None
    sent: bool
    created_at: datetime
    sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Схемы для Telegram бота
class TelegramBotBase(BaseModel):
    name: str
    token: str
    is_active: bool = True
    webhook_url: Optional[str] = None


class TelegramBotCreate(TelegramBotBase):
    pass


class TelegramBotUpdate(BaseModel):
    name: Optional[str] = None
    token: Optional[str] = None
    is_active: Optional[bool] = None
    webhook_url: Optional[str] = None


class TelegramBot(TelegramBotBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TelegramUserBase(BaseModel):
    user_id: int
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_bot_user: bool = False


class TelegramUserCreate(TelegramUserBase):
    pass


class TelegramUserUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_bot_user: Optional[bool] = None


class TelegramUser(TelegramUserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: User

    class Config:
        from_attributes = True


class TelegramNotificationBase(BaseModel):
    telegram_user_id: int
    message_type: str
    message_text: str
    message_id: Optional[int] = None
    chat_id: int
    repair_request_id: Optional[int] = None
    is_read: bool = False


class TelegramNotificationCreate(TelegramNotificationBase):
    pass


class TelegramNotificationUpdate(BaseModel):
    message_id: Optional[int] = None
    is_read: Optional[bool] = None


class TelegramNotification(TelegramNotificationBase):
    id: int
    created_at: datetime
    telegram_user: TelegramUser
    repair_request: Optional[RepairRequest] = None

    class Config:
        from_attributes = True


class TelegramWebhookUpdate(BaseModel):
    """Схема для обновления webhook"""
    url: str


class TelegramBotCommand(BaseModel):
    """Схема для команд бота"""
    command: str
    description: str
