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
    prefix: Optional[str] = "АГБ"  # Префикс для генерации username


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


class EventCreate(EventBase):
    @validator('start_datetime', 'end_datetime')
    def validate_future_date(cls, v):
        if v.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
            raise ValueError('Дата события должна быть в будущем')
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
    is_active: Optional[bool] = None


class Event(EventBase):
    id: int
    creator_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

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
