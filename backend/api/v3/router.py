"""
Главный роутер для API v3
"""

from fastapi import APIRouter
try:
    from .endpoints import (
        admin_settings,
        user_management,
        role_management,
        system_notifications,
        logging,
        monitoring,
        backup,
        email_management,
        role_permissions,
        analytics_billing,
        integrations,
        notifications,
        article_search,
        stubs
    )
except ImportError as e:
    # Если какие-то модули не импортируются, создаем заглушки
    print(f"Warning: Some v3 endpoints modules failed to import: {e}")
    from .endpoints import stubs

api_router = APIRouter(tags=["v3"])

# Подключаем роутеры эндпоинтов с обработкой ошибок
try:
    api_router.include_router(admin_settings.router, prefix="/admin", tags=["admin-settings"])
except:
    pass

try:
    api_router.include_router(user_management.router, prefix="/users", tags=["user-management"])
except:
    api_router.include_router(stubs.router, prefix="/users", tags=["user-management"])

try:
    api_router.include_router(role_management.router, prefix="/roles", tags=["role-management"])
except:
    pass

try:
    api_router.include_router(system_notifications.router, prefix="/notifications", tags=["system-notifications"])
except:
    pass

try:
    api_router.include_router(logging.router, prefix="/logs", tags=["logging"])
except:
    pass

try:
    api_router.include_router(monitoring.router, prefix="/monitoring", tags=["monitoring"])
except:
    pass

try:
    api_router.include_router(backup.router, prefix="/backup", tags=["backup"])
except:
    pass

try:
    api_router.include_router(email_management.router, prefix="/email", tags=["email-management"])
except:
    api_router.include_router(stubs.router, prefix="/email", tags=["email-management"])

try:
    api_router.include_router(role_permissions.router, prefix="/permissions", tags=["role-permissions"])
except:
    api_router.include_router(stubs.router, prefix="/permissions", tags=["role-permissions"])

try:
    api_router.include_router(analytics_billing.router, prefix="/analytics", tags=["analytics-billing"])
except:
    api_router.include_router(stubs.router, prefix="/analytics", tags=["analytics-billing"])

try:
    api_router.include_router(integrations.router, prefix="/integrations", tags=["integrations"])
except:
    api_router.include_router(stubs.router, prefix="/integrations", tags=["integrations"])

try:
    api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
except:
    api_router.include_router(stubs.router, prefix="/notifications", tags=["notifications"])

try:
    api_router.include_router(article_search.router, prefix="/article-search", tags=["article-search"])
except:
    pass

@api_router.get("/health")
async def health_check():
    """Проверка состояния API v3"""
    return {"status": "healthy", "version": "3.0.0"}
