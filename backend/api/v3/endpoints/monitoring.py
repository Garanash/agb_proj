"""
Эндпоинты для мониторинга системы
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import psutil
import os
import json

from ...database import get_db
from ..models import SystemMetrics, SystemLog, LoginLog
from ..schemas import (
    SystemMetricsResponse, SystemHealthResponse, 
    PerformanceMetricsResponse, DatabaseStatsResponse
)
from ..utils import PermissionManager, ActivityLogger

router = APIRouter()
permission_manager = PermissionManager()
activity_logger = ActivityLogger()


@router.get("/system-health", response_model=SystemHealthResponse)
async def get_system_health(db: Session = Depends(get_db)):
    """Получить общее состояние системы"""
    
    if not permission_manager.has_permission("admin", "monitoring.read"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для просмотра мониторинга")
    
    try:
        # Получаем метрики системы
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        # Получаем статистику из базы данных
        total_users = db.query(func.count()).select_from(LoginLog).scalar() or 0
        recent_logins = db.query(func.count()).select_from(LoginLog).filter(
            LoginLog.created_at >= datetime.utcnow() - timedelta(hours=24)
        ).scalar() or 0
        
        # Получаем количество ошибок за последний час
        error_count = db.query(func.count()).select_from(SystemLog).filter(
            and_(
                SystemLog.level == 'ERROR',
                SystemLog.created_at >= datetime.utcnow() - timedelta(hours=1)
            )
        ).scalar() or 0
        
        # Определяем общее состояние системы
        health_status = "healthy"
        if cpu_percent > 80 or memory.percent > 80 or disk.percent > 90:
            health_status = "warning"
        if cpu_percent > 95 or memory.percent > 95 or disk.percent > 95 or error_count > 10:
            health_status = "critical"
        
        return SystemHealthResponse(
            status=health_status,
            timestamp=datetime.utcnow(),
            cpu_usage=cpu_percent,
            memory_usage=memory.percent,
            disk_usage=disk.percent,
            total_users=total_users,
            recent_logins=recent_logins,
            error_count_last_hour=error_count,
            uptime=get_system_uptime()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения состояния системы: {str(e)}")


@router.get("/performance-metrics", response_model=PerformanceMetricsResponse)
async def get_performance_metrics(
    hours: int = Query(24, ge=1, le=168),  # Максимум неделя
    db: Session = Depends(get_db)
):
    """Получить метрики производительности за период"""
    
    if not permission_manager.has_permission("admin", "monitoring.read"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для просмотра метрик")
    
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)
    
    # Получаем метрики из базы данных
    metrics = db.query(SystemMetrics).filter(
        SystemMetrics.created_at >= start_time
    ).order_by(SystemMetrics.created_at).all()
    
    # Группируем метрики по типам
    metrics_by_name = {}
    for metric in metrics:
        if metric.metric_name not in metrics_by_name:
            metrics_by_name[metric.metric_name] = []
        metrics_by_name[metric.metric_name].append({
            "value": metric.metric_value,
            "timestamp": metric.created_at,
            "unit": metric.metric_unit,
            "tags": metric.tags
        })
    
    return PerformanceMetricsResponse(
        period_hours=hours,
        metrics=metrics_by_name,
        current_cpu=psutil.cpu_percent(),
        current_memory=psutil.virtual_memory().percent,
        current_disk=psutil.disk_usage('/').percent
    )


@router.get("/database-stats", response_model=DatabaseStatsResponse)
async def get_database_stats(db: Session = Depends(get_db)):
    """Получить статистику базы данных"""
    
    if not permission_manager.has_permission("admin", "monitoring.read"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для просмотра статистики БД")
    
    try:
        # Получаем размер базы данных (примерная оценка)
        db_size_query = """
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
        """
        result = db.execute(db_size_query)
        db_size = result.fetchone()[0] if result else "Unknown"
        
        # Получаем количество записей в основных таблицах
        tables_stats = {}
        tables = ['users', 'system_logs_v3', 'login_logs_v3', 'security_events_v3']
        
        for table in tables:
            try:
                count_query = f"SELECT COUNT(*) FROM {table}"
                result = db.execute(count_query)
                count = result.fetchone()[0] if result else 0
                tables_stats[table] = count
            except:
                tables_stats[table] = 0
        
        # Получаем статистику подключений
        connections_query = """
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
        """
        result = db.execute(connections_query)
        active_connections = result.fetchone()[0] if result else 0
        
        return DatabaseStatsResponse(
            database_size=db_size,
            active_connections=active_connections,
            tables_stats=tables_stats,
            last_backup=get_last_backup_time(db),
            health_status="healthy"  # Можно добавить более сложную логику
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения статистики БД: {str(e)}")


@router.post("/metrics/record")
async def record_metric(
    metric_name: str,
    metric_value: float,
    metric_unit: Optional[str] = None,
    tags: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_db)
):
    """Записать метрику в систему мониторинга"""
    
    if not permission_manager.has_permission("admin", "monitoring.write"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для записи метрик")
    
    try:
        metric = SystemMetrics(
            metric_name=metric_name,
            metric_value=metric_value,
            metric_unit=metric_unit,
            tags=tags or {}
        )
        
        db.add(metric)
        db.commit()
        
        return {"message": "Метрика записана успешно"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка записи метрики: {str(e)}")


@router.get("/alerts")
async def get_system_alerts(
    severity: Optional[str] = Query(None),
    resolved: Optional[bool] = Query(False),
    db: Session = Depends(get_db)
):
    """Получить системные оповещения"""
    
    if not permission_manager.has_permission("admin", "monitoring.read"):
        raise HTTPException(status_code=403, detail="Недостаточно прав для просмотра оповещений")
    
    alerts = []
    
    # Проверяем критические метрики
    cpu_percent = psutil.cpu_percent()
    memory_percent = psutil.virtual_memory().percent
    disk_percent = psutil.disk_usage('/').percent
    
    if cpu_percent > 90:
        alerts.append({
            "type": "cpu_high",
            "severity": "critical" if cpu_percent > 95 else "warning",
            "message": f"Высокая загрузка CPU: {cpu_percent}%",
            "timestamp": datetime.utcnow(),
            "resolved": False
        })
    
    if memory_percent > 90:
        alerts.append({
            "type": "memory_high",
            "severity": "critical" if memory_percent > 95 else "warning",
            "message": f"Высокое использование памяти: {memory_percent}%",
            "timestamp": datetime.utcnow(),
            "resolved": False
        })
    
    if disk_percent > 90:
        alerts.append({
            "type": "disk_high",
            "severity": "critical" if disk_percent > 95 else "warning",
            "message": f"Мало места на диске: {disk_percent}%",
            "timestamp": datetime.utcnow(),
            "resolved": False
        })
    
    # Проверяем ошибки в логах
    error_count = db.query(func.count()).select_from(SystemLog).filter(
        and_(
            SystemLog.level == 'ERROR',
            SystemLog.created_at >= datetime.utcnow() - timedelta(minutes=15)
        )
    ).scalar() or 0
    
    if error_count > 5:
        alerts.append({
            "type": "high_error_rate",
            "severity": "warning",
            "message": f"Высокий уровень ошибок: {error_count} за последние 15 минут",
            "timestamp": datetime.utcnow(),
            "resolved": False
        })
    
    # Фильтруем по параметрам
    if severity:
        alerts = [alert for alert in alerts if alert["severity"] == severity]
    if resolved is not None:
        alerts = [alert for alert in alerts if alert["resolved"] == resolved]
    
    return {"alerts": alerts, "total": len(alerts)}


def get_system_uptime() -> str:
    """Получить время работы системы"""
    try:
        uptime_seconds = psutil.boot_time()
        uptime = datetime.utcnow() - datetime.fromtimestamp(uptime_seconds)
        
        days = uptime.days
        hours, remainder = divmod(uptime.seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        
        return f"{days}d {hours}h {minutes}m"
    except:
        return "Unknown"


def get_last_backup_time(db: Session) -> Optional[datetime]:
    """Получить время последнего резервного копирования"""
    try:
        from ..models import BackupLog
        last_backup = db.query(BackupLog).filter(
            BackupLog.status == 'SUCCESS'
        ).order_by(desc(BackupLog.created_at)).first()
        
        return last_backup.created_at if last_backup else None
    except:
        return None
