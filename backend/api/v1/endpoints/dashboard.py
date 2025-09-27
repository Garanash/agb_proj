"""
Эндпоинты для дашборда администратора
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import Dict, Any
from datetime import datetime, timedelta

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))

from database import get_db
from models import User, Event, News
from api.v1.endpoints.auth import get_current_user

router = APIRouter()

@router.get("/test")
async def test_dashboard():
    """Тестовый endpoint для проверки работы dashboard роутера"""
    return {"message": "Dashboard router is working", "status": "ok"}

@router.get("/debug/users")
async def debug_users(db: Session = Depends(get_db)):
    """Отладочный endpoint для проверки пользователей"""
    try:
        from sqlalchemy import select
        result = await db.execute(select(User))
        users = result.scalars().all()
        return {
            "total_users": len(users),
            "users": [
                {
                    "id": user.id,
                    "username": user.username,
                    "role": user.role,
                    "is_active": user.is_active,
                    "created_at": user.created_at.isoformat() if user.created_at else None
                }
                for user in users
            ]
        }
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}

@router.get("/admin/dashboard/stats")
async def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить статистику для дашборда администратора"""
    
    # Проверяем права администратора
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав для просмотра статистики")
    
    try:
        from sqlalchemy import select, func, desc
        
        # Общее количество пользователей
        total_users_result = await db.execute(select(func.count(User.id)))
        total_users = total_users_result.scalar() or 0
        
        # Активные пользователи (за последние 30 дней) - используем updated_at
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_users_result = await db.execute(
            select(func.count(User.id)).where(User.updated_at >= thirty_days_ago)
        )
        active_users = active_users_result.scalar() or 0
        
        # Общее количество событий
        total_events_result = await db.execute(select(func.count(Event.id)))
        total_events = total_events_result.scalar() or 0
        
        # События за текущий месяц
        current_month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        events_this_month_result = await db.execute(
            select(func.count(Event.id)).where(Event.created_at >= current_month_start)
        )
        events_this_month = events_this_month_result.scalar() or 0
        
        # Общее количество новостей
        total_news_result = await db.execute(select(func.count(News.id)))
        total_news = total_news_result.scalar() or 0
        
        # Новости за текущий месяц
        news_this_month_result = await db.execute(
            select(func.count(News.id)).where(News.created_at >= current_month_start)
        )
        news_this_month = news_this_month_result.scalar() or 0
        
        # Статистика по ролям пользователей
        users_by_role_result = await db.execute(
            select(User.role, func.count(User.id).label('count')).group_by(User.role)
        )
        users_by_role = users_by_role_result.all()
        role_stats = {role: count for role, count in users_by_role}
        
        # Статистика активности за последние 7 дней (используем updated_at)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_activity_result = await db.execute(
            select(
                func.date(User.updated_at).label('date'),
                func.count(User.id).label('count')
            ).where(
                User.updated_at >= seven_days_ago
            ).group_by(func.date(User.updated_at))
        )
        recent_activity = recent_activity_result.all()
        login_stats = {str(date): count for date, count in recent_activity}
        
        # Последние 5 пользователей
        recent_users_result = await db.execute(
            select(User).order_by(desc(User.created_at)).limit(5)
        )
        recent_users = recent_users_result.scalars().all()
        
        recent_users_data = []
        for user in recent_users:
            recent_users_data.append({
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'created_at': user.created_at.isoformat(),
                'last_login': user.updated_at.isoformat() if user.updated_at else None,
                'is_active': user.is_active
            })
        
        # Статистика системы (имитация)
        system_stats = {
            'cpu_usage': 23.5,
            'memory_usage': 68.2,
            'disk_usage': 45.1,
            'uptime': '15d 8h 32m',
            'api_requests_today': 1247,
            'error_rate': 0.3
        }
        
        return {
            'total_users': total_users,
            'active_users': active_users,
            'total_events': total_events,
            'events_this_month': events_this_month,
            'total_news': total_news,
            'news_this_month': news_this_month,
            'role_stats': role_stats,
            'login_stats': login_stats,
            'recent_users': recent_users_data,
            'system_stats': system_stats,
            'last_updated': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения статистики: {str(e)}")


@router.get("/admin/dashboard/activity")
async def get_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить последнюю активность для дашборда"""
    
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    try:
        from sqlalchemy import select, desc
        
        # Получаем последние пользователей
        recent_users_result = await db.execute(
            select(User).order_by(desc(User.updated_at)).limit(limit)
        )
        recent_users = recent_users_result.scalars().all()
        
        activity = []
        for user in recent_users:
            if user.updated_at:
                activity.append({
                    'id': f"user_{user.id}",
                    'user': user.username,
                    'action': 'Активность пользователя',
                    'timestamp': user.updated_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'ip': '192.168.1.100',  # Имитация IP
                    'status': 'success'
                })
        
        # Добавляем имитацию других активностей
        activity.extend([
            {
                'id': 'system_1',
                'user': 'system',
                'action': 'Создание документа',
                'timestamp': (datetime.utcnow() - timedelta(minutes=5)).strftime('%Y-%m-%d %H:%M:%S'),
                'ip': '127.0.0.1',
                'status': 'success'
            },
            {
                'id': 'system_2',
                'user': 'admin',
                'action': 'Изменение настроек',
                'timestamp': (datetime.utcnow() - timedelta(minutes=15)).strftime('%Y-%m-%d %H:%M:%S'),
                'ip': '192.168.1.100',
                'status': 'success'
            },
            {
                'id': 'system_3',
                'user': 'user123',
                'action': 'Ошибка авторизации',
                'timestamp': (datetime.utcnow() - timedelta(minutes=30)).strftime('%Y-%m-%d %H:%M:%S'),
                'ip': '192.168.1.101',
                'status': 'error'
            }
        ])
        
        # Сортируем по времени
        activity.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return activity[:limit]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения активности: {str(e)}")


@router.get("/admin/dashboard/quick-stats")
async def get_quick_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить быструю статистику для дашборда"""
    
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    try:
        from sqlalchemy import select, func
        
        # Быстрая статистика
        today = datetime.utcnow().date()
        
        users_today_result = await db.execute(
            select(func.count(User.id)).where(func.date(User.created_at) == today)
        )
        users_today = users_today_result.scalar() or 0
        
        events_today_result = await db.execute(
            select(func.count(Event.id)).where(func.date(Event.created_at) == today)
        )
        events_today = events_today_result.scalar() or 0
        
        news_today_result = await db.execute(
            select(func.count(News.id)).where(func.date(News.created_at) == today)
        )
        news_today = news_today_result.scalar() or 0
        
        stats = {
            'users_today': users_today,
            'events_today': events_today,
            'news_today': news_today,
            'active_sessions': 23,  # Имитация
            'system_health': 'healthy',
            'last_backup': (datetime.utcnow() - timedelta(hours=6)).isoformat()
        }
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения быстрой статистики: {str(e)}")
