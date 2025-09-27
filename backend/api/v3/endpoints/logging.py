"""
Эндпоинты для работы с логами системы
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
import json

from ...database import get_db
from ..models import SystemLog, LoginLog, SecurityEvent
from ..schemas import (
    SystemLogResponse, LoginLogResponse, SecurityEventResponse,
    LogFilterRequest, LogStatsResponse
)
from ..utils import PermissionManager, ActivityLogger

router = APIRouter()
permission_manager = PermissionManager()
activity_logger = ActivityLogger()


@router.get("/system-logs", response_model=List[SystemLogResponse])
async def get_system_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    level: Optional[str] = Query(None),
    module: Optional[str] = Query(None),
    user_id: Optional[int] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Получить системные логи с фильтрацией"""
    
    # Проверка прав доступа
    if not permission_manager.has_permission("admin", "logs.read"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для просмотра логов")
    
    query = db.query(SystemLog)
    
    # Применяем фильтры
    if level:
        query = query.filter(SystemLog.level == level.upper())
    if module:
        query = query.filter(SystemLog.module.ilike(f"%{module}%"))
    if user_id:
        query = query.filter(SystemLog.user_id == user_id)
    if start_date:
        query = query.filter(SystemLog.created_at >= start_date)
    if end_date:
        query = query.filter(SystemLog.created_at <= end_date)
    if search:
        query = query.filter(SystemLog.message.ilike(f"%{search}%"))
    
    # Сортировка по дате (новые сначала)
    query = query.order_by(desc(SystemLog.created_at))
    
    # Пагинация
    logs = query.offset(skip).limit(limit).all()
    
    return logs


@router.get("/login-logs", response_model=List[LoginLogResponse])
async def get_login_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    success: Optional[bool] = Query(None),
    user_id: Optional[int] = Query(None),
    ip_address: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """Получить логи входов в систему"""
    
    if not permission_manager.has_permission("admin", "logs.read"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для просмотра логов")
    
    query = db.query(LoginLog)
    
    if success is not None:
        query = query.filter(LoginLog.success == success)
    if user_id:
        query = query.filter(LoginLog.user_id == user_id)
    if ip_address:
        query = query.filter(LoginLog.ip_address == ip_address)
    if start_date:
        query = query.filter(LoginLog.created_at >= start_date)
    if end_date:
        query = query.filter(LoginLog.created_at <= end_date)
    
    query = query.order_by(desc(LoginLog.created_at))
    logs = query.offset(skip).limit(limit).all()
    
    return logs


@router.get("/security-events", response_model=List[SecurityEventResponse])
async def get_security_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    event_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    resolved: Optional[bool] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db)
):
    """Получить события безопасности"""
    
    if not permission_manager.has_permission("admin", "security.read"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для просмотра событий безопасности")
    
    query = db.query(SecurityEvent)
    
    if event_type:
        query = query.filter(SecurityEvent.event_type == event_type)
    if severity:
        query = query.filter(SecurityEvent.severity == severity.upper())
    if resolved is not None:
        query = query.filter(SecurityEvent.resolved == resolved)
    if start_date:
        query = query.filter(SecurityEvent.created_at >= start_date)
    if end_date:
        query = query.filter(SecurityEvent.created_at <= end_date)
    
    query = query.order_by(desc(SecurityEvent.created_at))
    events = query.offset(skip).limit(limit).all()
    
    return events


@router.get("/logs/stats", response_model=LogStatsResponse)
async def get_log_stats(
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Получить статистику логов за период"""
    
    if not permission_manager.has_permission("admin", "logs.read"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для просмотра статистики")
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Статистика системных логов
    system_logs_stats = db.query(
        SystemLog.level,
        func.count(SystemLog.id).label('count')
    ).filter(
        SystemLog.created_at >= start_date
    ).group_by(SystemLog.level).all()
    
    # Статистика входов
    login_stats = db.query(
        LoginLog.success,
        func.count(LoginLog.id).label('count')
    ).filter(
        LoginLog.created_at >= start_date
    ).group_by(LoginLog.success).all()
    
    # Статистика событий безопасности
    security_stats = db.query(
        SecurityEvent.severity,
        func.count(SecurityEvent.id).label('count')
    ).filter(
        SecurityEvent.created_at >= start_date
    ).group_by(SecurityEvent.severity).all()
    
    # Активность по дням
    daily_activity = db.query(
        func.date(SystemLog.created_at).label('date'),
        func.count(SystemLog.id).label('count')
    ).filter(
        SystemLog.created_at >= start_date
    ).group_by(func.date(SystemLog.created_at)).all()
    
    return LogStatsResponse(
        period_days=days,
        system_logs_by_level={level: count for level, count in system_logs_stats},
        login_stats={str(success): count for success, count in login_stats},
        security_events_by_severity={severity: count for severity, count in security_stats},
        daily_activity={str(date): count for date, count in daily_activity}
    )


@router.post("/security-events/{event_id}/resolve")
async def resolve_security_event(
    event_id: int,
    resolved_by: int,
    db: Session = Depends(get_db)
):
    """Отметить событие безопасности как решенное"""
    
    if not permission_manager.has_permission("admin", "security.write"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для изменения событий безопасности")
    
    event = db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    
    event.resolved = True
    event.resolved_by = resolved_by
    event.resolved_at = datetime.utcnow()
    
    db.commit()
    
    # Логируем действие
    await activity_logger.log_activity(
        user_id=resolved_by,
        action="resolve_security_event",
        details={"event_id": event_id, "event_type": event.event_type}
    )
    
    return {"message": "Событие отмечено как решенное"}


@router.delete("/system-logs/cleanup")
async def cleanup_old_logs(
    days_to_keep: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Очистить старые логи"""
    
    if not permission_manager.has_permission("admin", "logs.delete"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для удаления логов")
    
    cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
    
    # Удаляем старые системные логи
    deleted_system_logs = db.query(SystemLog).filter(
        SystemLog.created_at < cutoff_date
    ).delete()
    
    # Удаляем старые логи входов (кроме неудачных попыток - их храним дольше)
    deleted_login_logs = db.query(LoginLog).filter(
        and_(
            LoginLog.created_at < cutoff_date,
            LoginLog.success == True  # Удаляем только успешные входы
        )
    ).delete()
    
    db.commit()
    
    # Логируем действие
    await activity_logger.log_activity(
        user_id=1,  # Система
        action="cleanup_logs",
        details={
            "days_to_keep": days_to_keep,
            "deleted_system_logs": deleted_system_logs,
            "deleted_login_logs": deleted_login_logs
        }
    )
    
    return {
        "message": "Очистка логов завершена",
        "deleted_system_logs": deleted_system_logs,
        "deleted_login_logs": deleted_login_logs
    }
