"""
Расширенные модели для API v3
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func, Text, JSON
from sqlalchemy.orm import relationship
from database import Base
import enum
from typing import List, Optional


class SystemPermission(str, enum.Enum):
    """Системные разрешения"""
    # Управление пользователями
    USER_CREATE = "user.create"
    USER_READ = "user.read"
    USER_UPDATE = "user.update"
    USER_DELETE = "user.delete"
    USER_MANAGE_ROLES = "user.manage_roles"
    
    # Управление ролями
    ROLE_CREATE = "role.create"
    ROLE_READ = "role.read"
    ROLE_UPDATE = "role.update"
    ROLE_DELETE = "role.delete"
    
    # Настройки системы
    SETTINGS_READ = "settings.read"
    SETTINGS_UPDATE = "settings.update"
    SETTINGS_MANAGE_API_KEYS = "settings.manage_api_keys"
    SETTINGS_MANAGE_EMAIL = "settings.manage_email"
    
    # Управление уведомлениями
    NOTIFICATIONS_SEND = "notifications.send"
    NOTIFICATIONS_MANAGE = "notifications.manage"
    
    # Аналитика и логи
    ANALYTICS_READ = "analytics.read"
    LOGS_READ = "logs.read"
    
    # Администрирование
    ADMIN_FULL_ACCESS = "admin.full_access"
    SYSTEM_MAINTENANCE = "system.maintenance"


class Role(Base):
    """Роли в системе с детальными разрешениями"""
    __tablename__ = "roles_v3"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String, nullable=False)  # Отображаемое имя
    description = Column(Text, nullable=True)
    is_system = Column(Boolean, default=False)  # Системная роль (нельзя удалить)
    is_active = Column(Boolean, default=True)
    color = Column(String, nullable=True)  # Цвет для UI
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    user_roles = relationship("UserRole", back_populates="role")
    

class RolePermission(Base):
    """Разрешения роли"""
    __tablename__ = "role_permissions_v3"
    
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles_v3.id"), nullable=False)
    permission = Column(String, nullable=False)  # SystemPermission enum value
    granted = Column(Boolean, default=True)  # Разрешено или запрещено
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Связи
    role = relationship("Role", back_populates="permissions")


class UserRole(Base):
    """Роли пользователей (многие ко многим)"""
    __tablename__ = "user_roles_v3"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles_v3.id"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Кто назначил
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Срок действия
    is_active = Column(Boolean, default=True)
    
    # Связи
    user = relationship("User", foreign_keys=[user_id])
    role = relationship("Role", back_populates="user_roles")
    assigned_by_user = relationship("User", foreign_keys=[assigned_by])


class EmailSettings(Base):
    """Настройки почтового сервера"""
    __tablename__ = "email_settings_v3"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Название конфигурации
    smtp_server = Column(String, nullable=False)
    smtp_port = Column(Integer, nullable=False)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)  # Зашифрованный пароль
    use_tls = Column(Boolean, default=True)
    use_ssl = Column(Boolean, default=False)
    from_email = Column(String, nullable=False)
    from_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ApiKeySettings(Base):
    """Настройки API ключей для различных сервисов"""
    __tablename__ = "api_key_settings_v3"
    
    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String, nullable=False, index=True)  # openai, telegram, etc.
    key_name = Column(String, nullable=False)  # Название ключа
    api_key = Column(String, nullable=False)  # Зашифрованный ключ
    additional_config = Column(JSON, nullable=True)  # Дополнительные настройки
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_used = Column(DateTime(timezone=True), nullable=True)
    
    # Связи
    creator = relationship("User")


class SystemNotification(Base):
    """Системные уведомления"""
    __tablename__ = "system_notifications_v3"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, nullable=False)  # info, warning, error, success
    target_users = Column(JSON, nullable=True)  # ID пользователей или null для всех
    target_roles = Column(JSON, nullable=True)  # ID ролей
    is_read = Column(JSON, default=dict)  # {user_id: is_read}
    is_system_wide = Column(Boolean, default=False)
    priority = Column(Integer, default=1)  # 1-низкий, 2-средний, 3-высокий
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Связи
    creator = relationship("User")


class UserActivity(Base):
    """Лог активности пользователей"""
    __tablename__ = "user_activity_v3"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # login, logout, create, update, delete
    resource_type = Column(String, nullable=True)  # user, role, settings
    resource_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)  # Дополнительные данные
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Связи
    user = relationship("User")


class SystemSettings(Base):
    """Системные настройки приложения"""
    __tablename__ = "system_settings_v3"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, nullable=False, index=True)  # general, security, ui, etc.
    key = Column(String, nullable=False, index=True)
    value = Column(Text, nullable=True)
    data_type = Column(String, nullable=False, default="string")  # string, int, bool, json
    is_encrypted = Column(Boolean, default=False)
    is_public = Column(Boolean, default=False)  # Доступно ли для фронтенда
    description = Column(Text, nullable=True)
    validation_rules = Column(JSON, nullable=True)  # Правила валидации
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
