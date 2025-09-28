"""
Система аналитики и биллинга для API
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, text
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from decimal import Decimal
import json

from database import get_db
from ..schemas import (
    ApiUsageStats, BillingInfo, ApiCostBreakdown, 
    SuccessResponse, ErrorResponse
)
from ..models import SystemLog, UserActivity
from models import User
from ..utils import PermissionManager, ActivityLogger
from ...v1.dependencies import get_current_user

router = APIRouter()


class BillingCalculator:
    """Калькулятор стоимости API"""
    
    # Тарифы (в копейках за запрос)
    RATES = {
        "free": {
            "requests_per_month": 1000,
            "cost_per_request": 0,
            "cost_per_month": 0
        },
        "basic": {
            "requests_per_month": 10000,
            "cost_per_request": 1,  # 1 копейка
            "cost_per_month": 1000  # 10 рублей
        },
        "premium": {
            "requests_per_month": 100000,
            "cost_per_request": 0.5,  # 0.5 копейки
            "cost_per_month": 5000  # 50 рублей
        },
        "enterprise": {
            "requests_per_month": -1,  # Безлимит
            "cost_per_request": 0.2,  # 0.2 копейки
            "cost_per_month": 50000  # 500 рублей
        }
    }
    
    @staticmethod
    def calculate_cost(plan: str, requests_count: int) -> Dict[str, Any]:
        """Рассчитать стоимость использования"""
        if plan not in BillingCalculator.RATES:
            plan = "free"
        
        rate = BillingCalculator.RATES[plan]
        
        # Если план с лимитом и превышен лимит
        if rate["requests_per_month"] > 0 and requests_count > rate["requests_per_month"]:
            base_cost = rate["cost_per_month"]
            extra_requests = requests_count - rate["requests_per_month"]
            extra_cost = extra_requests * rate["cost_per_request"]
            total_cost = base_cost + extra_cost
        else:
            # В пределах лимита или безлимитный план
            if rate["cost_per_request"] > 0:
                total_cost = requests_count * rate["cost_per_request"]
            else:
                total_cost = 0
        
        return {
            "plan": plan,
            "requests_count": requests_count,
            "base_cost": rate["cost_per_month"],
            "per_request_cost": rate["cost_per_request"],
            "total_cost": total_cost,
            "cost_in_rubles": total_cost / 100,
            "is_over_limit": rate["requests_per_month"] > 0 and requests_count > rate["requests_per_month"],
            "remaining_requests": max(0, rate["requests_per_month"] - requests_count) if rate["requests_per_month"] > 0 else -1
        }


@router.get("/api-usage", response_model=ApiUsageStats)
async def get_api_usage_stats(
    user_id: Optional[int] = Query(None, description="ID пользователя (только для админов)"),
    start_date: Optional[datetime] = Query(None, description="Начальная дата"),
    end_date: Optional[datetime] = Query(None, description="Конечная дата"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить статистику использования API"""
    
    # Если не указан user_id, используем текущего пользователя
    if user_id is None:
        user_id = current_user.id
    else:
        # Проверяем права на просмотр статистики других пользователей
        await PermissionManager.require_permission(db, current_user.id, "analytics.read")
    
    # Устанавливаем даты по умолчанию (последние 30 дней)
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    # Получаем статистику запросов из логов
    logs_query = select(
        func.count(SystemLog.id).label('total_requests'),
        func.count(func.distinct(SystemLog.user_id)).label('unique_users'),
        func.date(SystemLog.created_at).label('date')
    ).where(
        and_(
            SystemLog.created_at >= start_date,
            SystemLog.created_at <= end_date,
            SystemLog.user_id == user_id if user_id else True
        )
    ).group_by(func.date(SystemLog.created_at))
    
    result = await db.execute(logs_query)
    daily_stats = result.fetchall()
    
    # Общая статистика
    total_requests = sum(day.total_requests for day in daily_stats)
    
    # Получаем план пользователя (пока заглушка)
    user_plan = "basic"  # TODO: получать из профиля пользователя
    
    # Рассчитываем стоимость
    billing_info = BillingCalculator.calculate_cost(user_plan, total_requests)
    
    # Статистика по эндпоинтам
    endpoint_stats_query = select(
        SystemLog.endpoint,
        func.count(SystemLog.id).label('count')
    ).where(
        and_(
            SystemLog.created_at >= start_date,
            SystemLog.created_at <= end_date,
            SystemLog.user_id == user_id if user_id else True
        )
    ).group_by(SystemLog.endpoint).order_by(desc('count')).limit(10)
    
    endpoint_result = await db.execute(endpoint_stats_query)
    top_endpoints = [
        {"endpoint": row.endpoint, "count": row.count}
        for row in endpoint_result.fetchall()
    ]
    
    # Статистика по статусам ответов
    status_stats_query = select(
        SystemLog.status_code,
        func.count(SystemLog.id).label('count')
    ).where(
        and_(
            SystemLog.created_at >= start_date,
            SystemLog.created_at <= end_date,
            SystemLog.user_id == user_id if user_id else True
        )
    ).group_by(SystemLog.status_code)
    
    status_result = await db.execute(status_stats_query)
    status_breakdown = [
        {"status_code": row.status_code, "count": row.count}
        for row in status_result.fetchall()
    ]
    
    return ApiUsageStats(
        user_id=user_id or current_user.id,
        period_start=start_date,
        period_end=end_date,
        total_requests=total_requests,
        unique_users=len(set(day.unique_users for day in daily_stats)),
        daily_requests=[
            {
                "date": day.date.isoformat(),
                "requests": day.total_requests
            }
            for day in daily_stats
        ],
        top_endpoints=top_endpoints,
        status_breakdown=status_breakdown,
        billing_info=billing_info
    )


