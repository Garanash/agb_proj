from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import bcrypt

from database import get_db
from models import User, CustomerProfile, UserRole
from schemas import (
    CustomerRegistration,
    CustomerProfile as CustomerProfileSchema,
    CustomerProfileUpdate,
    User as UserSchema
)
from dependencies import get_current_user

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("/register", response_model=UserSchema)
async def register_customer(
    customer_data: CustomerRegistration,
    db: AsyncSession = Depends(get_db)
):
    """Регистрация заказчика (компании)"""

    # Проверяем, что email не занят
    result = await db.execute(select(User).where(User.email == customer_data.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )

    # Создаем пользователя
    hashed_password = bcrypt.hashpw(
        customer_data.password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    # Генерируем уникальный username из email
    username = customer_data.email.split('@')[0]
    base_username = username
    counter = 1

    while True:
        result = await db.execute(select(User).where(User.username == username))
        if not result.scalars().first():
            break
        username = f"{base_username}_{counter}"
        counter += 1

    new_user = User(
        username=username,
        email=customer_data.email,
        hashed_password=hashed_password,
        first_name=customer_data.first_name,
        last_name=customer_data.last_name,
        middle_name=customer_data.middle_name,
        phone=customer_data.phone,
        role=UserRole.CUSTOMER,
        is_active=True
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Создаем профиль заказчика
    customer_profile = CustomerProfile(
        user_id=new_user.id,
        company_name=customer_data.company_name,
        contact_person=customer_data.contact_person,
        phone=customer_data.company_phone,
        email=customer_data.company_email,
        address=customer_data.address,
        inn=customer_data.inn,
        kpp=customer_data.kpp,
        ogrn=customer_data.ogrn
    )

    db.add(customer_profile)
    await db.commit()
    await db.refresh(customer_profile)

    # Обновляем связь в пользователе
    await db.refresh(new_user)
    return new_user


@router.get("/profile", response_model=CustomerProfileSchema)
async def get_customer_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить профиль заказчика"""

    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен"
        )

    result = await db.execute(
        select(CustomerProfile).where(CustomerProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль не найден"
        )

    return profile


@router.put("/profile", response_model=CustomerProfileSchema)
async def update_customer_profile(
    profile_update: CustomerProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить профиль заказчика"""

    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен"
        )

    result = await db.execute(
        select(CustomerProfile).where(CustomerProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль не найден"
        )

    # Обновляем поля
    for field, value in profile_update.dict(exclude_unset=True).items():
        if hasattr(profile, field):
            setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)

    return profile
