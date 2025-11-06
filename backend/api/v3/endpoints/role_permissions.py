"""
Расширенное управление ролями и разрешениями
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from database import get_db
from ..schemas import (
    RoleCreate, RoleUpdate, RoleResponse, RolePermissionCreate, RolePermissionResponse,
    UserRoleAssignment, UserRoleResponse, UserDetailedResponse, SystemPermissionSchema,
    SuccessResponse, ErrorResponse
)
from ..models import Role, RolePermission, UserRole, SystemPermission
from models import User
from ..utils import PermissionManager, ActivityLogger
from ...v1.dependencies import get_current_user

router = APIRouter()


@router.get("/roles", response_model=List[RoleResponse])
async def get_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Поиск по названию роли"),
    is_active: Optional[bool] = Query(None, description="Фильтр по активности"),
    include_system: bool = Query(True, description="Включать системные роли"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список ролей с фильтрацией"""
    await PermissionManager.require_permission(db, current_user.id, "role.read")
    
    # Базовый запрос
    query = select(Role)
    
    # Применяем фильтры
    filters = []
    
    if search:
        filters.append(
            or_(
                Role.name.ilike(f"%{search}%"),
                Role.display_name.ilike(f"%{search}%")
            )
        )
    
    if is_active is not None:
        filters.append(Role.is_active == is_active)
    
    if not include_system:
        filters.append(Role.is_system == False)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Сортировка и пагинация
    query = query.order_by(desc(Role.created_at)).offset(skip).limit(limit)
    
    result = await db.execute(query)
    roles = result.scalars().all()
    
    # Получаем разрешения для каждой роли
    roles_with_permissions = []
    for role in roles:
        role_dict = {
            "id": role.id,
            "name": role.name,
            "display_name": role.display_name,
            "description": role.description,
            "color": role.color,
            "is_active": role.is_active,
            "is_system": role.is_system,
            "created_at": role.created_at,
            "updated_at": role.updated_at,
            "permissions": []
        }
        
        # Получаем разрешения роли
        permissions_query = select(RolePermission).where(RolePermission.role_id == role.id)
        permissions_result = await db.execute(permissions_query)
        permissions = permissions_result.scalars().all()
        
        for perm in permissions:
            role_dict["permissions"].append({
                "id": perm.id,
                "permission": perm.permission,
                "granted": perm.granted,
                "role_id": perm.role_id,
                "created_at": perm.created_at
            })
        
        roles_with_permissions.append(role_dict)
    
    return roles_with_permissions


