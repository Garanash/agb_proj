"""
API v1 - Централизованная валидация
"""

from fastapi import HTTPException, status
from pydantic import BaseModel, validator, Field
from typing import Optional, List, Any, Dict, Union, Tuple
from datetime import datetime, date
import re

from .shared.constants import Security, FileTypes, MAX_FILE_SIZES, UserRoles
from .shared.exceptions import ValidationError, NotFoundError
from .shared.utils import validate_email, validate_phone, validate_password_strength


class BaseValidator:
    """Базовый класс для валидации"""
    
    @staticmethod
    def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> None:
        """Проверяет наличие обязательных полей"""
        missing_fields = [field for field in required_fields if field not in data or data[field] is None]
        if missing_fields:
            raise ValidationError(f"Обязательные поля не заполнены: {', '.join(missing_fields)}")
    
    @staticmethod
    def validate_string_length(value: str, min_length: int = 1, max_length: int = 255, field_name: str = "Поле") -> None:
        """Проверяет длину строки"""
        if not isinstance(value, str):
            raise ValidationError(f"{field_name} должно быть строкой")
        
        if len(value) < min_length:
            raise ValidationError(f"{field_name} должно содержать минимум {min_length} символов")
        
        if len(value) > max_length:
            raise ValidationError(f"{field_name} должно содержать максимум {max_length} символов")
    
    @staticmethod
    def validate_email_field(email: str) -> str:
        """Валидирует email адрес"""
        if not validate_email(email):
            raise ValidationError("Некорректный формат email адреса")
        return email
    
    @staticmethod
    def validate_phone_field(phone: str) -> str:
        """Валидирует номер телефона"""
        if not validate_phone(phone):
            raise ValidationError("Некорректный формат номера телефона")
        return phone
    
    @staticmethod
    def validate_password_field(password: str) -> str:
        """Валидирует пароль"""
        is_valid, errors = validate_password_strength(password)
        if not is_valid:
            raise ValidationError(f"Пароль не соответствует требованиям: {'; '.join(errors)}")
        return password
    
    @staticmethod
    def validate_role_field(role: str) -> str:
        """Валидирует роль пользователя"""
        if role not in [UserRoles.ADMIN, UserRoles.MANAGER, UserRoles.EMPLOYEE, UserRoles.CONTRACTOR, UserRoles.CUSTOMER, UserRoles.SECURITY, UserRoles.HR]:
            raise ValidationError("Некорректная роль пользователя")
        return role
    
    @staticmethod
    def validate_id_field(user_id: int, field_name: str = "ID") -> int:
        """Валидирует ID"""
        if not isinstance(user_id, int) or user_id < 1:
            raise ValidationError(f"{field_name} должен быть положительным числом")
        return user_id
    
    @staticmethod
    def validate_pagination_params(page: int, size: int) -> Tuple[int, int]:
        """Валидирует параметры пагинации"""
        if page < 1:
            raise ValidationError("Номер страницы должен быть больше 0")
        
        if size < 1 or size > 100:
            raise ValidationError("Размер страницы должен быть от 1 до 100")
        
        return page, size
    
    @staticmethod
    def validate_date_range(date_from: Optional[date], date_to: Optional[date]) -> None:
        """Валидирует диапазон дат"""
        if date_from and date_to and date_from > date_to:
            raise ValidationError("Дата начала не может быть больше даты окончания")
    
    @staticmethod
    def validate_file_upload(filename: str, file_size: int, file_type: str) -> None:
        """Валидирует загрузку файла"""
        # Проверяем тип файла
        if file_type not in [FileTypes.IMAGE, FileTypes.DOCUMENT, FileTypes.ARCHIVE, FileTypes.AUDIO, FileTypes.VIDEO]:
            raise ValidationError("Неподдерживаемый тип файла")
        
        # Проверяем размер файла
        max_size = MAX_FILE_SIZES.get(file_type, 10 * 1024 * 1024)
        if file_size > max_size:
            raise ValidationError(f"Файл слишком большой. Максимальный размер: {max_size // (1024*1024)}MB")
        
        # Проверяем расширение файла
        from .shared.constants import ALLOWED_EXTENSIONS
        file_ext = '.' + filename.split('.')[-1].lower() if '.' in filename else ''
        if file_ext not in ALLOWED_EXTENSIONS.get(file_type, []):
            raise ValidationError(f"Неподдерживаемое расширение файла. Разрешены: {', '.join(ALLOWED_EXTENSIONS.get(file_type, []))}")


