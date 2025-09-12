"""
API v1 - Роли (заглушка)
TODO: Реализовать полноценную систему ролей
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from models import User
from .auth import get_current_user

router = APIRouter()


@router.get("/permissions", response_model=List[str])
async def get_permissions(
    current_user: User = Depends(get_current_user)
):
    """Получение списка всех доступных разрешений"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Возвращаем базовые разрешения
    return [
        "read_users",
        "write_users", 
        "delete_users",
        "read_departments",
        "write_departments",
        "read_news",
        "write_news",
        "read_events",
        "write_events",
        "admin_access"
    ]


@router.get("/")
async def read_roles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка всех ролей"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Возвращаем базовые роли
    return [
        {
            "id": 1,
            "name": "admin",
            "description": "Администратор системы",
            "permissions": [
                "read_users", "write_users", "delete_users",
                "read_departments", "write_departments",
                "read_news", "write_news", "read_events", "write_events",
                "admin_access"
            ],
            "is_active": True
        },
        {
            "id": 2,
            "name": "manager",
            "description": "Менеджер",
            "permissions": [
                "read_users", "write_users",
                "read_departments", "write_departments",
                "read_news", "write_news", "read_events", "write_events"
            ],
            "is_active": True
        },
        {
            "id": 3,
            "name": "employee",
            "description": "Сотрудник",
            "permissions": [
                "read_users", "read_departments", "read_news", "read_events"
            ],
            "is_active": True
        }
    ]


@router.get("/{role_id}")
async def read_role(
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение роли по ID"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Простая заглушка
    roles = {
        1: {
            "id": 1,
            "name": "admin",
            "description": "Администратор системы",
            "permissions": [
                "read_users", "write_users", "delete_users",
                "read_departments", "write_departments",
                "read_news", "write_news", "read_events", "write_events",
                "admin_access"
            ],
            "is_active": True
        },
        2: {
            "id": 2,
            "name": "manager", 
            "description": "Менеджер",
            "permissions": [
                "read_users", "write_users",
                "read_departments", "write_departments",
                "read_news", "write_news", "read_events", "write_events"
            ],
            "is_active": True
        },
        3: {
            "id": 3,
            "name": "employee",
            "description": "Сотрудник", 
            "permissions": [
                "read_users", "read_departments", "read_news", "read_events"
            ],
            "is_active": True
        }
    }
    
    if role_id not in roles:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    
    return roles[role_id]