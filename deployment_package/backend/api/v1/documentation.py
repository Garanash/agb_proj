"""
API v1 - Документация и метаданные
"""

from fastapi import APIRouter
from typing import Dict, List, Any
from .schemas import VersionInfo, HealthCheckResponse
from datetime import datetime

# Создаем роутер для документации
router = APIRouter()

# Метаданные API
API_METADATA = {
    "version": "1.0.0",
    "name": "AGB Platform API",
    "description": "API для корпоративной платформы AGB",
    "status": "active",
    "maintainer": "AGB Development Team",
    "contact": {
        "email": "dev@agb.ru",
        "phone": "+7 (495) 123-45-67"
    },
    "license": {
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
}

# Домены API
API_DOMAINS = {
    "auth": {
        "name": "Аутентификация",
        "description": "Управление пользователями и авторизацией",
        "endpoints": [
            "/auth/login - Вход в систему",
            "/auth/logout - Выход из системы", 
            "/auth/register - Регистрация",
            "/auth/refresh - Обновление токена",
            "/auth/forgot-password - Восстановление пароля"
        ]
    },
    "users": {
        "name": "Пользователи",
        "description": "Управление пользователями системы",
        "endpoints": [
            "/users - Список пользователей",
            "/users/{id} - Информация о пользователе",
            "/users/create - Создание пользователя",
            "/users/{id}/update - Обновление пользователя",
            "/users/{id}/delete - Удаление пользователя"
        ]
    },
    "departments": {
        "name": "Отделы",
        "description": "Управление организационной структурой",
        "endpoints": [
            "/departments - Список отделов",
            "/departments/{id} - Информация об отделе",
            "/departments/create - Создание отдела",
            "/departments/{id}/update - Обновление отдела"
        ]
    },
    "workflow": {
        "name": "Рабочие процессы",
        "description": "Управление заявками и задачами",
        "endpoints": [
            "/repair-requests - Заявки на ремонт",
            "/contractors - Исполнители",
            "/customers - Заказчики",
            "/ved-passports - ВЭД Паспорта"
        ]
    },
    "content": {
        "name": "Контент",
        "description": "Управление новостями и событиями",
        "endpoints": [
            "/news - Новости",
            "/events - События",
            "/team - Команда"
        ]
    },
    "communication": {
        "name": "Коммуникации",
        "description": "Чат и уведомления",
        "endpoints": [
            "/chat - Чат",
            "/chat-folders - Папки чата",
            "/telegram - Telegram интеграция"
        ]
    }
}

# Статусы кодов ответов
HTTP_STATUS_CODES = {
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

# Примеры запросов
REQUEST_EXAMPLES = {
    "user_creation": {
        "username": "john.doe",
        "email": "john.doe@example.com",
        "first_name": "Иван",
        "last_name": "Иванов",
        "role": "employee",
        "department_id": 1
    },
    "login": {
        "username": "john.doe",
        "password": "SecurePassword123!"
    },
    "pagination": {
        "page": 1,
        "size": 20,
        "sort_by": "created_at",
        "sort_order": "desc"
    }
}

# Примеры ответов
RESPONSE_EXAMPLES = {
    "success": {
        "success": True,
        "message": "Операция выполнена успешно",
        "data": {}
    },
    "error": {
        "success": False,
        "error": "Описание ошибки",
        "details": {}
    },
    "pagination": {
        "items": [],
        "total": 100,
        "page": 1,
        "size": 20,
        "pages": 5
    }
}


@router.get("/docs", response_model=Dict[str, Any])
async def get_api_documentation():
    """Полная документация API v1"""
    return {
        "metadata": API_METADATA,
        "domains": API_DOMAINS,
        "status_codes": HTTP_STATUS_CODES,
        "examples": {
            "requests": REQUEST_EXAMPLES,
            "responses": RESPONSE_EXAMPLES
        },
        "timestamp": datetime.now().isoformat()
    }


@router.get("/domains", response_model=Dict[str, Any])
async def get_api_domains():
    """Информация о доменах API"""
    return {
        "domains": API_DOMAINS,
        "total_domains": len(API_DOMAINS),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/status-codes", response_model=Dict[str, Any])
async def get_status_codes():
    """Справочник HTTP статус кодов"""
    return {
        "status_codes": HTTP_STATUS_CODES,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/examples", response_model=Dict[str, Any])
async def get_examples():
    """Примеры запросов и ответов"""
    return {
        "requests": REQUEST_EXAMPLES,
        "responses": RESPONSE_EXAMPLES,
        "timestamp": datetime.now().isoformat()
    }
