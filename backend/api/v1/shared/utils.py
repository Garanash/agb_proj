from passlib.context import CryptContext
import re

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверка пароля"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Хеширование пароля"""
    return pwd_context.hash(password)

def validate_email(email: str) -> bool:
    """Валидация email адреса"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

from typing import Tuple, List

def validate_password_strength(password: str) -> Tuple[bool, List[str]]:
    """Проверка сложности пароля"""
    errors = []
    
    if len(password) < 8:
        errors.append("Пароль должен быть не менее 8 символов")
    
    if not any(c.isupper() for c in password):
        errors.append("Пароль должен содержать хотя бы одну заглавную букву")
    
    if not any(c.islower() for c in password):
        errors.append("Пароль должен содержать хотя бы одну строчную букву")
    
    if not any(c.isdigit() for c in password):
        errors.append("Пароль должен содержать хотя бы одну цифру")
    
    return len(errors) == 0, errors