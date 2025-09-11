"""
API v1 - Информация о версии и эндпоинтах
"""

from fastapi import APIRouter
from .schemas import VersionInfo, HealthCheckResponse
from datetime import datetime
import os

router = APIRouter()

@router.get("/info", response_model=VersionInfo)
async def get_api_info():
    """Получить информацию о версии API"""
    return VersionInfo(
        version="1.0.0",
        name="AGB Platform API",
        description="API для корпоративной платформы AGB",
        status="active",
        endpoints=[
            "/auth - Аутентификация",
            "/users - Пользователи", 
            "/departments - Отделы",
            "/contractors - Исполнители",
            "/customers - Заказчики",
            "/repair-requests - Заявки на ремонт",
            "/ved-passports - ВЭД Паспорта",
            "/news - Новости",
            "/events - События",
            "/team - Команда",
            "/roles - Роли",
            "/chat - Чат",
            "/chat-folders - Папки чата",
            "/company-employees - Сотрудники компании",
            "/telegram - Telegram"
        ]
    )


@router.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Проверка здоровья API v1"""
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    from database import AsyncSessionLocal
    from sqlalchemy import text
    
    # Проверяем подключение к базе данных
    db_status = "disconnected"
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(text("SELECT 1"))
            if result.scalar() == 1:
                db_status = "connected"
    except Exception:
        db_status = "error"
    
    return HealthCheckResponse(
        status="healthy" if db_status == "connected" else "unhealthy",
        service="AGB Platform API v1",
        database=db_status,
        timestamp=datetime.now(),
        version="1.0.0"
    )


@router.get("/ping")
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
