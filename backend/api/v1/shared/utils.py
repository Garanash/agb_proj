"""
API v1 - Утилиты и вспомогательные функции
"""

import re
import hashlib
import secrets
import string
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union
from functools import wraps
import logging

logger = logging.getLogger(__name__)


def generate_random_string(length: int = 32) -> str:
    """Генерирует случайную строку заданной длины"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_hash(data: str, algorithm: str = "sha256") -> str:
    """Генерирует хеш от строки"""
    hash_obj = hashlib.new(algorithm)
    hash_obj.update(data.encode('utf-8'))
    return hash_obj.hexdigest()


def validate_email(email: str) -> bool:
    """Валидирует email адрес"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Валидирует номер телефона (российский формат)"""
    # Убираем все нецифровые символы
    digits = re.sub(r'\D', '', phone)
    
    # Проверяем российский формат
    if len(digits) == 11 and digits.startswith('7'):
        return True
    if len(digits) == 10 and digits.startswith('9'):
        return True
    
    return False


def normalize_phone(phone: str) -> str:
    """Нормализует номер телефона к формату +7XXXXXXXXXX"""
    digits = re.sub(r'\D', '', phone)
    
    if len(digits) == 11 and digits.startswith('7'):
        return f"+{digits}"
    elif len(digits) == 10 and digits.startswith('9'):
        return f"+7{digits}"
    elif len(digits) == 10 and digits.startswith('8'):
        return f"+7{digits[1:]}"
    
    return phone


def validate_password_strength(password: str) -> tuple[bool, List[str]]:
    """Проверяет сложность пароля"""
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


def sanitize_filename(filename: str) -> str:
    """Очищает имя файла от небезопасных символов"""
    # Убираем небезопасные символы
    safe_filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    # Ограничиваем длину
    if len(safe_filename) > 255:
        name, ext = safe_filename.rsplit('.', 1) if '.' in safe_filename else (safe_filename, '')
        safe_filename = name[:255-len(ext)-1] + ('.' + ext if ext else '')
    
    return safe_filename


def get_file_extension(filename: str) -> str:
    """Получает расширение файла"""
    return '.' + filename.split('.')[-1].lower() if '.' in filename else ''


def format_file_size(size_bytes: int) -> str:
    """Форматирует размер файла в читаемый вид"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"


def get_current_timestamp() -> str:
    """Получает текущую временную метку в ISO формате"""
    return datetime.now(timezone.utc).isoformat()


def parse_timestamp(timestamp_str: str) -> Optional[datetime]:
    """Парсит временную метку из ISO формата"""
    try:
        return datetime.fromisoformat(timestamp_str.replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        return None


def paginate_data(
    data: List[Any],
    page: int = 1,
    size: int = 20
) -> Dict[str, Any]:
    """Пагинирует данные"""
    total = len(data)
    start = (page - 1) * size
    end = start + size
    
    items = data[start:end]
    total_pages = (total + size - 1) // size
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1
    }


def mask_sensitive_data(data: Dict[str, Any], sensitive_fields: List[str]) -> Dict[str, Any]:
    """Маскирует чувствительные данные"""
    masked_data = data.copy()
    
    for field in sensitive_fields:
        if field in masked_data:
            value = str(masked_data[field])
            if len(value) > 4:
                masked_data[field] = value[:2] + "*" * (len(value) - 4) + value[-2:]
            else:
                masked_data[field] = "*" * len(value)
    
    return masked_data


def log_api_call(func):
    """Декоратор для логирования вызовов API"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        start_time = datetime.now()
        logger.info(f"🔄 Вызов {func.__name__} в {start_time}")
        
        try:
            result = await func(*args, **kwargs)
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            logger.info(f"✅ {func.__name__} завершен за {duration:.3f}s")
            return result
        except Exception as e:
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            logger.error(f"❌ {func.__name__} ошибка за {duration:.3f}s: {str(e)}")
            raise
    
    return wrapper


def validate_pagination_params(page: int, size: int, max_size: int = 100) -> tuple[int, int]:
    """Валидирует параметры пагинации"""
    if page < 1:
        page = 1
    if size < 1:
        size = 20
    if size > max_size:
        size = max_size
    
    return page, size


def create_response(
    success: bool = True,
    message: str = "",
    data: Optional[Union[Dict, List]] = None,
    error: Optional[str] = None,
    error_code: Optional[str] = None
) -> Dict[str, Any]:
    """Создает стандартный ответ API"""
    response = {
        "success": success,
        "timestamp": get_current_timestamp()
    }
    
    if message:
        response["message"] = message
    
    if data is not None:
        response["data"] = data
    
    if error:
        response["error"] = error
        if error_code:
            response["error_code"] = error_code
    
    return response
