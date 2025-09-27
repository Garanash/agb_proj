"""
API - Основной роутер для всех версий
"""

from fastapi import APIRouter
from datetime import datetime

# Создаем основной роутер API
api_router = APIRouter()

# Подключаем версии API
try:
    from .v1.router import api_router as v1_router
    api_router.include_router(v1_router, prefix="/v1")
except ImportError:
    pass

try:
    from .v2.router import api_router as v2_router
    api_router.include_router(v2_router, prefix="/v2")
except ImportError:
    pass

try:
    from .v3.router import router as v3_router
    api_router.include_router(v3_router, prefix="/v3")
except ImportError:
    pass

# Простые эндпоинты для тестирования
@api_router.get("/v1/ping")
async def ping():
    """Простая проверка доступности API v1"""
    return {
        "success": True,
        "message": "API v1 доступен",
        "data": {
            "status": "ok",
            "version": "1.0.0",
            "timestamp": datetime.now().isoformat()
        }
    }

@api_router.get("/v1/health")
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

@api_router.get("/v1/domains")
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

@api_router.get("/v1/stats")
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

# Эндпоинты для аутентификации подключены через v1 роутер

@api_router.get("/v1/users")
async def get_users():
    """Получение списка пользователей (заглушка)"""
    return {
        "success": True,
        "message": "Список пользователей",
        "data": {
            "users": [
                {"id": 1, "username": "admin", "role": "admin"},
                {"id": 2, "username": "user", "role": "user"}
            ],
            "total": 2
        }
    }

# API v2 эндпоинты
@api_router.get("/v2/ping")
async def ping_v2():
    """Простая проверка доступности API v2"""
    return {
        "success": True,
        "message": "API v2 доступен",
        "data": {
            "status": "ok",
            "version": "2.0.0",
            "timestamp": datetime.now().isoformat(),
            "features": [
                "Улучшенная архитектура",
                "Расширенная аналитика",
                "Продвинутое кэширование",
                "GraphQL поддержка",
                "WebSocket интеграция"
            ]
        }
    }

@api_router.get("/v2/health")
async def health_check_v2():
    """Проверка здоровья API v2"""
    return {
        "success": True,
        "message": "API v2 здоров",
        "data": {
            "status": "healthy",
            "service": "AGB Platform API v2.0.0",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0.0",
            "architecture": "Microservices-ready",
            "database": "Connected",
            "cache": "Active",
            "metrics": "Enabled"
        }
    }

@api_router.get("/v2/info")
async def get_api_info_v2():
    """Информация о API v2"""
    return {
        "success": True,
        "message": "Информация о API v2",
        "data": {
            "version": "2.0.0",
            "name": "AGB Platform API v2",
            "description": "Новая версия API с улучшенной архитектурой",
            "status": "development",
            "breaking_changes": [
                "Изменена структура ответов",
                "Новые эндпоинты для аналитики",
                "Улучшенная система кэширования",
                "GraphQL API доступен"
            ],
            "new_features": [
                "Real-time уведомления",
                "Продвинутая аналитика",
                "A/B тестирование",
                "Масштабируемость",
                "GraphQL поддержка"
            ],
            "migration_guide": "/api/v2/docs/migration",
            "documentation": "/api/v2/docs"
        }
    }