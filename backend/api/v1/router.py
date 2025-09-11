"""
API v1 - Простой роутер для тестирования
"""

from fastapi import APIRouter
from datetime import datetime

# Создаем основной роутер для API v1
api_router = APIRouter()

# Подключаем дополнительные роутеры
try:
    from .analytics import router as analytics_router
    api_router.include_router(analytics_router, prefix="/analytics", tags=["📊 Аналитика"])
except ImportError:
    pass

try:
    from .cache import router as cache_router
    api_router.include_router(cache_router, prefix="/cache", tags=["💾 Кэш"])
except ImportError:
    pass

@api_router.get("/ping")
async def ping():
    """Простая проверка доступности API"""
    return {
        "success": True,
        "message": "API v1 доступен",
        "data": {
            "status": "ok",
            "version": "1.0.0",
            "timestamp": datetime.now().isoformat()
        }
    }

@api_router.get("/health")
async def health_check():
    """Проверка здоровья API v1"""
    return {
        "success": True,
        "message": "API v1 здоров",
        "data": {
            "status": "healthy",
            "service": "AGB Platform API v1.0.0",
            "timestamp": datetime.now().isoformat(),
            "version": "1.0.0"
        }
    }

@api_router.get("/domains")
async def get_api_domains():
    """Информация о доступных доменах API"""
    domains = {
        "auth": {
            "name": "Аутентификация",
            "description": "Управление пользователями и авторизацией",
            "endpoints": ["/auth/login", "/auth/logout", "/auth/register", "/auth/refresh"]
        },
        "users": {
            "name": "Пользователи", 
            "description": "Управление пользователями системы",
            "endpoints": ["/users", "/users/{id}", "/users/create", "/users/{id}/update"]
        },
        "departments": {
            "name": "Отделы",
            "description": "Управление организационной структурой",
            "endpoints": ["/departments", "/departments/{id}"]
        },
        "workflow": {
            "name": "Рабочие процессы",
            "description": "Управление заявками и задачами",
            "endpoints": ["/repair-requests", "/contractors", "/customers", "/ved-passports"]
        },
        "content": {
            "name": "Контент",
            "description": "Управление новостями и событиями",
            "endpoints": ["/news", "/events", "/team"]
        },
        "communication": {
            "name": "Коммуникации",
            "description": "Чат и уведомления",
            "endpoints": ["/chat", "/chat-folders", "/telegram"]
        }
    }
    
    return {
        "success": True,
        "message": "Доступные домены API",
        "data": domains
    }

@api_router.get("/stats")
async def get_api_stats():
    """Статистика использования API"""
    return {
        "success": True,
        "message": "Статистика API",
        "data": {
            "version": "1.0.0",
            "name": "AGB Platform API",
            "total_endpoints": 15,
            "active_domains": 6,
            "timestamp": datetime.now().isoformat()
        }
    }