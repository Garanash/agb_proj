"""
API v1 - Общие схемы и модели данных
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any, Dict, Union
from datetime import datetime
from enum import Enum

from .shared.constants import UserRoles, RequestStatus, FileTypes


class APIResponse(BaseModel):
    """Базовая схема ответа API"""
    success: bool = Field(default=True, description="Статус выполнения операции")
    message: Optional[str] = Field(None, description="Сообщение о результате операции")
    data: Optional[Any] = Field(None, description="Данные ответа")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat(), description="Временная метка")


class ErrorResponse(BaseModel):
    """Схема ошибки API"""
    success: bool = Field(default=False, description="Статус выполнения операции")
    error: str = Field(description="Описание ошибки")
    error_code: Optional[str] = Field(None, description="Код ошибки")
    details: Optional[Dict[str, Any]] = Field(None, description="Дополнительные детали ошибки")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat(), description="Временная метка")


class PaginationParams(BaseModel):
    """Параметры пагинации"""
    page: int = Field(default=1, ge=1, description="Номер страницы")
    size: int = Field(default=20, ge=1, le=100, description="Размер страницы")
    sort_by: Optional[str] = Field(None, description="Поле для сортировки")
    sort_order: str = Field(default="asc", description="Порядок сортировки (asc/desc)")
    
    @validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('Порядок сортировки должен быть asc или desc')
        return v


class PaginatedResponse(APIResponse):
    """Схема пагинированного ответа"""
    data: List[Any] = Field(description="Список данных")
    pagination: Dict[str, Any] = Field(description="Информация о пагинации")


class HealthCheckResponse(BaseModel):
    """Схема ответа проверки здоровья"""
    status: str = Field(description="Статус сервиса")
    service: str = Field(description="Название сервиса")
    database: str = Field(description="Статус базы данных")
    timestamp: datetime = Field(description="Временная метка")
    version: str = Field(default="1.0.0", description="Версия API")


class VersionInfo(BaseModel):
    """Информация о версии API"""
    version: str = Field(description="Версия API")
    name: str = Field(description="Название API")
    description: str = Field(description="Описание API")
    status: str = Field(description="Статус API")
    endpoints: List[str] = Field(description="Список доступных эндпоинтов")


# Схемы для пользователей
class UserBase(BaseModel):
    """Базовая схема пользователя"""
    username: str = Field(description="Имя пользователя")
    email: str = Field(description="Email адрес")
    first_name: str = Field(description="Имя")
    last_name: str = Field(description="Фамилия")
    phone: Optional[str] = Field(None, description="Номер телефона")
    role: str = Field(default=UserRoles.EMPLOYEE, description="Роль пользователя")
    is_active: bool = Field(default=True, description="Активен ли пользователь")


class UserCreate(UserBase):
    """Схема для создания пользователя"""
    password: str = Field(description="Пароль")
    
    @validator('email')
    def validate_email(cls, v):
        from .shared.utils import validate_email
        if not validate_email(v):
            raise ValueError('Некорректный формат email адреса')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        from .shared.utils import validate_password_strength
        is_valid, errors = validate_password_strength(v)
        if not is_valid:
            raise ValueError(f'Пароль не соответствует требованиям: {"; ".join(errors)}')
        return v


class UserUpdate(BaseModel):
    """Схема для обновления пользователя"""
    username: Optional[str] = Field(None, description="Имя пользователя")
    email: Optional[str] = Field(None, description="Email адрес")
    first_name: Optional[str] = Field(None, description="Имя")
    last_name: Optional[str] = Field(None, description="Фамилия")
    phone: Optional[str] = Field(None, description="Номер телефона")
    role: Optional[str] = Field(None, description="Роль пользователя")
    is_active: Optional[bool] = Field(None, description="Активен ли пользователь")
    
    @validator('email')
    def validate_email(cls, v):
        if v is not None:
            from .shared.utils import validate_email
            if not validate_email(v):
                raise ValueError('Некорректный формат email адреса')
        return v


class UserResponse(UserBase):
    """Схема ответа с информацией о пользователе"""
    id: int = Field(description="ID пользователя")
    created_at: str = Field(description="Дата создания")
    last_login: Optional[str] = Field(None, description="Последний вход")


# Схемы для аутентификации
class LoginRequest(BaseModel):
    """Схема запроса входа"""
    username: str = Field(description="Имя пользователя")
    password: str = Field(description="Пароль")


class LoginResponse(BaseModel):
    """Схема ответа входа"""
    access_token: str = Field(description="Токен доступа")
    token_type: str = Field(default="bearer", description="Тип токена")
    expires_in: int = Field(description="Время жизни токена в секундах")
    user: UserResponse = Field(description="Информация о пользователе")


class RegisterRequest(BaseModel):
    """Схема запроса регистрации"""
    username: str = Field(description="Имя пользователя")
    email: str = Field(description="Email адрес")
    password: str = Field(description="Пароль")
    first_name: str = Field(description="Имя")
    last_name: str = Field(description="Фамилия")
    phone: Optional[str] = Field(None, description="Номер телефона")


# Схемы для файлов
class FileUpload(BaseModel):
    """Схема загрузки файла"""
    filename: str = Field(description="Имя файла")
    content_type: str = Field(description="MIME тип файла")
    size: int = Field(description="Размер файла в байтах")
    file_type: str = Field(description="Тип файла")
    
    @validator('file_type')
    def validate_file_type(cls, v):
        if v not in [FileTypes.IMAGE, FileTypes.DOCUMENT, FileTypes.ARCHIVE, FileTypes.AUDIO, FileTypes.VIDEO]:
            raise ValueError('Неподдерживаемый тип файла')
        return v


class FileResponse(BaseModel):
    """Схема ответа с информацией о файле"""
    id: int = Field(description="ID файла")
    filename: str = Field(description="Имя файла")
    original_filename: str = Field(description="Оригинальное имя файла")
    content_type: str = Field(description="MIME тип файла")
    size: int = Field(description="Размер файла в байтах")
    file_type: str = Field(description="Тип файла")
    url: str = Field(description="URL файла")
    created_at: str = Field(description="Дата загрузки")
    uploaded_by: int = Field(description="ID пользователя, загрузившего файл")
