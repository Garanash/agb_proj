"""
Главный роутер для API v3
"""

from fastapi import APIRouter
from .endpoints import (
    admin_settings,
    user_management,
    role_management,
    system_notifications,
    logging,
    monitoring,
    backup
)

api_router = APIRouter(tags=["v3"])

# Подключаем роутеры эндпоинтов
api_router.include_router(admin_settings.router, prefix="/admin", tags=["admin-settings"])
api_router.include_router(user_management.router, prefix="/users", tags=["user-management"])
api_router.include_router(role_management.router, prefix="/roles", tags=["role-management"])
api_router.include_router(system_notifications.router, prefix="/notifications", tags=["system-notifications"])
api_router.include_router(logging.router, prefix="/logs", tags=["logging"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
api_router.include_router(backup.router, prefix="/backup", tags=["backup"])

@api_router.get("/health")
async def health_check():
    """Проверка состояния API v3"""
    return {"status": "healthy", "version": "3.0.0"}
