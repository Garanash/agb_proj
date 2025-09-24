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

# Подключаем endpoints
try:
    from .endpoints.auth import router as auth_router
    api_router.include_router(auth_router, prefix="/auth", tags=["🔐 Аутентификация"])
except ImportError:
    pass

try:
    from .endpoints.users import router as users_router
    api_router.include_router(users_router, prefix="/users", tags=["👥 Пользователи"])
except ImportError:
    pass

try:
    from .endpoints.departments import router as departments_router
    api_router.include_router(departments_router, prefix="/departments", tags=["🏢 Отделы"])
except ImportError:
    pass

try:
    from .endpoints.company_employees import router as company_employees_router
    api_router.include_router(company_employees_router, prefix="/company-employees", tags=["👨‍💼 Сотрудники компании"])
except ImportError:
    pass

try:
    from .endpoints.contractors import router as contractors_router
    api_router.include_router(contractors_router, prefix="/contractors", tags=["🔧 Подрядчики"])
except ImportError:
    pass

try:
    from .endpoints.customers import router as customers_router
    api_router.include_router(customers_router, prefix="/customers", tags=["👤 Клиенты"])
except ImportError:
    pass

try:
    from .endpoints.repair_requests import router as repair_requests_router
    api_router.include_router(repair_requests_router, prefix="/repair-requests", tags=["🔧 Заявки на ремонт"])
except ImportError:
    pass

try:
    from .endpoints.ved_passports import router as ved_passports_router
    api_router.include_router(ved_passports_router, prefix="/ved-passports", tags=["📋 ВЭД паспорта"])
except ImportError:
    pass

try:
    from .endpoints.news import router as news_router
    api_router.include_router(news_router, prefix="/news", tags=["📰 Новости"])
except ImportError:
    pass

try:
    from .endpoints.events import router as events_router
    api_router.include_router(events_router, prefix="/events", tags=["📅 События"])
except ImportError:
    pass

try:
    from .endpoints.team import router as team_router
    api_router.include_router(team_router, prefix="/team", tags=["👥 Команда"])
except ImportError:
    pass

try:
    from .endpoints.roles import router as roles_router
    api_router.include_router(roles_router, prefix="/roles", tags=["🔐 Роли"])
except ImportError:
    pass

try:
    from .endpoints.chat import router as chat_router
    api_router.include_router(chat_router, prefix="/chat", tags=["💬 Чат"])
except ImportError:
    pass

try:
    from .endpoints.chat_folders import router as chat_folders_router
    api_router.include_router(chat_folders_router, prefix="/chat-folders", tags=["📁 Папки чата"])
except ImportError:
    pass

try:
    from .endpoints.telegram import router as telegram_router
    api_router.include_router(telegram_router, prefix="/telegram", tags=["📱 Telegram"])
except ImportError:
    pass

try:
    from .endpoints.n8n_integration import router as n8n_router
    api_router.include_router(n8n_router, prefix="/n8n", tags=["🔄 n8n Интеграция"])
except ImportError:
    pass

try:
    from .endpoints.wiki import router as wiki_router
    api_router.include_router(wiki_router, prefix="/wiki", tags=["📚 Wiki"])
except ImportError:
    pass

try:
    from .endpoints.article_matching import router as article_matching_router
    api_router.include_router(article_matching_router, prefix="/article-matching", tags=["🔗 Сопоставление артикулов"])
except ImportError:
    pass

try:
    from .endpoints.settings import router as settings_router
    api_router.include_router(settings_router, prefix="/settings", tags=["⚙️ Настройки"])
except ImportError:
    pass

try:
    from .endpoints.ai_processing import router as ai_processing_router
    api_router.include_router(ai_processing_router, prefix="/article-matching", tags=["🤖 ИИ обработка"])
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