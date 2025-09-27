"""
Утилиты для API v3
"""

import os
import hashlib
from typing import List, Optional, Dict, Any
from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from fastapi import HTTPException, status
from .models import Role, RolePermission, UserRole as UserRoleV3
from ..v1.dependencies import get_current_user
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import json


# Шифрование данных
class EncryptionManager:
    """Менеджер шифрования для безопасного хранения данных"""
    
    def __init__(self):
        self.key = os.getenv('ENCRYPTION_KEY')
        if not self.key:
            # В продакшене это должно быть из переменных окружения
            self.key = Fernet.generate_key()
        
        if isinstance(self.key, str):
            self.key = self.key.encode()
            
        self.cipher_suite = Fernet(self.key)
    
    def encrypt(self, data: str) -> str:
        """Шифрует строку"""
        return self.cipher_suite.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Расшифровывает строку"""
        try:
            return self.cipher_suite.decrypt(encrypted_data.encode()).decode()
        except Exception:
            return encrypted_data  # Возвращаем как есть, если не удалось расшифровать


encryption_manager = EncryptionManager()


# Управление разрешениями
class PermissionManager:
    """Менеджер разрешений пользователей"""
    
    @staticmethod
    async def get_user_permissions(db: AsyncSession, user_id: int) -> List[str]:
        """Получает все разрешения пользователя"""
        query = select(RolePermission.permission).join(
            UserRoleV3, RolePermission.role_id == UserRoleV3.role_id
        ).join(
            Role, Role.id == UserRoleV3.role_id
        ).where(
            and_(
                UserRoleV3.user_id == user_id,
                UserRoleV3.is_active == True,
                Role.is_active == True,
                RolePermission.granted == True
            )
        )
        
        result = await db.execute(query)
        return [row[0] for row in result.fetchall()]
    
    @staticmethod
    async def user_has_permission(db: AsyncSession, user_id: int, permission: str) -> bool:
        """Проверяет, есть ли у пользователя определенное разрешение"""
        permissions = await PermissionManager.get_user_permissions(db, user_id)
        return permission in permissions or "admin.full_access" in permissions
    
    @staticmethod
    async def require_permission(db: AsyncSession, user_id: int, permission: str):
        """Проверяет разрешение и выбрасывает исключение, если его нет"""
        if not await PermissionManager.user_has_permission(db, user_id, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Недостаточно прав для выполнения операции. Требуется разрешение: {permission}"
            )


# Email утилиты
class EmailManager:
    """Менеджер отправки email"""
    
    @staticmethod
    async def send_email(
        smtp_server: str,
        smtp_port: int,
        username: str,
        password: str,
        use_tls: bool,
        use_ssl: bool,
        from_email: str,
        from_name: Optional[str],
        to_email: str,
        subject: str,
        body: str,
        is_html: bool = False
    ) -> bool:
        """Отправляет email"""
        try:
            # Создаем сообщение
            msg = MimeMultipart()
            msg['From'] = f"{from_name} <{from_email}>" if from_name else from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Добавляем тело сообщения
            body_type = 'html' if is_html else 'plain'
            msg.attach(MimeText(body, body_type, 'utf-8'))
            
            # Подключаемся к серверу
            if use_ssl:
                server = smtplib.SMTP_SSL(smtp_server, smtp_port)
            else:
                server = smtplib.SMTP(smtp_server, smtp_port)
                if use_tls:
                    server.starttls()
            
            # Авторизуемся
            server.login(username, password)
            
            # Отправляем
            server.send_message(msg)
            server.quit()
            
            return True
            
        except Exception as e:
            print(f"Ошибка отправки email: {e}")
            return False


# Логирование активности
class ActivityLogger:
    """Логирование активности пользователей"""
    
    @staticmethod
    async def log_activity(
        db: AsyncSession,
        user_id: int,
        action: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ):
        """Записывает активность пользователя"""
        from .models import UserActivity
        
        activity = UserActivity(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        db.add(activity)
        await db.commit()


# Валидация настроек
class SettingsValidator:
    """Валидатор настроек"""
    
    @staticmethod
    def validate_email_settings(settings: Dict[str, Any]) -> Dict[str, str]:
        """Валидирует настройки email"""
        errors = {}
        
        if not settings.get('smtp_server'):
            errors['smtp_server'] = 'SMTP сервер обязателен'
        
        if not settings.get('smtp_port') or not (1 <= settings['smtp_port'] <= 65535):
            errors['smtp_port'] = 'Порт должен быть от 1 до 65535'
        
        if not settings.get('username'):
            errors['username'] = 'Имя пользователя обязательно'
        
        if not settings.get('password'):
            errors['password'] = 'Пароль обязателен'
        
        if not settings.get('from_email'):
            errors['from_email'] = 'Email отправителя обязателен'
        
        return errors
    
    @staticmethod
    def validate_api_key_settings(settings: Dict[str, Any]) -> Dict[str, str]:
        """Валидирует настройки API ключа"""
        errors = {}
        
        if not settings.get('service_name'):
            errors['service_name'] = 'Название сервиса обязательно'
        
        if not settings.get('key_name'):
            errors['key_name'] = 'Название ключа обязательно'
        
        if not settings.get('api_key') or len(settings['api_key']) < 10:
            errors['api_key'] = 'API ключ должен содержать минимум 10 символов'
        
        return errors


# Утилиты для работы с ролями
class RoleManager:
    """Менеджер ролей"""
    
    @staticmethod
    async def create_default_roles(db: AsyncSession):
        """Создает роли по умолчанию"""
        from .models import Role, RolePermission, SystemPermission
        
        default_roles = [
            {
                'name': 'super_admin',
                'display_name': 'Супер администратор',
                'description': 'Полный доступ ко всем функциям системы',
                'is_system': True,
                'color': '#dc2626',
                'permissions': [SystemPermission.ADMIN_FULL_ACCESS]
            },
            {
                'name': 'admin',
                'display_name': 'Администратор',
                'description': 'Управление пользователями и основными настройками',
                'is_system': True,
                'color': '#ea580c',
                'permissions': [
                    SystemPermission.USER_CREATE,
                    SystemPermission.USER_READ,
                    SystemPermission.USER_UPDATE,
                    SystemPermission.USER_MANAGE_ROLES,
                    SystemPermission.ROLE_READ,
                    SystemPermission.SETTINGS_READ,
                    SystemPermission.SETTINGS_UPDATE,
                    SystemPermission.NOTIFICATIONS_SEND,
                    SystemPermission.ANALYTICS_READ,
                ]
            },
            {
                'name': 'manager',
                'display_name': 'Менеджер',
                'description': 'Управление пользователями в своем подразделении',
                'is_system': True,
                'color': '#2563eb',
                'permissions': [
                    SystemPermission.USER_READ,
                    SystemPermission.USER_UPDATE,
                    SystemPermission.NOTIFICATIONS_SEND,
                ]
            },
            {
                'name': 'user',
                'display_name': 'Пользователь',
                'description': 'Базовые права пользователя',
                'is_system': True,
                'color': '#16a34a',
                'permissions': [
                    SystemPermission.USER_READ,
                ]
            }
        ]
        
        for role_data in default_roles:
            # Проверяем, существует ли роль
            existing_role = await db.execute(
                select(Role).where(Role.name == role_data['name'])
            )
            if existing_role.scalar_one_or_none():
                continue
            
            # Создаем роль
            permissions_data = role_data.pop('permissions', [])
            role = Role(**role_data)
            db.add(role)
            await db.flush()
            
            # Добавляем разрешения
            for permission in permissions_data:
                role_permission = RolePermission(
                    role_id=role.id,
                    permission=permission.value,
                    granted=True
                )
                db.add(role_permission)
        
        await db.commit()


# Утилиты для работы с JSON
def safe_json_loads(data: str, default: Any = None) -> Any:
    """Безопасно парсит JSON"""
    try:
        return json.loads(data)
    except (json.JSONDecodeError, TypeError):
        return default


def safe_json_dumps(data: Any) -> str:
    """Безопасно сериализует в JSON"""
    try:
        return json.dumps(data, ensure_ascii=False, default=str)
    except (TypeError, ValueError):
        return "{}"
