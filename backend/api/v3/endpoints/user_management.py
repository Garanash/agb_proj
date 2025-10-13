"""
Эндпоинты для детального управления пользователями
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from typing import List, Dict, Any, Optional
from database import get_db
from ..schemas import (
    UserDetailedResponse, UserUpdateV3, UserRoleAssignment,
    UserActivityResponse, SuccessResponse
)
from ..models import UserRole as UserRoleV3, Role, UserActivity
from ..utils import PermissionManager, ActivityLogger
from ...v1.dependencies import get_current_user
from models import User


router = APIRouter()


@router.get("/", response_model=List[UserDetailedResponse])
async def get_users_detailed(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Поиск по имени, email, username"),
    role_id: Optional[int] = Query(None, description="Фильтр по роли"),
    is_active: Optional[bool] = Query(None, description="Фильтр по активности"),
    department_id: Optional[int] = Query(None, description="Фильтр по отделу"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить детальный список пользователей с фильтрами"""
    await PermissionManager.require_permission(db, current_user.id, "user.read")
    
    # Базовый запрос
    query = select(User).order_by(desc(User.created_at))
    
    # Применяем фильтры
    if search:
        search_filter = or_(
            User.first_name.ilike(f"%{search}%"),
            User.last_name.ilike(f"%{search}%"),
            User.email.ilike(f"%{search}%"),
            User.username.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
    
    if is_active is not None:
        query = query.where(User.is_active == is_active)
    
    if department_id:
        query = query.where(User.department_id == department_id)
    
    # Фильтр по роли (из v3)
    if role_id:
        query = query.join(UserRoleV3).where(
            and_(
                UserRoleV3.role_id == role_id,
                UserRoleV3.is_active == True
            )
        )
    
    # Пагинация
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    users = result.scalars().all()
    
    # Получаем детальную информацию для каждого пользователя
    detailed_users = []
    for user in users:
        user_data = await _get_user_detailed_data(db, user)
        detailed_users.append(user_data)
    
    return detailed_users


@router.get("/{user_id}", response_model=UserDetailedResponse)
async def get_user_detailed(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить детальную информацию о пользователе"""
    await PermissionManager.require_permission(db, current_user.id, "user.read")
    
    # Получаем пользователя
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Получаем детальную информацию
    user_data = await _get_user_detailed_data(db, user)
    
    return user_data


@router.put("/{user_id}", response_model=UserDetailedResponse)
async def update_user_detailed(
    user_id: int,
    user_data: UserUpdateV3,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить пользователя с управлением ролями"""
    await PermissionManager.require_permission(db, current_user.id, "user.update")
    
    # Получаем пользователя
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Обновляем основные поля
    update_data = user_data.dict(exclude_unset=True, exclude={'roles'})
    
    for field, value in update_data.items():
        if hasattr(user, field):
            setattr(user, field, value)
    
    # Управление ролями
    if user_data.roles is not None:
        await PermissionManager.require_permission(db, current_user.id, "user.manage_roles")
        
        # Деактивируем текущие роли
        await db.execute(
            UserRoleV3.__table__.update().where(
                UserRoleV3.user_id == user_id
            ).values(is_active=False)
        )
        
        # Добавляем новые роли
        for role_id in user_data.roles:
            # Проверяем существование роли
            role_result = await db.execute(select(Role).where(Role.id == role_id))
            if not role_result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Роль с ID {role_id} не найдена"
                )
            
            # Проверяем, есть ли уже такая роль у пользователя
            existing_role = await db.execute(
                select(UserRoleV3).where(
                    and_(
                        UserRoleV3.user_id == user_id,
                        UserRoleV3.role_id == role_id
                    )
                )
            )
            
            existing = existing_role.scalar_one_or_none()
            if existing:
                # Активируем существующую роль
                existing.is_active = True
                existing.assigned_by = current_user.id
            else:
                # Создаем новую роль
                user_role = UserRoleV3(
                    user_id=user_id,
                    role_id=role_id,
                    assigned_by=current_user.id,
                    is_active=True
                )
                db.add(user_role)
    
    await db.commit()
    await db.refresh(user)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "update", "user", str(user_id),
        details={"updated_fields": list(update_data.keys())}
    )
    
    # Возвращаем обновленные данные
    user_detailed = await _get_user_detailed_data(db, user)
    return user_detailed


