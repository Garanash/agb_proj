"""
Утилиты для генерации надежных паролей
"""
import secrets
import string
from typing import List, Tuple


def generate_secure_password(length: int = 12) -> str:
    """
    Генерирует надежный пароль с заданной длиной
    
    Args:
        length: Длина пароля (минимум 8, максимум 32)
    
    Returns:
        str: Сгенерированный пароль
    """
    if length < 8:
        length = 8
    elif length > 32:
        length = 32
    
    # Определяем наборы символов
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    # Обеспечиваем наличие хотя бы одного символа из каждой категории
    password = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special_chars)
    ]
    
    # Заполняем оставшуюся длину случайными символами
    all_chars = lowercase + uppercase + digits + special_chars
    for _ in range(length - 4):
        password.append(secrets.choice(all_chars))
    
    # Перемешиваем символы
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)


def generate_human_readable_password(length: int = 10) -> str:
    """
    Генерирует пароль, более удобный для чтения человеком
    
    Args:
        length: Длина пароля (минимум 8, максимум 20)
    
    Returns:
        str: Сгенерированный пароль
    """
    if length < 8:
        length = 8
    elif length > 20:
        length = 20
    
    # Используем только буквы и цифры для лучшей читаемости
    chars = string.ascii_letters + string.digits
    
    # Обеспечиваем наличие хотя бы одной заглавной буквы и одной цифры
    password = [
        secrets.choice(string.ascii_uppercase),
        secrets.choice(string.digits)
    ]
    
    # Заполняем оставшуюся длину
    for _ in range(length - 2):
        password.append(secrets.choice(chars))
    
    # Перемешиваем символы
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)


def validate_password_strength(password: str) -> Tuple[bool, List[str]]:
    """
    Проверяет надежность пароля
    
    Args:
        password: Пароль для проверки
    
    Returns:
        tuple: (is_valid, errors_list)
    """
    errors = []
    
    if len(password) < 8:
        errors.append("Пароль должен содержать минимум 8 символов")
    
    if len(password) > 128:
        errors.append("Пароль не должен содержать более 128 символов")
    
    if not any(c.islower() for c in password):
        errors.append("Пароль должен содержать хотя бы одну строчную букву")
    
    if not any(c.isupper() for c in password):
        errors.append("Пароль должен содержать хотя бы одну заглавную букву")
    
    if not any(c.isdigit() for c in password):
        errors.append("Пароль должен содержать хотя бы одну цифру")
    
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if not any(c in special_chars for c in password):
        errors.append("Пароль должен содержать хотя бы один специальный символ")
    
    # Проверяем на простые паттерны
    if password.isdigit():
        errors.append("Пароль не должен состоять только из цифр")
    
    if password.isalpha():
        errors.append("Пароль не должен состоять только из букв")
    
    # Проверяем на повторяющиеся символы
    if len(set(password)) < len(password) * 0.6:
        errors.append("Пароль содержит слишком много повторяющихся символов")
    
    return len(errors) == 0, errors
