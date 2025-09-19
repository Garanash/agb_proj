"""
API v1 - Константы и настройки
"""

from enum import Enum
from typing import Dict, List

# Версия API
API_VERSION = "1.0.0"
API_NAME = "AGB Platform API"
API_DESCRIPTION = "API для корпоративной платформы AGB"

# Статусы ответов
class ResponseStatus:
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"

# Коды ошибок
class ErrorCodes:
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    CONFLICT = "CONFLICT"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"
    SERVER_ERROR = "SERVER_ERROR"
    UNKNOWN_ERROR = "UNKNOWN_ERROR"

# Роли пользователей
class UserRoles:
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"
    CONTRACTOR = "contractor"
    CUSTOMER = "customer"
    SECURITY = "security"
    HR = "hr"

# Статусы заявок
class RequestStatus:
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"

# Типы файлов
class FileTypes:
    IMAGE = "image"
    DOCUMENT = "document"
    ARCHIVE = "archive"
    AUDIO = "audio"
    VIDEO = "video"

# Разрешенные расширения файлов
ALLOWED_EXTENSIONS = {
    FileTypes.IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
    FileTypes.DOCUMENT: ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'],
    FileTypes.ARCHIVE: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    FileTypes.AUDIO: ['.mp3', '.wav', '.ogg', '.m4a'],
    FileTypes.VIDEO: ['.mp4', '.avi', '.mov', '.wmv', '.flv']
}

# Максимальные размеры файлов (в байтах)
MAX_FILE_SIZES = {
    FileTypes.IMAGE: 5 * 1024 * 1024,  # 5MB
    FileTypes.DOCUMENT: 10 * 1024 * 1024,  # 10MB
    FileTypes.ARCHIVE: 50 * 1024 * 1024,  # 50MB
    FileTypes.AUDIO: 20 * 1024 * 1024,  # 20MB
    FileTypes.VIDEO: 100 * 1024 * 1024  # 100MB
}

# Настройки пагинации
class Pagination:
    DEFAULT_PAGE = 1
    DEFAULT_SIZE = 20
    MAX_SIZE = 100
    MIN_SIZE = 1

# Настройки rate limiting
class RateLimit:
    DEFAULT_CALLS = 100
    DEFAULT_PERIOD = 60  # секунды
    BURST_CALLS = 200
    BURST_PERIOD = 60

# Настройки безопасности
class Security:
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_REQUIRE_DIGITS = True
    PASSWORD_REQUIRE_SPECIAL = True
    TOKEN_EXPIRE_MINUTES = 30
    REFRESH_TOKEN_EXPIRE_DAYS = 7

# Настройки логирования
class Logging:
    LOG_LEVEL = "INFO"
    LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE = "api_v1.log"
    MAX_LOG_SIZE = 10 * 1024 * 1024  # 10MB
    BACKUP_COUNT = 5

# Настройки кэширования
class Cache:
    DEFAULT_TTL = 300  # 5 минут
    USER_TTL = 1800  # 30 минут
    STATIC_TTL = 3600  # 1 час

# Домены API
class APIDomains:
    AUTH = "auth"
    USERS = "users"
    ORGANIZATION = "organization"
    WORKFLOW = "workflow"
    CONTENT = "content"
    COMMUNICATION = "communication"

# Теги для документации
class APITags:
    AUTH = "🔐 Аутентификация"
    USERS = "👥 Пользователи"
    ROLES = "🔑 Роли"
    DEPARTMENTS = "🏢 Отделы"
    EMPLOYEES = "👔 Сотрудники"
    TEAM = "👥 Команда"
    CONTRACTORS = "🔧 Исполнители"
    CUSTOMERS = "🏢 Заказчики"
    REQUESTS = "🔧 Заявки"
    PASSPORTS = "📋 ВЭД Паспорта"
    NEWS = "📰 Новости"
    EVENTS = "📅 События"
    CHAT = "💬 Чат"
    FOLDERS = "📁 Папки"
    TELEGRAM = "📱 Telegram"
    INFO = "📊 Информация"
    DOCS = "📚 Документация"

# HTTP статус коды с описаниями
HTTP_STATUS_DESCRIPTIONS = {
    200: "OK - Успешный запрос",
    201: "Created - Ресурс создан",
    204: "No Content - Успешный запрос без содержимого",
    400: "Bad Request - Некорректный запрос",
    401: "Unauthorized - Требуется авторизация",
    403: "Forbidden - Доступ запрещен",
    404: "Not Found - Ресурс не найден",
    409: "Conflict - Конфликт данных",
    422: "Unprocessable Entity - Ошибка валидации",
    429: "Too Many Requests - Превышен лимит запросов",
    500: "Internal Server Error - Внутренняя ошибка сервера"
}
