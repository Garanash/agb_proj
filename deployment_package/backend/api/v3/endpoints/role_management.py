"""
Эндпоинты для управления ролями и разрешениями
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List, Dict, Any, Optional
from database import get_db
from ..schemas import (
    RoleCreate, RoleUpdate, RoleResponse, 
    SystemPermissionSchema, SuccessResponse
)
from ..models import Role, RolePermission, UserRole as UserRoleV3, SystemPermission
from ..utils import PermissionManager, ActivityLogger
from ...v1.dependencies import get_current_user
from models import User


router = APIRouter()


@router.get("/", response_model=List[RoleResponse])
async def get_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Поиск по названию роли"),
    is_active: Optional[bool] = Query(None, description="Фильтр по активности"),
    include_system: bool = Query(True, description="Включать системные роли"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список ролей"""
    await PermissionManager.require_permission(db, current_user.id, "role.read")
    
    # Базовый запрос
    query = select(Role).order_by(Role.created_at.desc())
    
    # Применяем фильтры
    if search:
        query = query.where(Role.display_name.ilike(f"%{search}%"))
    
    if is_active is not None:
        query = query.where(Role.is_active == is_active)
    
    if not include_system:
        query = query.where(Role.is_system == False)
    
    # Пагинация
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    roles = result.scalars().all()
    
    # Получаем разрешения для каждой роли
    roles_with_permissions = []
    for role in roles:
        permissions_result = await db.execute(
            select(RolePermission).where(RolePermission.role_id == role.id)
        )
        permissions = permissions_result.scalars().all()
        
        role_dict = role.__dict__.copy()
        role_dict['permissions'] = permissions
        roles_with_permissions.append(RoleResponse(**role_dict))
    
    return roles_with_permissions


@router.get("/permissions", response_model=List[Dict[str, str]])
async def get_available_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список доступных разрешений"""
    await PermissionManager.require_permission(db, current_user.id, "role.read")
    
    permissions = []
    for permission in SystemPermission:
        permissions.append({
            "value": permission.value,
            "name": permission.value,
            "description": _get_permission_description(permission.value)
        })
    
    return permissions


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить роль по ID"""
    await PermissionManager.require_permission(db, current_user.id, "role.read")
    
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Роль не найдена"
        )
    
    # Получаем разрешения роли
    permissions_result = await db.execute(
        select(RolePermission).where(RolePermission.role_id == role_id)
    )
    permissions = permissions_result.scalars().all()
    
    role_dict = role.__dict__.copy()
    role_dict['permissions'] = permissions
    
    return RoleResponse(**role_dict)


@router.post("/", response_model=RoleResponse)
async def create_role(
    role_data: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новую роль"""
    await PermissionManager.require_permission(db, current_user.id, "role.create")
    
    # Проверяем уникальность имени роли
    existing_role = await db.execute(
        select(Role).where(Role.name == role_data.name)
    )
    
    if existing_role.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Роль с таким именем уже существует"
        )
    
    # Создаем роль
    role = Role(
        name=role_data.name,
        display_name=role_data.display_name,
        description=role_data.description,
        color=role_data.color,
        is_active=role_data.is_active,
        is_system=False  # Созданные пользователем роли не являются системными
    )
    
    db.add(role)
    await db.flush()  # Получаем ID роли
    
    # Добавляем разрешения
    permissions = []
    for permission_data in role_data.permissions:
        role_permission = RolePermission(
            role_id=role.id,
            permission=permission_data.permission.value,
            granted=permission_data.granted
        )
        db.add(role_permission)
        permissions.append(role_permission)
    
    await db.commit()
    await db.refresh(role)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "create", "role", str(role.id),
        details={"role_name": role_data.name}
    )
    
    # Возвращаем роль с разрешениями
    role_dict = role.__dict__.copy()
    role_dict['permissions'] = permissions
    
    return RoleResponse(**role_dict)


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    role_data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить роль"""
    await PermissionManager.require_permission(db, current_user.id, "role.update")
    
    # Получаем роль
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Роль не найдена"
        )
    
    # Проверяем, можно ли редактировать системную роль
    if role.is_system:
        # Системные роли можно редактировать только с полными правами администратора
        await PermissionManager.require_permission(db, current_user.id, "admin.full_access")
    
    # Обновляем основные поля
    update_data = role_data.dict(exclude_unset=True, exclude={'permissions'})
    
    for field, value in update_data.items():
        setattr(role, field, value)
    
    # Обновляем разрешения, если они переданы
    if role_data.permissions is not None:
        # Удаляем существующие разрешения
        await db.execute(
            RolePermission.__table__.delete().where(
                RolePermission.role_id == role_id
            )
        )
        
        # Добавляем новые разрешения
        for permission_data in role_data.permissions:
            role_permission = RolePermission(
                role_id=role.id,
                permission=permission_data.permission.value,
                granted=permission_data.granted
            )
            db.add(role_permission)
    
    await db.commit()
    await db.refresh(role)
    
    # Получаем обновленные разрешения
    permissions_result = await db.execute(
        select(RolePermission).where(RolePermission.role_id == role_id)
    )
    permissions = permissions_result.scalars().all()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "update", "role", str(role_id),
        details={"updated_fields": list(update_data.keys())}
    )
    
    # Возвращаем роль с разрешениями
    role_dict = role.__dict__.copy()
    role_dict['permissions'] = permissions
    
    return RoleResponse(**role_dict)


