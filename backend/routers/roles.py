from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from database import get_db
from models import User, Role, RolePermission, UserRoleAssignment, Permission
from schemas import (
    Role as RoleSchema, 
    RoleCreate, 
    RoleUpdate, 
    UserRoleAssignmentCreate,
    UserRoleAssignment as UserRoleAssignmentSchema
)
from routers.auth import get_current_user

router = APIRouter()


@router.get("/permissions", response_model=List[str])
async def get_permissions(
    current_user: User = Depends(get_current_user)
):
    """Получение списка всех доступных разрешений"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    return [permission.value for permission in Permission]


@router.get("/", response_model=List[RoleSchema])
async def read_roles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка всех ролей"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(
        select(Role)
        .options(selectinload(Role.permissions))
        .where(Role.is_active == True)
    )
    roles = result.scalars().all()
    
    # Формируем ответ с разрешениями
    roles_response = []
    for role in roles:
        role_dict = {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "is_system": role.is_system,
            "is_active": role.is_active,
            "created_at": role.created_at,
            "updated_at": role.updated_at,
            "permissions": [rp.permission.value for rp in role.permissions]
        }
        roles_response.append(role_dict)
    
    return roles_response


@router.post("/", response_model=RoleSchema)
async def create_role(
    role_data: RoleCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание новой роли"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Проверяем, не существует ли роль с таким именем
    result = await db.execute(select(Role).where(Role.name == role_data.name))
    existing_role = result.scalar_one_or_none()
    
    if existing_role:
        raise HTTPException(status_code=400, detail="Роль с таким именем уже существует")
    
    # Создаем роль
    db_role = Role(
        name=role_data.name,
        description=role_data.description,
        is_system=False
    )
    
    db.add(db_role)
    await db.commit()
    await db.refresh(db_role)
    
    # Добавляем разрешения
    for permission in role_data.permissions:
        role_permission = RolePermission(
            role_id=db_role.id,
            permission=permission
        )
        db.add(role_permission)
    
    await db.commit()
    
    # Получаем роль с разрешениями
    result = await db.execute(
        select(Role)
        .options(selectinload(Role.permissions))
        .where(Role.id == db_role.id)
    )
    role_with_permissions = result.scalar_one()
    
    return {
        "id": role_with_permissions.id,
        "name": role_with_permissions.name,
        "description": role_with_permissions.description,
        "is_system": role_with_permissions.is_system,
        "is_active": role_with_permissions.is_active,
        "created_at": role_with_permissions.created_at,
        "updated_at": role_with_permissions.updated_at,
        "permissions": [rp.permission.value for rp in role_with_permissions.permissions]
    }


@router.put("/{role_id}", response_model=RoleSchema)
async def update_role(
    role_id: int,
    role_data: RoleUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление роли"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(
        select(Role)
        .options(selectinload(Role.permissions))
        .where(Role.id == role_id)
    )
    role = result.scalar_one_or_none()
    
    if role is None:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    
    if role.is_system:
        raise HTTPException(status_code=400, detail="Системную роль нельзя изменять")
    
    # Обновляем основные поля
    update_data = role_data.dict(exclude_unset=True, exclude={"permissions"})
    for field, value in update_data.items():
        setattr(role, field, value)
    
    # Обновляем разрешения, если они переданы
    if role_data.permissions is not None:
        # Удаляем существующие разрешения
        await db.execute(
            "DELETE FROM role_permissions WHERE role_id = :role_id",
            {"role_id": role_id}
        )
        
        # Добавляем новые разрешения
        for permission in role_data.permissions:
            role_permission = RolePermission(
                role_id=role_id,
                permission=permission
            )
            db.add(role_permission)
    
    await db.commit()
    await db.refresh(role)
    
    # Получаем обновленную роль с разрешениями
    result = await db.execute(
        select(Role)
        .options(selectinload(Role.permissions))
        .where(Role.id == role_id)
    )
    updated_role = result.scalar_one()
    
    return {
        "id": updated_role.id,
        "name": updated_role.name,
        "description": updated_role.description,
        "is_system": updated_role.is_system,
        "is_active": updated_role.is_active,
        "created_at": updated_role.created_at,
        "updated_at": updated_role.updated_at,
        "permissions": [rp.permission.value for rp in updated_role.permissions]
    }


@router.delete("/{role_id}")
async def delete_role(
    role_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление роли"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(Role).where(Role.id == role_id))
    role = result.scalar_one_or_none()
    
    if role is None:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    
    if role.is_system:
        raise HTTPException(status_code=400, detail="Системную роль нельзя удалить")
    
    # Проверяем, не назначена ли роль пользователям
    result = await db.execute(
        select(UserRoleAssignment).where(UserRoleAssignment.role_id == role_id)
    )
    assignments = result.scalars().all()
    
    if assignments:
        raise HTTPException(
            status_code=400, 
            detail="Нельзя удалить роль, которая назначена пользователям"
        )
    
    await db.delete(role)
    await db.commit()
    
    return {"message": "Роль успешно удалена"}


@router.post("/assign", response_model=UserRoleAssignmentSchema)
async def assign_role_to_user(
    assignment_data: UserRoleAssignmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Назначение роли пользователю"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Проверяем существование пользователя и роли
    user_result = await db.execute(select(User).where(User.id == assignment_data.user_id))
    user = user_result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    role_result = await db.execute(select(Role).where(Role.id == assignment_data.role_id))
    role = role_result.scalar_one_or_none()
    
    if role is None:
        raise HTTPException(status_code=404, detail="Роль не найдена")
    
    # Проверяем, не назначена ли уже роль этому пользователю
    existing_result = await db.execute(
        select(UserRoleAssignment).where(
            (UserRoleAssignment.user_id == assignment_data.user_id) &
            (UserRoleAssignment.role_id == assignment_data.role_id)
        )
    )
    existing_assignment = existing_result.scalar_one_or_none()
    
    if existing_assignment:
        raise HTTPException(status_code=400, detail="Роль уже назначена этому пользователю")
    
    # Создаем назначение
    assignment = UserRoleAssignment(
        user_id=assignment_data.user_id,
        role_id=assignment_data.role_id,
        assigned_by=current_user.id
    )
    
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    
    return assignment


@router.delete("/assign/{assignment_id}")
async def remove_role_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление назначения роли пользователю"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(
        select(UserRoleAssignment).where(UserRoleAssignment.id == assignment_id)
    )
    assignment = result.scalar_one_or_none()
    
    if assignment is None:
        raise HTTPException(status_code=404, detail="Назначение роли не найдено")
    
    await db.delete(assignment)
    await db.commit()
    
    return {"message": "Назначение роли успешно удалено"}
