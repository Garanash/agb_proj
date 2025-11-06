"""
Заглушки для v3 endpoints, которые еще не реализованы
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from database import get_db
from api.v1.dependencies import get_current_user
from models import User

router = APIRouter()

# Email endpoints - будут использоваться с префиксом /email
@router.get("/email-settings")
def get_email_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение настроек email (заглушка)"""
    return []

# Integrations endpoints - будут использоваться с префиксом /integrations
@router.get("/integrations")
def get_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение списка интеграций (заглушка)"""
    return []

@router.get("/integrations/supported")
def get_supported_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение поддерживаемых интеграций (заглушка)"""
    return []

# Analytics endpoints - будут использоваться с префиксом /analytics
@router.get("/api-usage")
def get_api_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение статистики использования API (заглушка)"""
    return {
        "total_requests": 0,
        "successful_requests": 0,
        "failed_requests": 0,
        "average_response_time": 0,
        "period": "month"
    }

# Permissions endpoints - будут использоваться с префиксом /permissions
@router.get("/roles")
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение ролей (заглушка)"""
    return []

@router.get("/permissions")
def get_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение разрешений (заглушка)"""
    return []

@router.get("/user-roles")
def get_user_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение ролей пользователей (заглушка)"""
    return []

# Users endpoints - будут использоваться с префиксом /users
@router.get("/")
def get_users_v3(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение пользователей v3 (заглушка)"""
    return []

# Notifications endpoints - будут использоваться с префиксом /notifications
@router.get("/templates")
def get_notification_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение шаблонов уведомлений (заглушка)"""
    return []

@router.get("/stats")
def get_notification_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получение статистики уведомлений (заглушка)"""
    return {
        "total": 0,
        "sent": 0,
        "failed": 0,
        "pending": 0
    }