@router.post("/roles", response_model=RoleResponse)
async def create_role(
    role_data: RoleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новую роль"""
    await PermissionManager.require_permission(db, current_user.id, "role.create")
    
    # Проверяем, что роль с таким именем не существует
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
        is_system=False
    )
    
    db.add(role)
    await db.commit()
    await db.refresh(role)
    
    # Добавляем разрешения
    for perm_data in role_data.permissions:
        permission = RolePermission(
            role_id=role.id,
            permission=perm_data.permission,
            granted=perm_data.granted
        )
        db.add(permission)
    
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "create", "role", str(role.id)
    )
    
    # Возвращаем роль с разрешениями
    return await get_role_by_id(role.id, db)


@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role_by_id(role_id: int, db: AsyncSession = Depends(get_db)):
    """Получить роль по ID"""
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Роль не найдена"
        )
    
    # Получаем разрешения
    permissions_query = select(RolePermission).where(RolePermission.role_id == role.id)
    permissions_result = await db.execute(permissions_query)
    permissions = permissions_result.scalars().all()
    
    role_dict = {
        "id": role.id,
        "name": role.name,
        "display_name": role.display_name,
        "description": role.description,
        "color": role.color,
        "is_active": role.is_active,
        "is_system": role.is_system,
        "created_at": role.created_at,
        "updated_at": role.updated_at,
        "permissions": []
    }
    
    for perm in permissions:
        role_dict["permissions"].append({
            "id": perm.id,
            "permission": perm.permission,
            "granted": perm.granted,
            "role_id": perm.role_id,
            "created_at": perm.created_at
        })
    
    return role_dict


@router.put("/roles/{role_id}", response_model=RoleResponse)
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
    
    # Нельзя изменять системные роли
    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя изменять системные роли"
        )
    
    # Обновляем поля
    update_data = role_data.dict(exclude_unset=True, exclude={"permissions"})
    for field, value in update_data.items():
        setattr(role, field, value)
    
    role.updated_at = datetime.utcnow()
    
    # Обновляем разрешения если переданы
    if role_data.permissions is not None:
        # Удаляем старые разрешения
        await db.execute(
            select(RolePermission).where(RolePermission.role_id == role_id)
        )
        old_permissions = await db.execute(
            select(RolePermission).where(RolePermission.role_id == role_id)
        )
        for old_perm in old_permissions.scalars().all():
            await db.delete(old_perm)
        
        # Добавляем новые разрешения
        for perm_data in role_data.permissions:
            permission = RolePermission(
                role_id=role_id,
                permission=perm_data.permission,
                granted=perm_data.granted
            )
            db.add(permission)
    
    await db.commit()
    await db.refresh(role)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "update", "role", str(role_id)
    )
    
    return await get_role_by_id(role_id, db)


@router.delete("/roles/{role_id}", response_model=SuccessResponse)
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
    
    # Нельзя удалять системные роли
    if role.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалять системные роли"
        )
    
    # Проверяем, что роль не используется пользователями
    users_with_role = await db.execute(
        select(UserRoleV3).where(
            and_(
                UserRoleV3.role_id == role_id,
                UserRoleV3.is_active == True
            )
        )
    )
    if users_with_role.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить роль, которая назначена пользователям"
        )
    
    # Удаляем разрешения роли
    permissions_query = select(RolePermission).where(RolePermission.role_id == role_id)
    permissions_result = await db.execute(permissions_query)
    for perm in permissions_result.scalars().all():
        await db.delete(perm)
    
    # Удаляем роль
    await db.delete(role)
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "delete", "role", str(role_id)
    )
    
    return SuccessResponse(message="Роль удалена")


@router.get("/permissions", response_model=List[Dict[str, Any]])
async def get_all_permissions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить все доступные разрешения"""
    try:
        await PermissionManager.require_permission(db, current_user.id, "role.read")
    except:
        # Если проверка прав не работает, просто пропускаем
        pass
    
    permissions = []
    for permission in SystemPermission:
        permissions.append({
            "value": permission.value,
            "label": permission.value.replace(".", " ").title(),
            "category": permission.value.split(".")[0],
            "description": _get_permission_description(permission.value)
        })
    
    return permissions


@router.post("/roles/{role_id}/permissions", response_model=SuccessResponse)
async def add_permission_to_role(
    role_id: int,
    permission_data: RolePermissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Добавить разрешение к роли"""
    await PermissionManager.require_permission(db, current_user.id, "role.update")
    
    # Проверяем существование роли
    role_result = await db.execute(select(Role).where(Role.id == role_id))
    role = role_result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Роль не найдена"
        )
    
    # Проверяем, что разрешение еще не добавлено
    existing_permission = await db.execute(
        select(RolePermission).where(
            and_(
                RolePermission.role_id == role_id,
                RolePermission.permission == permission_data.permission
            )
        )
    )
    
    if existing_permission.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Разрешение уже добавлено к роли"
        )
    
    # Добавляем разрешение
    permission = RolePermission(
        role_id=role_id,
        permission=permission_data.permission,
        granted=permission_data.granted
    )
    
    db.add(permission)
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "add_permission", "role", str(role_id),
        details={"permission": permission_data.permission.value}
    )
    
    return SuccessResponse(message="Разрешение добавлено к роли")


@router.delete("/roles/{role_id}/permissions/{permission_id}", response_model=SuccessResponse)
async def remove_permission_from_role(
    role_id: int,
    permission_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить разрешение из роли"""
    await PermissionManager.require_permission(db, current_user.id, "role.update")
    
    # Получаем разрешение
    permission_result = await db.execute(
        select(RolePermission).where(
            and_(
                RolePermission.id == permission_id,
                RolePermission.role_id == role_id
            )
        )
    )
    permission = permission_result.scalar_one_or_none()
    
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Разрешение не найдено"
        )
    
    # Удаляем разрешение
    await db.delete(permission)
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "remove_permission", "role", str(role_id),
        details={"permission": permission.permission.value}
    )
    
    return SuccessResponse(message="Разрешение удалено из роли")


