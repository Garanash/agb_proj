"""
Главный роутер для API v3
"""

from fastapi import APIRouter
from .endpoints import (
    admin_settings,
    user_management,
    role_management,
    system_notifications
)

router = APIRouter(prefix="/v3", tags=["v3"])

# Подключаем роутеры эндпоинтов
router.include_router(admin_settings.router, prefix="/admin", tags=["admin-settings"])
router.include_router(user_management.router, prefix="/users", tags=["user-management"])
router.include_router(role_management.router, prefix="/roles", tags=["role-management"])
router.include_router(system_notifications.router, prefix="/notifications", tags=["system-notifications"])

@router.get("/health")
async def health_check():
    """Проверка состояния API v3"""
    return {"status": "healthy", "version": "3.0.0"}
