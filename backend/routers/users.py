from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from typing import List

from database import get_db
from models import User
from schemas import User as UserSchema, UserCreate, UserUpdate, PasswordReset
from routers.auth import get_current_user

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


@router.get("/", response_model=List[UserSchema])
async def read_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка всех активных пользователей (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(User).where(User.is_active == True))
    users = result.scalars().all()
    return users


@router.get("/chat-users/", response_model=List[UserSchema])
async def read_chat_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка всех активных пользователей для чата"""
    result = await db.execute(select(User).where(User.is_active == True))
    users = result.scalars().all()
    return users


@router.get("/deactivated/", response_model=List[UserSchema])
async def read_deactivated_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка всех деактивированных пользователей (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(User).where(User.is_active == False))
    users = result.scalars().all()
    return users


@router.post("/", response_model=UserSchema)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание нового пользователя (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Генерируем username если не указан
    if user_data.username:
        username = user_data.username
    else:
        username = f"{user_data.first_name.lower()}.{user_data.last_name.lower()}"
    
    # Проверяем, не существует ли уже пользователь с таким username или email
    result = await db.execute(
        select(User).where((User.username == username) | (User.email == user_data.email))
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        if existing_user.username == username:
            raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")
        else:
            raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    
    # Создаем нового пользователя
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=username,
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        middle_name=user_data.middle_name,
        hashed_password=hashed_password,
        role=user_data.role,
        phone=user_data.phone,
        department_id=user_data.department_id,
        position=user_data.position
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user


@router.get("/{user_id}", response_model=UserSchema)
async def read_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение пользователя по ID"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    return user


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление пользователя (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Обновляем поля
    update_data = user_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Деактивация пользователя (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя деактивировать самого себя")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Вместо удаления деактивируем пользователя
    user.is_active = False
    await db.commit()
    
    return {"message": "Пользователь успешно деактивирован"}


@router.post("/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Активация пользователя (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if user.is_active:
        raise HTTPException(status_code=400, detail="Пользователь уже активен")
    
    # Активируем пользователя
    user.is_active = True
    await db.commit()
    
    return {"message": "Пользователь успешно активирован"}


@router.post("/{user_id}/reset-password")
async def reset_user_password(
    user_id: int,
    password_data: PasswordReset,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Сброс пароля пользователя (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    if password_data.user_id != user_id:
        raise HTTPException(status_code=400, detail="ID пользователя не совпадает")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Обновляем пароль
    user.hashed_password = get_password_hash(password_data.new_password)
    await db.commit()
    
    return {"message": f"Пароль пользователя {user.username} успешно сброшен"}