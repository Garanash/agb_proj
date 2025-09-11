# API v1 Endpoints - Все роутеры
from .auth import router as auth_router
from .users import router as users_router
from .departments import router as departments_router
from .company_employees import router as company_employees_router
from .contractors import router as contractors_router
from .customers import router as customers_router
from .repair_requests import router as repair_requests_router
from .ved_passports import router as ved_passports_router
from .news import router as news_router
from .events import router as events_router
from .team import router as team_router
from .roles import router as roles_router
from .chat import router as chat_router
from .chat_folders import router as chat_folders_router
from .telegram import router as telegram_router

# Экспорт всех роутеров для удобства
__all__ = [
    "auth_router",
    "users_router", 
    "departments_router",
    "company_employees_router",
    "contractors_router",
    "customers_router",
    "repair_requests_router",
    "ved_passports_router",
    "news_router",
    "events_router",
    "team_router",
    "roles_router",
    "chat_router",
    "chat_folders_router",
    "telegram_router"
]