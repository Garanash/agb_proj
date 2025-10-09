import os

# Настройки JWT
SECRET_KEY = os.getenv("SECRET_KEY", "dev_secret_key_change_in_production_32_chars_minimum")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 часа

# Роли пользователей
class UserRoles:
    ADMIN = "admin"
    USER = "user"
    MANAGER = "manager"
    EMPLOYEE = "employee"
    VED_PASSPORT = "ved_passport"
    CUSTOMER = "customer"
    CONTRACTOR = "contractor"
    SERVICE_ENGINEER = "service_engineer"

# Статусы заявок
class RequestStatus:
    NEW = "new"
    PROCESSING = "processing"
    SENT_TO_BOT = "sent_to_bot"
    ASSIGNED = "assigned"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

# Типы файлов
class FileTypes:
    IMAGE = "image"
    DOCUMENT = "document"
    ARCHIVE = "archive"
    AUDIO = "audio"
    VIDEO = "video"

# API Теги
class APITags:
    AUTH = "Аутентификация"
    USERS = "Пользователи"
    DEPARTMENTS = "Отделы"
    NEWS = "Новости"
    EVENTS = "События"
    VED = "ВЭД Паспорта"
    CHAT = "Чат"
    REPAIR = "Ремонт"

# Настройки безопасности
class Security:
    PASSWORD_MIN_LENGTH = 6
    TOKEN_EXPIRE_MINUTES = ACCESS_TOKEN_EXPIRE_MINUTES