@router.post("/{user_id}/roles", response_model=SuccessResponse)
async def assign_user_role(
    user_id: int,
    role_assignment: UserRoleAssignment,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Назначить роль пользователю"""
    await PermissionManager.require_permission(db, current_user.id, "user.manage_roles")
    
    # Проверяем существование пользователя
    user_result = await db.execute(select(User).where(User.id == user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Проверяем существование роли
    role_result = await db.execute(select(Role).where(Role.id == role_assignment.role_id))
    if not role_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Роль не найдена"
        )
    
    # Проверяем, нет ли уже такой роли у пользователя
    existing_role = await db.execute(
        select(UserRoleV3).where(
            and_(
                UserRoleV3.user_id == user_id,
                UserRoleV3.role_id == role_assignment.role_id,
                UserRoleV3.is_active == True
            )
        )
    )
    
    if existing_role.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="У пользователя уже есть эта роль"
        )
    
    # Создаем назначение роли
    user_role = UserRoleV3(
        user_id=user_id,
        role_id=role_assignment.role_id,
        assigned_by=current_user.id,
        expires_at=role_assignment.expires_at,
        is_active=True
    )
    
    db.add(user_role)
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "assign_role", "user", str(user_id),
        details={"role_id": role_assignment.role_id}
    )
    
    return SuccessResponse(message="Роль назначена пользователю")


@router.delete("/{user_id}/roles/{role_id}", response_model=SuccessResponse)
async def revoke_user_role(
    user_id: int,
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отозвать роль у пользователя"""
    await PermissionManager.require_permission(db, current_user.id, "user.manage_roles")
    
    # Находим назначение роли
    result = await db.execute(
        select(UserRoleV3).where(
            and_(
                UserRoleV3.user_id == user_id,
                UserRoleV3.role_id == role_id,
                UserRoleV3.is_active == True
            )
        )
    )
    
    user_role = result.scalar_one_or_none()
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Назначение роли не найдено"
        )
    
    # Деактивируем роль
    user_role.is_active = False
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "revoke_role", "user", str(user_id),
        details={"role_id": role_id}
    )
    
    return SuccessResponse(message="Роль отозвана у пользователя")


@router.get("/{user_id}/activity", response_model=List[UserActivityResponse])
async def get_user_activity(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    action: Optional[str] = Query(None, description="Фильтр по действию"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить активность пользователя"""
    await PermissionManager.require_permission(db, current_user.id, "user.read")
    
    # Проверяем существование пользователя
    user_result = await db.execute(select(User).where(User.id == user_id))
    if not user_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Базовый запрос
    query = select(UserActivity).where(UserActivity.user_id == user_id).order_by(
        desc(UserActivity.created_at)
    )
    
    # Фильтр по действию
    if action:
        query = query.where(UserActivity.action == action)
    
    # Пагинация
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    activities = result.scalars().all()
    
    return activities


@router.post("/{user_id}/activate", response_model=SuccessResponse)
async def activate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Активировать пользователя"""
    await PermissionManager.require_permission(db, current_user.id, "user.update")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    user.is_active = True
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "activate", "user", str(user_id)
    )
    
    return SuccessResponse(message="Пользователь активирован")


@router.post("/{user_id}/deactivate", response_model=SuccessResponse)
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Деактивировать пользователя"""
    await PermissionManager.require_permission(db, current_user.id, "user.update")
    
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя деактивировать самого себя"
        )
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    user.is_active = False
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "deactivate", "user", str(user_id)
    )
    
    return SuccessResponse(message="Пользователь деактивирован")


async def _get_user_detailed_data(db: AsyncSession, user: User) -> UserDetailedResponse:
    """Получить детальные данные пользователя"""
    
    # Получаем роли пользователя
    roles_result = await db.execute(
        select(UserRoleV3, Role).join(Role).where(
            and_(
                UserRoleV3.user_id == user.id,
                UserRoleV3.is_active == True
            )
        ).order_by(UserRoleV3.assigned_at.desc())
    )
    
    user_roles = []
    for user_role, role in roles_result.fetchall():
        # Получаем разрешения роли
        permissions_result = await db.execute(
            select(role.permissions)
        )
        
        role_data = {
            "id": user_role.id,
            "role": role,
            "assigned_by": user_role.assigned_by,
            "assigned_at": user_role.assigned_at,
            "expires_at": user_role.expires_at,
            "is_active": user_role.is_active
        }
        user_roles.append(role_data)
    
    # Получаем профили
    customer_profile = None
    contractor_profile = None
    
    if user.customer_profile:
        customer_profile = {
            "id": user.customer_profile.id,
            "company_name": user.customer_profile.company_name,
            "contact_person": user.customer_profile.contact_person,
            "phone": user.customer_profile.phone,
            "email": user.customer_profile.email,
            "address": user.customer_profile.address,
            "inn": user.customer_profile.inn,
            "kpp": user.customer_profile.kpp,
            "ogrn": user.customer_profile.ogrn
        }
    
    if user.contractor_profile:
        contractor_profile = {
            "id": user.contractor_profile.id,
            "professional_info": user.contractor_profile.professional_info,
            "education": user.contractor_profile.education,
            "bank_name": user.contractor_profile.bank_name,
            "bank_account": user.contractor_profile.bank_account,
            "telegram_username": user.contractor_profile.telegram_username,
            "website": user.contractor_profile.website,
            "general_description": user.contractor_profile.general_description
        }
    
    # Статистика активности (упрощенная версия)
    activity_count = await db.execute(
        select(func.count(UserActivity.id)).where(UserActivity.user_id == user.id)
    )
    
    last_activity = await db.execute(
        select(UserActivity.created_at).where(
            and_(
                UserActivity.user_id == user.id,
                UserActivity.action == "login"
            )
        ).order_by(desc(UserActivity.created_at)).limit(1)
    )
    
    last_login = last_activity.scalar_one_or_none()
    login_count = activity_count.scalar_one_or_none() or 0
    
    return UserDetailedResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        middle_name=user.middle_name,
        phone=user.phone,
        position=user.position,
        avatar_url=user.avatar_url,
        is_active=user.is_active,
        is_password_changed=user.is_password_changed,
        created_at=user.created_at,
        updated_at=user.updated_at,
        roles=user_roles,
        customer_profile=customer_profile,
        contractor_profile=contractor_profile,
        last_login=last_login,
        login_count=login_count
    )
