"""
Схемы для API v3
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


class SystemPermissionSchema(str, Enum):
    """Системные разрешения"""
    USER_CREATE = "user.create"
    USER_READ = "user.read"
    USER_UPDATE = "user.update"
    USER_DELETE = "user.delete"
    USER_MANAGE_ROLES = "user.manage_roles"
    ROLE_CREATE = "role.create"
    ROLE_READ = "role.read"
    ROLE_UPDATE = "role.update"
    ROLE_DELETE = "role.delete"
    SETTINGS_READ = "settings.read"
    SETTINGS_UPDATE = "settings.update"
    SETTINGS_MANAGE_API_KEYS = "settings.manage_api_keys"
    SETTINGS_MANAGE_EMAIL = "settings.manage_email"
    NOTIFICATIONS_SEND = "notifications.send"
    NOTIFICATIONS_MANAGE = "notifications.manage"
    ANALYTICS_READ = "analytics.read"
    LOGS_READ = "logs.read"
    ADMIN_FULL_ACCESS = "admin.full_access"
    SYSTEM_MAINTENANCE = "system.maintenance"


# Схемы для ролей
class RolePermissionBase(BaseModel):
    permission: SystemPermissionSchema
    granted: bool = True


class RolePermissionCreate(RolePermissionBase):
    pass


class RolePermissionResponse(RolePermissionBase):
    id: int
    role_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class RoleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    display_name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, regex=r'^#[0-9A-Fa-f]{6}$')
    is_active: bool = True


class RoleCreate(RoleBase):
    permissions: List[RolePermissionCreate] = []


class RoleUpdate(BaseModel):
    display_name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    color: Optional[str] = Field(None, regex=r'^#[0-9A-Fa-f]{6}$')
    is_active: Optional[bool] = None
    permissions: Optional[List[RolePermissionCreate]] = None


class RoleResponse(RoleBase):
    id: int
    is_system: bool
    created_at: datetime
    updated_at: Optional[datetime]
    permissions: List[RolePermissionResponse] = []

    class Config:
        from_attributes = True


# Схемы для пользователей
class UserRoleAssignment(BaseModel):
    user_id: int
    role_id: int
    expires_at: Optional[datetime] = None


class UserRoleResponse(BaseModel):
    id: int
    role: RoleResponse
    assigned_by: Optional[int] = None
    assigned_at: datetime
    expires_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True


class UserDetailedResponse(BaseModel):
    """Детальная информация о пользователе"""
    id: int
    username: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_password_changed: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Роли пользователя
    roles: List[UserRoleResponse] = []
    
    # Профили
    customer_profile: Optional[Dict[str, Any]] = None
    contractor_profile: Optional[Dict[str, Any]] = None
    
    # Статистика активности
    last_login: Optional[datetime] = None
    login_count: Optional[int] = 0

    class Config:
        from_attributes = True


class UserUpdateV3(BaseModel):
    """Обновление пользователя в v3"""
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    is_active: Optional[bool] = None
    roles: Optional[List[int]] = None  # ID ролей


# Схемы для настроек email
class EmailSettingsBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    smtp_server: str = Field(..., min_length=3, max_length=255)
    smtp_port: int = Field(..., ge=1, le=65535)
    username: str = Field(..., min_length=1, max_length=255)
    use_tls: bool = True
    use_ssl: bool = False
    from_email: EmailStr
    from_name: Optional[str] = None
    is_active: bool = True
    is_default: bool = False


class EmailSettingsCreate(EmailSettingsBase):
    password: str = Field(..., min_length=1)


class EmailSettingsUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    smtp_server: Optional[str] = Field(None, min_length=3, max_length=255)
    smtp_port: Optional[int] = Field(None, ge=1, le=65535)
    username: Optional[str] = Field(None, min_length=1, max_length=255)
    password: Optional[str] = Field(None, min_length=1)
    use_tls: Optional[bool] = None
    use_ssl: Optional[bool] = None
    from_email: Optional[EmailStr] = None
    from_name: Optional[str] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class EmailSettingsResponse(EmailSettingsBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Схемы для API ключей
class ApiKeySettingsBase(BaseModel):
    service_name: str = Field(..., min_length=2, max_length=50)
    key_name: str = Field(..., min_length=2, max_length=100)
    additional_config: Optional[Dict[str, Any]] = None
    is_active: bool = True
    is_default: bool = False


class ApiKeySettingsCreate(ApiKeySettingsBase):
    api_key: str = Field(..., min_length=10)


class ApiKeySettingsUpdate(BaseModel):
    key_name: Optional[str] = Field(None, min_length=2, max_length=100)
    api_key: Optional[str] = Field(None, min_length=10)
    additional_config: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None


class ApiKeySettingsResponse(ApiKeySettingsBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_used: Optional[datetime] = None
    # api_key не возвращаем по соображениям безопасности

    class Config:
        from_attributes = True


# Схемы для системных уведомлений
class NotificationBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    message: str = Field(..., min_length=1)
    notification_type: str = Field(..., regex=r'^(info|warning|error|success)$')
    target_users: Optional[List[int]] = None
    target_roles: Optional[List[int]] = None
    is_system_wide: bool = False
    priority: int = Field(1, ge=1, le=3)
    expires_at: Optional[datetime] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    message: Optional[str] = Field(None, min_length=1)
    notification_type: Optional[str] = Field(None, regex=r'^(info|warning|error|success)$')
    target_users: Optional[List[int]] = None
    target_roles: Optional[List[int]] = None
    is_system_wide: Optional[bool] = None
    priority: Optional[int] = Field(None, ge=1, le=3)
    expires_at: Optional[datetime] = None


class NotificationResponse(NotificationBase):
    id: int
    is_read: Dict[str, bool]
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True


# Схемы для системных настроек
class SystemSettingBase(BaseModel):
    category: str = Field(..., min_length=1, max_length=50)
    key: str = Field(..., min_length=1, max_length=100)
    value: Optional[str] = None
    data_type: str = Field("string", regex=r'^(string|int|bool|json)$')
    is_encrypted: bool = False
    is_public: bool = False
    description: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = None


class SystemSettingCreate(SystemSettingBase):
    pass


class SystemSettingUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None
    validation_rules: Optional[Dict[str, Any]] = None
    is_public: Optional[bool] = None


class SystemSettingResponse(SystemSettingBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Схемы для активности пользователей
class UserActivityResponse(BaseModel):
    id: int
    user_id: int
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# Схемы для тестирования email
class EmailTestRequest(BaseModel):
    email_settings_id: int
    to_email: EmailStr
    subject: str = "Тест настроек почты"
    body: str = "Это тестовое сообщение для проверки настроек почты."


# Общие схемы
class SuccessResponse(BaseModel):
    success: bool = True
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None
