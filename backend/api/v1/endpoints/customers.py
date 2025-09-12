from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import bcrypt

from database import get_db
from models import User, CustomerProfile, UserRole
from ..schemas import (
    CustomerRegistration,
    CustomerProfile as CustomerProfileSchema,
    CustomerProfileUpdate,
    UserResponse as UserSchema
)
from .auth import get_current_user

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("/register")
async def register_customer(
    customer_data: CustomerRegistration,
    db: AsyncSession = Depends(get_db)
):
    """Регистрация заказчика (компании)"""

    # Логируем входящие данные для отладки
    print(f"📝 Регистрация заказчика: {customer_data.dict()}")
    print(f"📧 Email компании: {customer_data.company_email}")
    print(f"👤 Контактное лицо: {customer_data.contact_person}")
    print(f"🏢 Компания: {customer_data.company_name}")

    # Проверяем, что email компании не занят
    result = await db.execute(select(User).where(User.email == customer_data.company_email))
    existing_user = result.scalars().first()
    if existing_user:
        print(f"❌ Email уже занят: {customer_data.company_email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )

    # Генерируем случайный пароль
    import secrets
    import string
    password_length = 12
    password_chars = string.ascii_letters + string.digits + "!@#$%^&*"
    generated_password = ''.join(secrets.choice(password_chars) for _ in range(password_length))
    
    # Создаем пользователя
    hashed_password = bcrypt.hashpw(
        generated_password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    # Генерируем уникальный username: фамилия контактного лица + домен в латинской раскладке
    # Разбираем контактное лицо на части (Фамилия Имя Отчество)
    contact_parts = customer_data.contact_person.strip().split()
    last_name = contact_parts[0] if contact_parts else "user"  # Фамилия или fallback

    # Получаем домен из email компании
    email_parts = customer_data.company_email.split('@')
    domain = email_parts[1] if len(email_parts) == 2 else "mail"

    # Конвертируем фамилию в латиницу (простая транслитерация)
    translit_map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    }

    # Конвертируем фамилию в латиницу
    latin_last_name = ''.join(translit_map.get(char, char) for char in last_name)
    # Убираем не-буквенные символы и приводим к нижнему регистру
    latin_last_name = ''.join(c for c in latin_last_name if c.isalnum()).lower()

    # Создаем username: фамилия_латиницей + домен
    username = f"{latin_last_name}_{domain}"
    print(f"🔤 Сгенерирован username: {username} (фамилия: {last_name} → {latin_last_name}, домен: {domain})")

    base_username = username
    counter = 1

    while True:
        result = await db.execute(select(User).where(User.username == username))
        if not result.scalars().first():
            break
        username = f"{base_username}_{counter}"
        counter += 1
        print(f"🔄 Username уже занят, пробуем: {username}")

    print(f"✅ Финальный username: {username}")

    # Для заказчиков используем данные контактного лица
    contact_parts = customer_data.contact_person.strip().split()
    first_name = contact_parts[1] if len(contact_parts) > 1 else contact_parts[0] if contact_parts else "Контактное"
    last_name = contact_parts[0] if contact_parts else "Лицо"

    print(f"👤 Создаем пользователя: {username} ({first_name} {last_name})")
    print(f"🔑 Сгенерированный пароль: {generated_password}")
    new_user = User(
        username=username,
        email=customer_data.company_email,
        hashed_password=hashed_password,
        first_name=first_name,
        last_name=last_name,
        middle_name=contact_parts[2] if len(contact_parts) > 2 else None,
        phone=customer_data.company_phone,
        role=UserRole.CUSTOMER,
        is_active=True
    )

    print(f"💾 Сохраняем пользователя в БД...")
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    print(f"✅ Пользователь сохранен: ID={new_user.id}, username={new_user.username}")

    # Создаем профиль заказчика
    print(f"🏢 Создаем профиль заказчика для компании: {customer_data.company_name}")
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
    print(f"✅ Профиль заказчика создан: ID={customer_profile.id}")

    # Обновляем связь в пользователе
    await db.refresh(new_user)
    print(f"🎉 Регистрация завершена успешно! Username: {new_user.username}")
    
    # Возвращаем данные с паролем для отображения пользователю
    return {
        "id": new_user.id,
        "username": new_user.username,
        "email": new_user.email,
        "first_name": new_user.first_name,
        "last_name": new_user.last_name,
        "middle_name": new_user.middle_name,
        "role": new_user.role,
        "is_active": new_user.is_active,
        "phone": new_user.phone,
        "created_at": new_user.created_at,
        "generated_password": generated_password
    }


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
