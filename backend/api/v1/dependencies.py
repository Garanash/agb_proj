"""
API v1 - Общие зависимости и утилиты
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ...database import get_db
from ...models import User, UserRole
from ...dependencies import get_current_user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Получить текущего активного пользователя"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неактивный пользователь"
        )
    return current_user


async def get_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Получить пользователя с правами администратора"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав доступа"
        )
    return current_user


async def get_manager_or_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Получить пользователя с правами менеджера или администратора"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав доступа"
        )
    return current_user


async def get_contractor_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Получить пользователя-исполнителя"""
    if current_user.role != UserRole.CONTRACTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ только для исполнителей"
        )
    return current_user


async def get_customer_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Получить пользователя-заказчика"""
    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ только для заказчиков"
        )
    return current_user