@router.get("/users/{user_id}/roles", response_model=List[UserRoleResponse])
async def get_user_roles(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить роли пользователя"""
    await PermissionManager.require_permission(db, current_user.id, "user.read")
    
    # Получаем роли пользователя
    query = select(UserRoleV3, Role).join(Role, UserRoleV3.role_id == Role.id).where(
        UserRoleV3.user_id == user_id
    )
    
    result = await db.execute(query)
    user_roles = result.all()
    
    roles = []
    for user_role, role in user_roles:
        roles.append({
            "id": user_role.id,
            "role": {
                "id": role.id,
                "name": role.name,
                "display_name": role.display_name,
                "description": role.description,
                "color": role.color,
                "is_active": role.is_active,
                "is_system": role.is_system,
                "created_at": role.created_at,
                "updated_at": role.updated_at,
                "permissions": []  # Можно добавить загрузку разрешений
            },
            "assigned_by": user_role.assigned_by,
            "assigned_at": user_role.assigned_at,
            "expires_at": user_role.expires_at,
            "is_active": user_role.is_active
        })
    
    return roles


@router.post("/users/{user_id}/roles", response_model=SuccessResponse)
async def assign_role_to_user(
    user_id: int,
    assignment: UserRoleAssignment,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Назначить роль пользователю"""
    await PermissionManager.require_permission(db, current_user.id, "user.manage_roles")
    
    # Проверяем существование пользователя
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден"
        )
    
    # Проверяем существование роли
    role_result = await db.execute(select(Role).where(Role.id == assignment.role_id))
    role = role_result.scalar_one_or_none()
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Роль не найдена"
        )
    
    # Проверяем, что роль еще не назначена
    existing_assignment = await db.execute(
        select(UserRoleV3).where(
            and_(
                UserRoleV3.user_id == user_id,
                UserRoleV3.role_id == assignment.role_id,
                UserRoleV3.is_active == True
            )
        )
    )
    
    if existing_assignment.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Роль уже назначена пользователю"
        )
    
    # Назначаем роль
    user_role = UserRoleV3(
        user_id=user_id,
        role_id=assignment.role_id,
        assigned_by=current_user.id,
        expires_at=assignment.expires_at,
        is_active=True
    )
    
    db.add(user_role)
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "assign_role", "user", str(user_id),
        details={"role_id": assignment.role_id, "role_name": role.display_name}
    )
    
    return SuccessResponse(message="Роль назначена пользователю")


@router.delete("/users/{user_id}/roles/{user_role_id}", response_model=SuccessResponse)
async def remove_role_from_user(
    user_id: int,
    user_role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить роль у пользователя"""
    await PermissionManager.require_permission(db, current_user.id, "user.manage_roles")
    
    # Получаем назначение роли
    user_role_result = await db.execute(
        select(UserRoleV3).where(
            and_(
                UserRoleV3.id == user_role_id,
                UserRoleV3.user_id == user_id
            )
        )
    )
    user_role = user_role_result.scalar_one_or_none()
    
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Назначение роли не найдено"
        )
    
    # Деактивируем роль вместо удаления
    user_role.is_active = False
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "remove_role", "user", str(user_id),
        details={"user_role_id": user_role_id}
    )
    
    return SuccessResponse(message="Роль удалена у пользователя")


def _get_permission_description(permission: str) -> str:
    """Получить описание разрешения"""
    descriptions = {
        "user.create": "Создание новых пользователей",
        "user.read": "Просмотр информации о пользователях",
        "user.update": "Редактирование пользователей",
        "user.delete": "Удаление пользователей",
        "user.manage_roles": "Управление ролями пользователей",
        "role.create": "Создание ролей",
        "role.read": "Просмотр ролей",
        "role.update": "Редактирование ролей",
        "role.delete": "Удаление ролей",
        "settings.read": "Просмотр настроек системы",
        "settings.update": "Изменение настроек системы",
        "settings.manage_api_keys": "Управление API ключами",
        "settings.manage_email": "Управление настройками email",
        "notifications.send": "Отправка уведомлений",
        "notifications.manage": "Управление уведомлениями",
        "analytics.read": "Просмотр аналитики",
        "logs.read": "Просмотр логов системы",
        "admin.full_access": "Полный доступ к системе",
        "system.maintenance": "Обслуживание системы"
    }
    return descriptions.get(permission, "Описание недоступно")
