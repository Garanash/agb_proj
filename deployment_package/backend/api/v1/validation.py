"""
API v1 - Валидация и проверки
"""

from fastapi import HTTPException, status
from pydantic import BaseModel, validator
from typing import Optional, List, Any
import re
from datetime import datetime, date


class PaginationParams(BaseModel):
    """Параметры пагинации с валидацией"""
    page: int = 1
    size: int = 20
    sort_by: Optional[str] = None
    sort_order: str = "asc"
    
    @validator('page')
    def validate_page(cls, v):
        if v < 1:
            raise ValueError('Страница должна быть больше 0')
        return v
    
    @validator('size')
    def validate_size(cls, v):
        if v < 1 or v > 100:
            raise ValueError('Размер страницы должен быть от 1 до 100')
        return v
    
    @validator('sort_order')
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('Порядок сортировки должен быть asc или desc')
        return v


class SearchParams(BaseModel):
    """Параметры поиска с валидацией"""
    query: Optional[str] = None
    filters: Optional[dict] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    
    @validator('query')
    def validate_query(cls, v):
        if v and len(v.strip()) < 2:
            raise ValueError('Поисковый запрос должен содержать минимум 2 символа')
        return v.strip() if v else None
    
    @validator('date_from', 'date_to')
    def validate_dates(cls, v):
        if v and v > date.today():
            raise ValueError('Дата не может быть в будущем')
        return v


class EmailValidator:
    """Валидатор email адресов"""
    
    EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    
    @classmethod
    def validate(cls, email: str) -> bool:
        return bool(cls.EMAIL_REGEX.match(email))
    
    @classmethod
    def validate_or_raise(cls, email: str) -> str:
        if not cls.validate(email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Некорректный формат email адреса"
            )
        return email


class PhoneValidator:
    """Валидатор телефонных номеров"""
    
    PHONE_REGEX = re.compile(r'^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$')
    
    @classmethod
    def validate(cls, phone: str) -> bool:
        return bool(cls.PHONE_REGEX.match(phone))
    
    @classmethod
    def validate_or_raise(cls, phone: str) -> str:
        if not cls.validate(phone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Некорректный формат номера телефона"
            )
        return phone


class PasswordValidator:
    """Валидатор паролей"""
    
    @classmethod
    def validate(cls, password: str) -> tuple[bool, List[str]]:
        errors = []
        
        if len(password) < 8:
            errors.append("Пароль должен содержать минимум 8 символов")
        
        if not re.search(r'[A-Z]', password):
            errors.append("Пароль должен содержать заглавные буквы")
        
        if not re.search(r'[a-z]', password):
            errors.append("Пароль должен содержать строчные буквы")
        
        if not re.search(r'\d', password):
            errors.append("Пароль должен содержать цифры")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            errors.append("Пароль должен содержать специальные символы")
        
        return len(errors) == 0, errors
    
    @classmethod
    def validate_or_raise(cls, password: str) -> str:
        is_valid, errors = cls.validate(password)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Пароль не соответствует требованиям: {'; '.join(errors)}"
            )
        return password


class FileValidator:
    """Валидатор файлов"""
    
    ALLOWED_EXTENSIONS = {
        'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        'document': ['.pdf', '.doc', '.docx', '.txt'],
        'archive': ['.zip', '.rar', '.7z']
    }
    
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    @classmethod
    def validate_extension(cls, filename: str, file_type: str) -> bool:
        if file_type not in cls.ALLOWED_EXTENSIONS:
            return False
        
        ext = '.' + filename.split('.')[-1].lower()
        return ext in cls.ALLOWED_EXTENSIONS[file_type]
    
    @classmethod
    def validate_size(cls, file_size: int) -> bool:
        return file_size <= cls.MAX_FILE_SIZE
    
    @classmethod
    def validate_file(cls, filename: str, file_size: int, file_type: str) -> None:
        if not cls.validate_extension(filename, file_type):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Неподдерживаемый тип файла. Разрешены: {', '.join(cls.ALLOWED_EXTENSIONS[file_type])}"
            )
        
        if not cls.validate_size(file_size):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Файл слишком большой. Максимальный размер: {cls.MAX_FILE_SIZE // (1024*1024)}MB"
            )


class BusinessLogicValidator:
    """Валидатор бизнес-логики"""
    
    @staticmethod
    def validate_date_range(date_from: Optional[date], date_to: Optional[date]) -> None:
        """Проверка корректности диапазона дат"""
        if date_from and date_to and date_from > date_to:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Дата начала не может быть больше даты окончания"
            )
    
    @staticmethod
    def validate_pagination(page: int, size: int, total: int) -> None:
        """Проверка корректности пагинации"""
        max_page = (total + size - 1) // size
        if page > max_page and total > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Страница {page} не существует. Максимальная страница: {max_page}"
            )
