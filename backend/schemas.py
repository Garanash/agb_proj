from pydantic import BaseModel, EmailStr, validator
from datetime import datetime, timezone
from typing import Optional
from models import UserRole, NewsCategory, EventType, Permission


class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    middle_name: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    password: str
    role: Optional[UserRole] = UserRole.employee
    prefix: Optional[str] = "AGB"  # Префикс для генерации username


class UserUpdate(BaseModel):
    # username нельзя изменять
    email: Optional[EmailStr] = None
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
    email: Optional[EmailStr] = None
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
    employees: list[User] = []
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
    users: list[User] = []
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
    start_datetime: datetime
    end_datetime: datetime
    event_type: EventType
    is_public: bool = False  # Общее событие для всех пользователей


class EventCreate(EventBase):
    participants: list[int] = []  # Список ID пользователей-участников

    @validator('start_datetime', 'end_datetime')
    def validate_future_date(cls, v):
        # Убираем строгую проверку на будущую дату, так как пользователи могут создавать события на сегодня
        # if v.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
        #     raise ValueError('Дата события должна быть в будущем')
        return v
    
    @validator('end_datetime')
    def validate_end_after_start(cls, v, values):
        if 'start_datetime' in values and v <= values['start_datetime']:
            raise ValueError('Дата окончания должна быть после даты начала')
        return v


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    event_type: Optional[EventType] = None
    is_public: Optional[bool] = None
    is_active: Optional[bool] = None
    participants: Optional[list[int]] = None


class EventParticipant(BaseModel):
    id: int
    event_id: int
    user_id: int
    created_at: datetime
    user: User

    class Config:
        from_attributes = True


class Event(EventBase):
    id: int
    creator_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    participants: list[EventParticipant] = []

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
    permissions: list[Permission] = []


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    permissions: Optional[list[Permission]] = None


class Role(RoleBase):
    id: int
    is_system: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    permissions: list[Permission] = []

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
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRoomBase(BaseModel):
    name: str


class ChatRoomCreate(ChatRoomBase):
    pass


class ChatRoomUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class ChatRoomParticipantBase(BaseModel):
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


class ChatRoomParticipantCreate(ChatRoomParticipantBase):
    pass


class ChatMessageBase(BaseModel):
    content: str


class ChatMessageCreate(ChatMessageBase):
    pass


class ChatMessageUpdate(BaseModel):
    content: str


class ChatMessage(ChatMessageBase):
    id: int
    chat_room_id: int
    sender_id: Optional[int] = None
    bot_id: Optional[int] = None
    is_edited: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: int
    chat_room_id: int
    sender_id: Optional[int] = None
    bot_id: Optional[int] = None
    content: str
    is_edited: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SystemMessage(BaseModel):
    id: int
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRoomParticipant(ChatRoomParticipantBase):
    id: int
    chat_room_id: int
    user_id: Optional[int] = None
    bot_id: Optional[int] = None
    is_admin: bool
    joined_at: datetime

    class Config:
        from_attributes = True


class ChatRoomParticipantResponse(BaseModel):
    id: int
    chat_room_id: int
    user_id: Optional[int] = None
    bot_id: Optional[int] = None
    is_admin: bool
    joined_at: datetime

    class Config:
        from_attributes = True


class ChatRoom(ChatRoomBase):
    id: int
    creator_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: User
    participants: list[ChatRoomParticipant] = []
    messages: list[ChatMessage] = []

    class Config:
        from_attributes = True


class ChatRoomCreateResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_private: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator_id: int
    folders: list[ChatRoomFolder] = []  # Добавляем папки

    class Config:
        from_attributes = True


class ChatRoomDetailResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    creator_id: int
    is_private: bool
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    participants: list[ChatRoomParticipant] = []
    messages: list[ChatMessage] = []

    class Config:
        from_attributes = True