class UserValidator(BaseValidator):
    """Валидатор для пользователей"""
    
    @staticmethod
    def validate_user_creation(data: Dict[str, Any]) -> Dict[str, Any]:
        """Валидирует данные для создания пользователя"""
        required_fields = ["username", "email", "password", "first_name", "last_name"]
        BaseValidator.validate_required_fields(data, required_fields)
        
        # Валидируем каждое поле
        BaseValidator.validate_string_length(data["username"], 3, 50, "Имя пользователя")
        BaseValidator.validate_string_length(data["first_name"], 2, 100, "Имя")
        BaseValidator.validate_string_length(data["last_name"], 2, 100, "Фамилия")
        
        # Валидируем email и пароль
        data["email"] = BaseValidator.validate_email_field(data["email"])
        data["password"] = BaseValidator.validate_password_field(data["password"])
        
        # Валидируем роль если указана
        if "role" in data and data["role"]:
            data["role"] = BaseValidator.validate_role_field(data["role"])
        
        # Валидируем телефон если указан
        if "phone" in data and data["phone"]:
            data["phone"] = BaseValidator.validate_phone_field(data["phone"])
        
        return data
    
    @staticmethod
    def validate_user_update(data: Dict[str, Any]) -> Dict[str, Any]:
        """Валидирует данные для обновления пользователя"""
        # Проверяем что хотя бы одно поле для обновления указано
        if not any(data.values()):
            raise ValidationError("Необходимо указать хотя бы одно поле для обновления")
        
        # Валидируем каждое поле если оно указано
        if "username" in data and data["username"]:
            BaseValidator.validate_string_length(data["username"], 3, 50, "Имя пользователя")
        
        if "first_name" in data and data["first_name"]:
            BaseValidator.validate_string_length(data["first_name"], 2, 100, "Имя")
        
        if "last_name" in data and data["last_name"]:
            BaseValidator.validate_string_length(data["last_name"], 2, 100, "Фамилия")
        
        if "email" in data and data["email"]:
            data["email"] = BaseValidator.validate_email_field(data["email"])
        
        if "phone" in data and data["phone"]:
            data["phone"] = BaseValidator.validate_phone_field(data["phone"])
        
        if "role" in data and data["role"]:
            data["role"] = BaseValidator.validate_role_field(data["role"])
        
        return data


class AuthValidator(BaseValidator):
    """Валидатор для аутентификации"""
    
    @staticmethod
    def validate_login_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Валидирует данные для входа"""
        required_fields = ["username", "password"]
        BaseValidator.validate_required_fields(data, required_fields)
        
        BaseValidator.validate_string_length(data["username"], 3, 50, "Имя пользователя")
        BaseValidator.validate_string_length(data["password"], Security.PASSWORD_MIN_LENGTH, 255, "Пароль")
        
        return data
    
    @staticmethod
    def validate_registration_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Валидирует данные для регистрации"""
        required_fields = ["username", "email", "password", "first_name", "last_name"]
        BaseValidator.validate_required_fields(data, required_fields)
        
        # Используем валидатор пользователей
        return UserValidator.validate_user_creation(data)
    
    @staticmethod
    def validate_password_reset_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Валидирует данные для сброса пароля"""
        required_fields = ["email"]
        BaseValidator.validate_required_fields(data, required_fields)
        
        data["email"] = BaseValidator.validate_email_field(data["email"])
        
        return data


class SearchValidator(BaseValidator):
    """Валидатор для поиска"""
    
    @staticmethod
    def validate_search_params(data: Dict[str, Any]) -> Dict[str, Any]:
        """Валидирует параметры поиска"""
        if "query" in data and data["query"]:
            BaseValidator.validate_string_length(data["query"], 2, 255, "Поисковый запрос")
        
        if "page" in data and "size" in data:
            BaseValidator.validate_pagination_params(data["page"], data["size"])
        
        if "date_from" in data and "date_to" in data:
            BaseValidator.validate_date_range(data["date_from"], data["date_to"])
        
        return data


class FileValidator(BaseValidator):
    """Валидатор для файлов"""
    
    @staticmethod
    def validate_file_upload_data(data: Dict[str, Any]) -> Dict[str, Any]:
        """Валидирует данные для загрузки файла"""
        required_fields = ["filename", "file_size", "file_type"]
        BaseValidator.validate_required_fields(data, required_fields)
        
        BaseValidator.validate_file_upload(
            data["filename"],
            data["file_size"],
            data["file_type"]
        )
        
        return data


class BusinessLogicValidator:
    """Валидатор бизнес-логики"""
    
    @staticmethod
    def validate_user_permissions(user_id: int, required_permission: str) -> bool:
        """Проверяет права пользователя"""
        # Здесь должна быть логика проверки прав в базе данных
        # Пока что заглушка
        return True
    
    @staticmethod
    def validate_resource_access(user_id: int, resource_id: int, resource_type: str) -> bool:
        """Проверяет доступ к ресурсу"""
        # Здесь должна быть логика проверки доступа к ресурсу
        # Пока что заглушка
        return True
    
    @staticmethod
    def validate_workflow_state(current_state: str, target_state: str) -> bool:
        """Проверяет возможность перехода между состояниями workflow"""
        # Здесь должна быть логика проверки состояний workflow
        # Пока что заглушка
        return True


# Декоратор для валидации
def validate_request(validator_class, method_name: str):
    """Декоратор для валидации запросов"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Извлекаем данные из kwargs
            data = {k: v for k, v in kwargs.items() if v is not None}
            
            # Валидируем данные
            validator_method = getattr(validator_class, method_name)
            validated_data = validator_method(data)
            
            # Обновляем kwargs с валидированными данными
            kwargs.update(validated_data)
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator
