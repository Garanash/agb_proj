"""
Эндпоинты для системных уведомлений
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from typing import List, Dict, Any, Optional
from database import get_db
from ..schemas import (
    NotificationCreate, NotificationUpdate, NotificationResponse,
    SuccessResponse
)
from ..models import SystemNotification, UserRole as UserRoleV3
from ..utils import PermissionManager, ActivityLogger, safe_json_loads, safe_json_dumps
from ...v1.dependencies import get_current_user
from models import User
from datetime import datetime


router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    notification_type: Optional[str] = Query(None, regex=r'^(info|warning|error|success)$'),
    is_system_wide: Optional[bool] = Query(None),
    priority: Optional[int] = Query(None, ge=1, le=3),
    only_active: bool = Query(True, description="Показывать только активные уведомления"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список уведомлений для текущего пользователя"""
    
    # Базовый запрос
    query = select(SystemNotification).order_by(
        desc(SystemNotification.priority),
        desc(SystemNotification.created_at)
    )
    
    # Фильтр по активности (не истекшие)
    if only_active:
        query = query.where(
            or_(
                SystemNotification.expires_at.is_(None),
                SystemNotification.expires_at > datetime.utcnow()
            )
        )
    
    # Фильтры
    if notification_type:
        query = query.where(SystemNotification.notification_type == notification_type)
    
    if is_system_wide is not None:
        query = query.where(SystemNotification.is_system_wide == is_system_wide)
    
    if priority:
        query = query.where(SystemNotification.priority == priority)
    
    # Фильтр по целевой аудитории
    # Показываем уведомления, которые:
    # 1. Предназначены для всех (is_system_wide=True)
    # 2. Предназначены конкретно для этого пользователя
    # 3. Предназначены для ролей пользователя
    
    # Получаем роли пользователя
    user_roles_result = await db.execute(
        select(UserRoleV3.role_id).where(
            and_(
                UserRoleV3.user_id == current_user.id,
                UserRoleV3.is_active == True
            )
        )
    )
    user_role_ids = [row[0] for row in user_roles_result.fetchall()]
    
    # Строим условие для целевой аудитории
    audience_conditions = [
        SystemNotification.is_system_wide == True
    ]
    
    # Уведомления для конкретных пользователей
    audience_conditions.append(
        SystemNotification.target_users.contains([current_user.id])
    )
    
    # Уведомления для ролей пользователя
    if user_role_ids:
        for role_id in user_role_ids:
            audience_conditions.append(
                SystemNotification.target_roles.contains([role_id])
            )
    
    query = query.where(or_(*audience_conditions))
    
    # Пагинация
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    return notifications


@router.post("/", response_model=NotificationResponse)
async def create_notification(
    notification_data: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать системное уведомление"""
    await PermissionManager.require_permission(db, current_user.id, "notifications.send")
    
    # Валидация целевой аудитории
    if not notification_data.is_system_wide and not notification_data.target_users and not notification_data.target_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Необходимо указать целевую аудиторию: пользователей, роли или сделать уведомление системным"
        )
    
    # Создаем уведомление
    notification = SystemNotification(
        title=notification_data.title,
        message=notification_data.message,
        notification_type=notification_data.notification_type,
        target_users=notification_data.target_users,
        target_roles=notification_data.target_roles,
        is_system_wide=notification_data.is_system_wide,
        priority=notification_data.priority,
        expires_at=notification_data.expires_at,
        is_read={},  # Пустой словарь для отслеживания прочтения
        created_by=current_user.id
    )
    
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "create", "notification", str(notification.id),
        details={
            "title": notification_data.title,
            "type": notification_data.notification_type,
            "is_system_wide": notification_data.is_system_wide
        }
    )
    
    return notification


@router.put("/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: int,
    notification_data: NotificationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить уведомление"""
    await PermissionManager.require_permission(db, current_user.id, "notifications.manage")
    
    # Получаем уведомление
    result = await db.execute(
        select(SystemNotification).where(SystemNotification.id == notification_id)
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Уведомление не найдено"
        )
    
    # Проверяем права на редактирование
    if notification.created_by != current_user.id:
        await PermissionManager.require_permission(db, current_user.id, "admin.full_access")
    
    # Обновляем поля
    update_data = notification_data.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(notification, field, value)
    
    await db.commit()
    await db.refresh(notification)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "update", "notification", str(notification_id)
    )
    
    return notification


