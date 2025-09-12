from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from database import get_db
from models import User, TeamMember
from ..schemas import (
    TeamMember as TeamMemberSchema,
    TeamMemberCreate,
    TeamMemberUpdate,
    TeamMemberWithUser
)
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[TeamMemberWithUser])
async def get_team_members(
    db: AsyncSession = Depends(get_db),
    show_all: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Получение списка членов команды"""
    query = select(TeamMember).options(selectinload(TeamMember.user))
    
    # Если не админ, показываем только видимых членов команды
    if current_user.role != "admin" or not show_all:
        query = query.where(TeamMember.is_visible == True)
    
    query = query.order_by(TeamMember.order_index)
    
    result = await db.execute(query)
    team_members = result.scalars().all()
    
    return team_members


@router.post("/", response_model=TeamMemberSchema)
async def create_team_member(
    team_data: TeamMemberCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Добавление члена команды (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Проверяем, существует ли пользователь
    user_result = await db.execute(select(User).where(User.id == team_data.user_id))
    user = user_result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Проверяем, не добавлен ли уже этот пользователь в команду
    existing_result = await db.execute(
        select(TeamMember).where(TeamMember.user_id == team_data.user_id)
    )
    existing_member = existing_result.scalar_one_or_none()
    
    if existing_member:
        raise HTTPException(status_code=400, detail="Пользователь уже добавлен в команду")
    
    # Создаем запись о члене команды
    team_member = TeamMember(
        user_id=team_data.user_id,
        title=team_data.title,
        description=team_data.description,
        order_index=team_data.order_index,
        is_visible=team_data.is_visible
    )
    
    db.add(team_member)
    await db.commit()
    await db.refresh(team_member)
    
    return team_member


@router.put("/{member_id}", response_model=TeamMemberSchema)
async def update_team_member(
    member_id: int,
    team_data: TeamMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление информации о члене команды (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(TeamMember).where(TeamMember.id == member_id))
    team_member = result.scalar_one_or_none()
    
    if team_member is None:
        raise HTTPException(status_code=404, detail="Член команды не найден")
    
    # Обновляем поля
    update_data = team_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(team_member, field, value)
    
    await db.commit()
    await db.refresh(team_member)
    
    return team_member


@router.delete("/{member_id}")
async def remove_team_member(
    member_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление члена команды (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(TeamMember).where(TeamMember.id == member_id))
    team_member = result.scalar_one_or_none()
    
    if team_member is None:
        raise HTTPException(status_code=404, detail="Член команды не найден")
    
    await db.delete(team_member)
    await db.commit()
    
    return {"message": "Член команды успешно удален"}


@router.post("/{member_id}/reorder")
async def reorder_team_member(
    member_id: int,
    new_order: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Изменение порядка отображения члена команды"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(TeamMember).where(TeamMember.id == member_id))
    team_member = result.scalar_one_or_none()
    
    if team_member is None:
        raise HTTPException(status_code=404, detail="Член команды не найден")
    
    team_member.order_index = new_order
    await db.commit()
    
    return {"message": "Порядок отображения успешно обновлен"}
