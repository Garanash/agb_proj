from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import bcrypt
import os
import shutil
import uuid
from pathlib import Path

from database import get_db
from models import User, ContractorProfile, UserRole
from schemas import (
    ContractorRegistration,
    ContractorProfile as ContractorProfileSchema,
    ContractorProfileUpdate,
    User as UserSchema
)
from dependencies import get_current_user

router = APIRouter(prefix="/contractors", tags=["contractors"])

# Настройки для загрузки файлов
UPLOAD_DIR = Path("uploads")
PROFILES_DIR = UPLOAD_DIR / "profiles"
PORTFOLIO_DIR = UPLOAD_DIR / "portfolio"
DOCUMENTS_DIR = UPLOAD_DIR / "documents"

# Создаем директории если они не существуют
for dir_path in [PROFILES_DIR, PORTFOLIO_DIR, DOCUMENTS_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB на файл
MAX_TOTAL_SIZE = 200 * 1024 * 1024  # 200MB всего на пользователя

async def save_upload_file(upload_file: UploadFile, destination_dir: Path, filename: str) -> str:
    """Сохраняет загруженный файл и возвращает путь к нему"""
    file_path = destination_dir / filename

    # Проверяем размер файла
    file_content = await upload_file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Размер файла превышает {MAX_FILE_SIZE // (1024*1024)}МБ"
        )

    # Сохраняем файл
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    return str(file_path.relative_to(UPLOAD_DIR))

async def check_total_size(user_files: List[dict], new_files: List[bytes]) -> None:
    """Проверяет общий размер файлов пользователя"""
    current_size = sum(file.get('size', 0) for file in user_files)
    new_size = sum(len(file_content) for file_content in new_files)

    if current_size + new_size > MAX_TOTAL_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Общий размер файлов превышает {MAX_TOTAL_SIZE // (1024*1024)}МБ"
        )

async def get_file_size(file: UploadFile) -> int:
    """Получает размер файла без изменения позиции указателя"""
    # Сохраняем текущую позицию
    current_position = file.file.tell() if hasattr(file.file, 'tell') else 0

    # Переходим в конец файла
    file.file.seek(0, 2)
    file_size = file.file.tell()

    # Возвращаемся на исходную позицию
    file.file.seek(current_position)

    return file_size


@router.post("/register", response_model=UserSchema)
async def register_contractor(
    contractor_data: ContractorRegistration,
    db: AsyncSession = Depends(get_db)
):
    """Регистрация исполнителя (физлица)"""

    # Проверяем, что email не занят
    result = await db.execute(select(User).where(User.email == contractor_data.email))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Пользователь с таким email уже существует"
        )

    # Создаем пользователя
    hashed_password = bcrypt.hashpw(
        contractor_data.password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    # Генерируем уникальный username из email
    username = contractor_data.email.split('@')[0]
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
        email=contractor_data.email,
        hashed_password=hashed_password,
        first_name=contractor_data.first_name,
        last_name=contractor_data.last_name,
        middle_name=contractor_data.middle_name,
        phone=contractor_data.phone,
        role=UserRole.CONTRACTOR,
        is_active=True
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Создаем профиль исполнителя
    contractor_profile = ContractorProfile(
        user_id=new_user.id,
        passport_series=contractor_data.passport_series,
        passport_number=contractor_data.passport_number,
        passport_issued_by=contractor_data.passport_issued_by,
        passport_issued_date=contractor_data.passport_issued_date,
        passport_division_code=contractor_data.passport_division_code,
        registration_address=contractor_data.registration_address,
        specialization=contractor_data.specialization,
        experience_years=contractor_data.experience_years,
        skills=contractor_data.skills
    )

    db.add(contractor_profile)
    await db.commit()
    await db.refresh(contractor_profile)

    # Обновляем связь в пользователе
    await db.refresh(new_user)
    return new_user


@router.get("/profile", response_model=ContractorProfileSchema)
async def get_contractor_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить профиль исполнителя"""

    if current_user.role != UserRole.CONTRACTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен"
        )

    result = await db.execute(
        select(ContractorProfile).where(ContractorProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль не найден"
        )

    # Преобразуем данные для соответствия новой схеме
    profile_data = {
        'id': profile.id,
        'user_id': profile.user_id,
        'created_at': profile.created_at,
        'updated_at': profile.updated_at,
        'last_name': profile.last_name,
        'first_name': profile.first_name,
        'patronymic': profile.patronymic,
        'phone': profile.phone,
        'email': profile.email,
        'professional_info': profile.professional_info or [],
        'education': profile.education or [],
        'bank_name': profile.bank_name,
        'bank_account': profile.bank_account,
        'bank_bik': profile.bank_bik,
        'telegram_username': profile.telegram_username,
        'website': profile.website,
        'general_description': profile.general_description,
        'profile_photo_url': profile.profile_photo_path and f"/uploads/{profile.profile_photo_path}",
        'portfolio_files': profile.portfolio_files or [],
        'document_files': profile.document_files or []
    }

    return profile_data


@router.put("/profile", response_model=ContractorProfileSchema)
async def update_contractor_profile(
    # Основные поля
    last_name: Optional[str] = Form(None),
    first_name: Optional[str] = Form(None),
    patronymic: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    professional_info: Optional[str] = Form(None),  # JSON строка
    education: Optional[str] = Form(None),  # JSON строка
    bank_name: Optional[str] = Form(None),
    bank_account: Optional[str] = Form(None),
    bank_bik: Optional[str] = Form(None),
    telegram_username: Optional[str] = Form(None),
    website: Optional[str] = Form(None),
    general_description: Optional[str] = Form(None),
    # Файлы
    profile_photo: Optional[UploadFile] = File(None),
    portfolio_files: Optional[UploadFile] = File(None),
    document_files: Optional[UploadFile] = File(None),
    # Пользователь
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить профиль исполнителя"""

    if current_user.role != UserRole.CONTRACTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен"
        )

    result = await db.execute(
        select(ContractorProfile).where(ContractorProfile.user_id == current_user.id)
    )
    profile = result.scalars().first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль не найден"
        )

    # Обновляем основные поля
    if last_name is not None:
        profile.last_name = last_name
    if first_name is not None:
        profile.first_name = first_name
    if patronymic is not None:
        profile.patronymic = patronymic
    if phone is not None:
        profile.phone = phone
    if email is not None:
        profile.email = email
    if bank_name is not None:
        profile.bank_name = bank_name
    if bank_account is not None:
        profile.bank_account = bank_account
    if bank_bik is not None:
        profile.bank_bik = bank_bik
    if telegram_username is not None:
        profile.telegram_username = telegram_username
    if website is not None:
        profile.website = website
    if general_description is not None:
        profile.general_description = general_description

    # Обновляем JSON поля
    if professional_info is not None:
        import json
        profile.professional_info = json.loads(professional_info)
    if education is not None:
        import json
        profile.education = json.loads(education)

    # Обрабатываем фото профиля
    if profile_photo:
        # Удаляем старое фото если есть
        if profile.profile_photo_path:
            old_photo_path = UPLOAD_DIR / profile.profile_photo_path
            if old_photo_path.exists():
                old_photo_path.unlink()

        # Сохраняем новое фото
        filename = f"{current_user.id}_{uuid.uuid4()}_{profile_photo.filename}"
        photo_path = await save_upload_file(profile_photo, PROFILES_DIR, filename)
        profile.profile_photo_path = photo_path

    # Обрабатываем файлы портфолио
    if portfolio_files:
        current_portfolio = profile.portfolio_files or []
        new_files_content = []

        # Собираем содержимое нового файла для проверки размера
        content = await portfolio_files.read()
        new_files_content.append(content)
        await portfolio_files.seek(0)  # Возвращаем указатель в начало

        # Проверяем общий размер
        await check_total_size(current_portfolio, new_files_content)

        # Сохраняем новый файл
        filename = f"{current_user.id}_portfolio_{uuid.uuid4()}_{portfolio_files.filename}"
        file_path = await save_upload_file(portfolio_files, PORTFOLIO_DIR, filename)
        new_portfolio_file = {
            'name': portfolio_files.filename,
            'path': file_path,
            'size': await get_file_size(portfolio_files),
            'url': f"/uploads/{file_path}"
        }

        profile.portfolio_files = current_portfolio + [new_portfolio_file]

    # Обрабатываем документы
    if document_files:
        current_documents = profile.document_files or []
        new_files_content = []

        # Собираем содержимое нового файла для проверки размера
        content = await document_files.read()
        new_files_content.append(content)
        await document_files.seek(0)  # Возвращаем указатель в начало

        # Проверяем общий размер
        await check_total_size(current_documents, new_files_content)

        # Сохраняем новый файл
        filename = f"{current_user.id}_document_{uuid.uuid4()}_{document_files.filename}"
        file_path = await save_upload_file(document_files, DOCUMENTS_DIR, filename)
        new_document_file = {
            'name': document_files.filename,
            'path': file_path,
            'size': await get_file_size(document_files),
            'url': f"/uploads/{file_path}"
        }

        profile.document_files = current_documents + [new_document_file]

    await db.commit()
    await db.refresh(profile)

    return profile


@router.get("/telegram-link")
async def get_telegram_link(
    current_user: User = Depends(get_current_user)
):
    """Получить ссылку на Telegram бота"""

    if current_user.role != UserRole.CONTRACTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен"
        )

    # В будущем здесь будет реальная ссылка на бота
    bot_link = "https://t.me/your_repair_bot"

    return {
        "telegram_bot_link": bot_link,
        "instructions": "Перейдите по ссылке и нажмите 'Start' для начала работы с ботом"
    }


@router.get("/profiles", response_model=List[ContractorProfileSchema])
async def get_all_contractor_profiles(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить профили всех исполнителей (только для сервисных инженеров)"""

    if current_user.role != UserRole.SERVICE_ENGINEER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен. Только для сервисных инженеров."
        )

    result = await db.execute(
        select(ContractorProfile).join(User).where(User.role == UserRole.CONTRACTOR)
    )
    profiles = result.scalars().all()

    return profiles