@router.delete("/{notification_id}", response_model=SuccessResponse)
async def delete_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить уведомление"""
    await PermissionManager.require_permission(db, current_user.id, "notifications.manage")
    
    # Получаем уведомление
    result = await db.execute(
        select(SystemNotification).where(SystemNotification.id == notification_id)
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Уведомление не найдено"
        )
    
    # Проверяем права на удаление
    if notification.created_by != current_user.id:
        await PermissionManager.require_permission(db, current_user.id, "admin.full_access")
    
    await db.delete(notification)
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "delete", "notification", str(notification_id)
    )
    
    return SuccessResponse(message="Уведомление удалено")


@router.post("/{notification_id}/mark-read", response_model=SuccessResponse)
async def mark_notification_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отметить уведомление как прочитанное"""
    
    # Получаем уведомление
    result = await db.execute(
        select(SystemNotification).where(SystemNotification.id == notification_id)
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Уведомление не найдено"
        )
    
    # Проверяем, что уведомление предназначено для пользователя
    user_roles_result = await db.execute(
        select(UserRoleV3.role_id).where(
            and_(
                UserRoleV3.user_id == current_user.id,
                UserRoleV3.is_active == True
            )
        )
    )
    user_role_ids = [row[0] for row in user_roles_result.fetchall()]
    
    is_target_user = (
        notification.is_system_wide or
        (notification.target_users and current_user.id in notification.target_users) or
        (notification.target_roles and any(role_id in notification.target_roles for role_id in user_role_ids))
    )
    
    if not is_target_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Уведомление не предназначено для вас"
        )
    
    # Отмечаем как прочитанное
    is_read = notification.is_read or {}
    is_read[str(current_user.id)] = True
    notification.is_read = is_read
    
    await db.commit()
    
    return SuccessResponse(message="Уведомление отмечено как прочитанное")


@router.post("/mark-all-read", response_model=SuccessResponse)
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отметить все уведомления пользователя как прочитанные"""
    
    # Получаем роли пользователя
    user_roles_result = await db.execute(
        select(UserRoleV3.role_id).where(
            and_(
                UserRoleV3.user_id == current_user.id,
                UserRoleV3.is_active == True
            )
        )
    )
    user_role_ids = [row[0] for row in user_roles_result.fetchall()]
    
    # Получаем все активные уведомления для пользователя
    audience_conditions = [
        SystemNotification.is_system_wide == True
    ]
    
    if user_role_ids:
        for role_id in user_role_ids:
            audience_conditions.append(
                SystemNotification.target_roles.contains([role_id])
            )
    
    audience_conditions.append(
        SystemNotification.target_users.contains([current_user.id])
    )
    
    query = select(SystemNotification).where(
        and_(
            or_(*audience_conditions),
            or_(
                SystemNotification.expires_at.is_(None),
                SystemNotification.expires_at > datetime.utcnow()
            )
        )
    )
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    # Отмечаем все как прочитанные
    for notification in notifications:
        is_read = notification.is_read or {}
        is_read[str(current_user.id)] = True
        notification.is_read = is_read
    
    await db.commit()
    
    return SuccessResponse(message=f"Отмечено как прочитанное {len(notifications)} уведомлений")


@router.get("/unread-count", response_model=Dict[str, int])
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить количество непрочитанных уведомлений"""
    
    # Получаем роли пользователя
    user_roles_result = await db.execute(
        select(UserRoleV3.role_id).where(
            and_(
                UserRoleV3.user_id == current_user.id,
                UserRoleV3.is_active == True
            )
        )
    )
    user_role_ids = [row[0] for row in user_roles_result.fetchall()]
    
    # Получаем все активные уведомления для пользователя
    audience_conditions = [
        SystemNotification.is_system_wide == True
    ]
    
    if user_role_ids:
        for role_id in user_role_ids:
            audience_conditions.append(
                SystemNotification.target_roles.contains([role_id])
            )
    
    audience_conditions.append(
        SystemNotification.target_users.contains([current_user.id])
    )
    
    query = select(SystemNotification).where(
        and_(
            or_(*audience_conditions),
            or_(
                SystemNotification.expires_at.is_(None),
                SystemNotification.expires_at > datetime.utcnow()
            )
        )
    )
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    # Подсчитываем непрочитанные
    unread_count = 0
    for notification in notifications:
        is_read = notification.is_read or {}
        if not is_read.get(str(current_user.id), False):
            unread_count += 1
    
    return {"unread_count": unread_count}


@router.get("/admin/all", response_model=List[NotificationResponse])
async def get_all_notifications_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    created_by: Optional[int] = Query(None, description="Фильтр по создателю"),
    notification_type: Optional[str] = Query(None, regex=r'^(info|warning|error|success)$'),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все уведомления (для администраторов)"""
    await PermissionManager.require_permission(db, current_user.id, "notifications.manage")
    
    # Базовый запрос
    query = select(SystemNotification).order_by(desc(SystemNotification.created_at))
    
    # Фильтры
    if created_by:
        query = query.where(SystemNotification.created_by == created_by)
    
    if notification_type:
        query = query.where(SystemNotification.notification_type == notification_type)
    
    # Пагинация
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    return notifications


@router.post("/send-mass", response_model=SuccessResponse)
async def send_mass_notification(
    notification_data: NotificationCreate,
    send_email: bool = Query(False, description="Отправить также по email"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отправить массовое уведомление"""
    await PermissionManager.require_permission(db, current_user.id, "notifications.manage")
    
    # Создаем уведомление
    notification_response = await create_notification(notification_data, db, current_user)
    
    # TODO: Если send_email=True, отправить также по электронной почте
    # Здесь можно добавить логику отправки email уведомлений
    
    return SuccessResponse(
        message=f"Массовое уведомление создано (ID: {notification_response.id})"
    )