@router.delete("/{role_id}", response_model=SuccessResponse)
async def delete_role(
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить роль"""
    await PermissionManager.require_permission(db, current_user.id, "role.delete")
    
    # Получаем роль
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Роль не найдена"
        )
    
    # Проверяем, можно ли удалить системную роль
    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Системные роли нельзя удалять"
        )
    
    # Проверяем, используется ли роль
    users_with_role = await db.execute(
        select(func.count(UserRoleV3.id)).where(
            and_(
                UserRoleV3.role_id == role_id,
                UserRoleV3.is_active == True
            )
        )
    )
    
    count = users_with_role.scalar_one_or_none() or 0
    if count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Роль используется {count} пользователями. Сначала отзовите роль у всех пользователей."
        )
    
    # Удаляем роль и связанные разрешения
    await db.delete(role)
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "delete", "role", str(role_id),
        details={"role_name": role.name}
    )
    
    return SuccessResponse(message="Роль удалена")


@router.get("/{role_id}/users", response_model=List[Dict[str, Any]])
async def get_role_users(
    role_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить пользователей с определенной ролью"""
    await PermissionManager.require_permission(db, current_user.id, "role.read")
    
    # Проверяем существование роли
    role_result = await db.execute(select(Role).where(Role.id == role_id))
    if not role_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Роль не найдена"
        )
    
    # Получаем пользователей с этой ролью
    query = select(UserRoleV3, User).join(User).where(
        and_(
            UserRoleV3.role_id == role_id,
            UserRoleV3.is_active == True
        )
    ).order_by(UserRoleV3.assigned_at.desc())
    
    # Пагинация
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    user_roles = result.fetchall()
    
    users_data = []
    for user_role, user in user_roles:
        user_data = {
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_active": user.is_active,
            "assigned_at": user_role.assigned_at,
            "expires_at": user_role.expires_at,
            "assigned_by": user_role.assigned_by
        }
        users_data.append(user_data)
    
    return users_data


@router.post("/{role_id}/clone", response_model=RoleResponse)
async def clone_role(
    role_id: int,
    new_name: str = Query(..., description="Имя для новой роли"),
    new_display_name: str = Query(..., description="Отображаемое имя для новой роли"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Клонировать роль"""
    await PermissionManager.require_permission(db, current_user.id, "role.create")
    
    # Получаем исходную роль
    result = await db.execute(select(Role).where(Role.id == role_id))
    source_role = result.scalar_one_or_none()
    
    if not source_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Исходная роль не найдена"
        )
    
    # Проверяем уникальность нового имени
    existing_role = await db.execute(
        select(Role).where(Role.name == new_name)
    )
    
    if existing_role.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Роль с таким именем уже существует"
        )
    
    # Создаем новую роль
    new_role = Role(
        name=new_name,
        display_name=new_display_name,
        description=f"Клон роли '{source_role.display_name}'",
        color=source_role.color,
        is_active=True,
        is_system=False
    )
    
    db.add(new_role)
    await db.flush()
    
    # Копируем разрешения
    permissions_result = await db.execute(
        select(RolePermission).where(RolePermission.role_id == role_id)
    )
    source_permissions = permissions_result.scalars().all()
    
    new_permissions = []
    for source_permission in source_permissions:
        new_permission = RolePermission(
            role_id=new_role.id,
            permission=source_permission.permission,
            granted=source_permission.granted
        )
        db.add(new_permission)
        new_permissions.append(new_permission)
    
    await db.commit()
    await db.refresh(new_role)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "clone", "role", str(new_role.id),
        details={"source_role_id": role_id, "new_role_name": new_name}
    )
    
    # Возвращаем новую роль с разрешениями
    role_dict = new_role.__dict__.copy()
    role_dict['permissions'] = new_permissions
    
    return RoleResponse(**role_dict)


def _get_permission_description(permission: str) -> str:
    """Получить описание разрешения"""
    descriptions = {
        "user.create": "Создание пользователей",
        "user.read": "Просмотр пользователей",
        "user.update": "Редактирование пользователей",
        "user.delete": "Удаление пользователей",
        "user.manage_roles": "Управление ролями пользователей",
        "role.create": "Создание ролей",
        "role.read": "Просмотр ролей",
        "role.update": "Редактирование ролей",
        "role.delete": "Удаление ролей",
        "settings.read": "Просмотр настроек",
        "settings.update": "Изменение настроек",
        "settings.manage_api_keys": "Управление API ключами",
        "settings.manage_email": "Управление настройками почты",
        "notifications.send": "Отправка уведомлений",
        "notifications.manage": "Управление уведомлениями",
        "analytics.read": "Просмотр аналитики",
        "logs.read": "Просмотр логов",
        "admin.full_access": "Полный доступ администратора",
        "system.maintenance": "Системное обслуживание"
    }
    
    return descriptions.get(permission, permission)