@router.get("/billing/info", response_model=BillingInfo)
async def get_billing_info(
    user_id: Optional[int] = Query(None, description="ID пользователя (только для админов)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить информацию о биллинге"""
    
    if user_id is None:
        user_id = current_user.id
    else:
        await PermissionManager.require_permission(db, current_user.id, "analytics.read")
    
    # Получаем план пользователя (заглушка)
    user_plan = "basic"  # TODO: получать из профиля пользователя
    
    # Получаем статистику за текущий месяц
    month_start = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    requests_query = select(func.count(SystemLog.id)).where(
        and_(
            SystemLog.created_at >= month_start,
            SystemLog.user_id == user_id
        )
    )
    
    result = await db.execute(requests_query)
    monthly_requests = result.scalar() or 0
    
    # Рассчитываем стоимость
    billing_calc = BillingCalculator.calculate_cost(user_plan, monthly_requests)
    
    # Получаем историю платежей (заглушка)
    payment_history = [
        {
            "date": "2024-01-01",
            "amount": 1000,
            "status": "paid",
            "description": "Подписка Basic на январь 2024"
        }
    ]
    
    return BillingInfo(
        user_id=user_id,
        current_plan=user_plan,
        monthly_requests=monthly_requests,
        cost_breakdown=billing_calc,
        payment_history=payment_history,
        next_billing_date=datetime.utcnow().replace(day=1) + timedelta(days=32),
        balance=5000  # Заглушка - баланс в копейках
    )


@router.get("/billing/cost-breakdown", response_model=ApiCostBreakdown)
async def get_cost_breakdown(
    start_date: Optional[datetime] = Query(None, description="Начальная дата"),
    end_date: Optional[datetime] = Query(None, description="Конечная дата"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить детальную разбивку стоимости API"""
    
    await PermissionManager.require_permission(db, current_user.id, "analytics.read")
    
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()
    
    # Получаем статистику по эндпоинтам с расчетом стоимости
    endpoint_costs_query = select(
        SystemLog.endpoint,
        func.count(SystemLog.id).label('requests'),
        func.avg(SystemLog.response_time).label('avg_response_time')
    ).where(
        and_(
            SystemLog.created_at >= start_date,
            SystemLog.created_at <= end_date
        )
    ).group_by(SystemLog.endpoint)
    
    result = await db.execute(endpoint_costs_query)
    endpoint_data = result.fetchall()
    
    # Получаем план (заглушка)
    plan = "basic"
    rate = BillingCalculator.RATES[plan]
    
    # Рассчитываем стоимость для каждого эндпоинта
    endpoint_costs = []
    total_cost = 0
    
    for endpoint in endpoint_data:
        cost = endpoint.requests * rate["cost_per_request"]
        total_cost += cost
        
        endpoint_costs.append({
            "endpoint": endpoint.endpoint,
            "requests": endpoint.requests,
            "cost": cost,
            "cost_in_rubles": cost / 100,
            "avg_response_time": float(endpoint.avg_response_time or 0)
        })
    
    # Сортируем по стоимости
    endpoint_costs.sort(key=lambda x: x["cost"], reverse=True)
    
    return ApiCostBreakdown(
        period_start=start_date,
        period_end=end_date,
        total_cost=total_cost,
        total_cost_in_rubles=total_cost / 100,
        endpoint_costs=endpoint_costs,
        plan=plan,
        cost_per_request=rate["cost_per_request"]
    )


@router.get("/analytics/performance", response_model=Dict[str, Any])
async def get_performance_analytics(
    hours: int = Query(24, ge=1, le=168, description="Количество часов для анализа"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить аналитику производительности API"""
    
    await PermissionManager.require_permission(db, current_user.id, "analytics.read")
    
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Статистика по времени ответа
    response_time_query = select(
        func.avg(SystemLog.response_time).label('avg_response_time'),
        func.min(SystemLog.response_time).label('min_response_time'),
        func.max(SystemLog.response_time).label('max_response_time'),
        func.percentile_cont(0.95).within_group(SystemLog.response_time).label('p95_response_time')
    ).where(SystemLog.created_at >= start_time)
    
    result = await db.execute(response_time_query)
    response_stats = result.fetchone()
    
    # Статистика по ошибкам
    error_stats_query = select(
        func.count(SystemLog.id).label('total_requests'),
        func.count(SystemLog.id).filter(SystemLog.status_code >= 400).label('error_requests')
    ).where(SystemLog.created_at >= start_time)
    
    error_result = await db.execute(error_stats_query)
    error_stats = error_result.fetchone()
    
    error_rate = 0
    if error_stats.total_requests > 0:
        error_rate = (error_stats.error_requests / error_stats.total_requests) * 100
    
    # Статистика по часам
    hourly_query = select(
        func.date_trunc('hour', SystemLog.created_at).label('hour'),
        func.count(SystemLog.id).label('requests'),
        func.avg(SystemLog.response_time).label('avg_response_time')
    ).where(
        SystemLog.created_at >= start_time
    ).group_by(
        func.date_trunc('hour', SystemLog.created_at)
    ).order_by('hour')
    
    hourly_result = await db.execute(hourly_query)
    hourly_data = [
        {
            "hour": row.hour.isoformat(),
            "requests": row.requests,
            "avg_response_time": float(row.avg_response_time or 0)
        }
        for row in hourly_result.fetchall()
    ]
    
    return {
        "period_hours": hours,
        "response_time": {
            "average": float(response_stats.avg_response_time or 0),
            "minimum": float(response_stats.min_response_time or 0),
            "maximum": float(response_stats.max_response_time or 0),
            "p95": float(response_stats.p95_response_time or 0)
        },
        "error_rate": round(error_rate, 2),
        "total_requests": error_stats.total_requests,
        "error_requests": error_stats.error_requests,
        "hourly_data": hourly_data
    }


@router.get("/analytics/users", response_model=Dict[str, Any])
async def get_user_analytics(
    days: int = Query(30, ge=1, le=365, description="Количество дней для анализа"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить аналитику пользователей"""
    
    await PermissionManager.require_permission(db, current_user.id, "analytics.read")
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Общее количество пользователей
    total_users_query = select(func.count(User.id))
    total_result = await db.execute(total_users_query)
    total_users = total_result.scalar()
    
    # Активные пользователи за период
    active_users_query = select(func.count(func.distinct(SystemLog.user_id))).where(
        SystemLog.created_at >= start_date
    )
    active_result = await db.execute(active_users_query)
    active_users = active_result.scalar()
    
    # Новые пользователи за период
    new_users_query = select(func.count(User.id)).where(
        User.created_at >= start_date
    )
    new_result = await db.execute(new_users_query)
    new_users = new_result.scalar()
    
    # Топ пользователи по активности
    top_users_query = select(
        User.id,
        User.username,
        User.email,
        func.count(SystemLog.id).label('api_calls')
    ).join(
        SystemLog, User.id == SystemLog.user_id
    ).where(
        SystemLog.created_at >= start_date
    ).group_by(
        User.id, User.username, User.email
    ).order_by(desc('api_calls')).limit(10)
    
    top_result = await db.execute(top_users_query)
    top_users = [
        {
            "user_id": row.id,
            "username": row.username,
            "email": row.email,
            "api_calls": row.api_calls
        }
        for row in top_result.fetchall()
    ]
    
    return {
        "period_days": days,
        "total_users": total_users,
        "active_users": active_users,
        "new_users": new_users,
        "activity_rate": round((active_users / total_users * 100) if total_users > 0 else 0, 2),
        "top_users": top_users
    }


@router.post("/billing/upgrade-plan", response_model=SuccessResponse)
async def upgrade_plan(
    new_plan: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить план подписки"""
    
    if new_plan not in BillingCalculator.RATES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный план подписки"
        )
    
    # TODO: Реализовать логику обновления плана
    # Здесь должна быть интеграция с платежной системой
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "upgrade_plan", "billing", str(current_user.id),
        details={"new_plan": new_plan}
    )
    
    return SuccessResponse(message=f"План обновлен на {new_plan}")


@router.get("/billing/plans", response_model=List[Dict[str, Any]])
async def get_available_plans():
    """Получить доступные планы подписки"""
    
    plans = []
    for plan_name, plan_data in BillingCalculator.RATES.items():
        plans.append({
            "name": plan_name,
            "display_name": plan_name.title(),
            "requests_per_month": plan_data["requests_per_month"],
            "cost_per_request": plan_data["cost_per_request"],
            "cost_per_month": plan_data["cost_per_month"],
            "cost_per_month_rubles": plan_data["cost_per_month"] / 100,
            "unlimited": plan_data["requests_per_month"] == -1
        })
    
    return plans
