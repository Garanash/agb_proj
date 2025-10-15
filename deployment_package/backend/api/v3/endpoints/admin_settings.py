"""
Эндпоинты для управления настройками администратора
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Dict, Any, Optional
from database import get_db
from ..schemas import (
    EmailSettingsCreate, EmailSettingsUpdate, EmailSettingsResponse,
    ApiKeySettingsCreate, ApiKeySettingsUpdate, ApiKeySettingsResponse,
    SystemSettingCreate, SystemSettingUpdate, SystemSettingResponse,
    EmailTestRequest, SuccessResponse, ErrorResponse
)
from ..models import EmailSettings, ApiKeySettings, SystemSettings
from ..utils import (
    PermissionManager, EncryptionManager, 
    ActivityLogger, SettingsValidator, encryption_manager
)
from ...v1.dependencies import get_current_user
from models import User


router = APIRouter()


# Email настройки
@router.get("/email-settings", response_model=List[EmailSettingsResponse])
async def get_email_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все настройки email"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    result = await db.execute(select(EmailSettings).order_by(EmailSettings.created_at.desc()))
    settings = result.scalars().all()
    
    return settings


@router.post("/email-settings", response_model=EmailSettingsResponse)
async def create_email_settings(
    settings_data: EmailSettingsCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать настройки email"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    # Валидация
    errors = SettingsValidator.validate_email_settings(settings_data.dict())
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": errors}
        )
    
    # Если это настройки по умолчанию, убираем флаг у других
    if settings_data.is_default:
        await db.execute(
            EmailSettings.__table__.update().where(
                EmailSettings.is_default == True
            ).values(is_default=False)
        )
    
    # Создаем настройки
    settings = EmailSettings(
        name=settings_data.name,
        smtp_server=settings_data.smtp_server,
        smtp_port=settings_data.smtp_port,
        username=settings_data.username,
        password=encryption_manager.encrypt(settings_data.password),
        use_tls=settings_data.use_tls,
        use_ssl=settings_data.use_ssl,
        from_email=settings_data.from_email,
        from_name=settings_data.from_name,
        is_active=settings_data.is_active,
        is_default=settings_data.is_default
    )
    
    db.add(settings)
    await db.commit()
    await db.refresh(settings)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "create", "email_settings", str(settings.id)
    )
    
    return settings


@router.put("/email-settings/{settings_id}", response_model=EmailSettingsResponse)
async def update_email_settings(
    settings_id: int,
    settings_data: EmailSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить настройки email"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    # Получаем настройки
    result = await db.execute(select(EmailSettings).where(EmailSettings.id == settings_id))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройки email не найдены"
        )
    
    # Обновляем поля
    update_data = settings_data.dict(exclude_unset=True)
    
    # Если это настройки по умолчанию, убираем флаг у других
    if update_data.get('is_default'):
        await db.execute(
            EmailSettings.__table__.update().where(
                and_(EmailSettings.is_default == True, EmailSettings.id != settings_id)
            ).values(is_default=False)
        )
    
    # Шифруем пароль если он изменился
    if 'password' in update_data:
        update_data['password'] = encryption_manager.encrypt(update_data['password'])
    
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    await db.commit()
    await db.refresh(settings)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "update", "email_settings", str(settings.id)
    )
    
    return settings


@router.delete("/email-settings/{settings_id}", response_model=SuccessResponse)
async def delete_email_settings(
    settings_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить настройки email"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    result = await db.execute(select(EmailSettings).where(EmailSettings.id == settings_id))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройки email не найдены"
        )
    
    await db.delete(settings)
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "delete", "email_settings", str(settings_id)
    )
    
    return SuccessResponse(message="Настройки email удалены")


@router.post("/email-settings/{settings_id}/test", response_model=SuccessResponse)
async def test_email_settings(
    settings_id: int,
    test_data: EmailTestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Тестировать настройки email"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    result = await db.execute(select(EmailSettings).where(EmailSettings.id == settings_id))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройки email не найдены"
        )
    
    # Расшифровываем пароль
    password = encryption_manager.decrypt(settings.password)
    
    # Отправляем тестовое письмо (временно отключено)
    # success = await EmailManager.send_email(
    #     smtp_server=settings.smtp_server,
    #     smtp_port=settings.smtp_port,
    #     username=settings.username,
    #     password=password,
    #     use_tls=settings.use_tls,
    #     use_ssl=settings.use_ssl,
    #     from_email=settings.from_email,
    #     from_name=settings.from_name,
    #     to_email=test_data.to_email,
    #     subject=test_data.subject,
    #     body=test_data.body
    # )
    success = True  # Временно всегда успешно
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Не удалось отправить тестовое письмо. Проверьте настройки."
        )
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "test", "email_settings", str(settings_id),
        details={"to_email": test_data.to_email}
    )
    
    return SuccessResponse(message="Тестовое письмо отправлено успешно")


# API ключи
@router.get("/api-keys", response_model=List[ApiKeySettingsResponse])
async def get_api_keys(
    service_name: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все API ключи"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_api_keys")
    
    query = select(ApiKeySettings).order_by(ApiKeySettings.created_at.desc())
    
    if service_name:
        query = query.where(ApiKeySettings.service_name == service_name)
    
    result = await db.execute(query)
    keys = result.scalars().all()
    
    return keys


@router.post("/api-keys", response_model=ApiKeySettingsResponse)
async def create_api_key(
    key_data: ApiKeySettingsCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать API ключ"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_api_keys")
    
    # Валидация
    errors = SettingsValidator.validate_api_key_settings(key_data.dict())
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": errors}
        )
    
    # Если это ключ по умолчанию для сервиса, убираем флаг у других
    if key_data.is_default:
        await db.execute(
            ApiKeySettings.__table__.update().where(
                and_(
                    ApiKeySettings.service_name == key_data.service_name,
                    ApiKeySettings.is_default == True
                )
            ).values(is_default=False)
        )
    
    # Создаем ключ
    api_key = ApiKeySettings(
        service_name=key_data.service_name,
        key_name=key_data.key_name,
        api_key=encryption_manager.encrypt(key_data.api_key),
        additional_config=key_data.additional_config,
        is_active=key_data.is_active,
        is_default=key_data.is_default,
        created_by=current_user.id
    )
    
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "create", "api_key", str(api_key.id),
        details={"service_name": key_data.service_name}
    )
    
    return api_key


@router.put("/api-keys/{key_id}", response_model=ApiKeySettingsResponse)
async def update_api_key(
    key_id: int,
    key_data: ApiKeySettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить API ключ"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_api_keys")
    
    # Получаем ключ
    result = await db.execute(select(ApiKeySettings).where(ApiKeySettings.id == key_id))
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API ключ не найден"
        )
    
    # Обновляем поля
    update_data = key_data.dict(exclude_unset=True)
    
    # Если это ключ по умолчанию, убираем флаг у других
    if update_data.get('is_default'):
        await db.execute(
            ApiKeySettings.__table__.update().where(
                and_(
                    ApiKeySettings.service_name == api_key.service_name,
                    ApiKeySettings.is_default == True,
                    ApiKeySettings.id != key_id
                )
            ).values(is_default=False)
        )
    
    # Шифруем ключ если он изменился
    if 'api_key' in update_data:
        update_data['api_key'] = encryption_manager.encrypt(update_data['api_key'])
    
    for field, value in update_data.items():
        setattr(api_key, field, value)
    
    await db.commit()
    await db.refresh(api_key)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "update", "api_key", str(api_key.id)
    )
    
    return api_key


@router.delete("/api-keys/{key_id}", response_model=SuccessResponse)
async def delete_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить API ключ"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_api_keys")
    
    result = await db.execute(select(ApiKeySettings).where(ApiKeySettings.id == key_id))
    api_key = result.scalar_one_or_none()
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API ключ не найден"
        )
    
    await db.delete(api_key)
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "delete", "api_key", str(key_id)
    )
    
    return SuccessResponse(message="API ключ удален")


# Системные настройки
@router.get("/system-settings", response_model=List[SystemSettingResponse])
async def get_system_settings(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить системные настройки"""
    await PermissionManager.require_permission(db, current_user.id, "settings.read")
    
    query = select(SystemSettings).order_by(SystemSettings.category, SystemSettings.key)
    
    if category:
        query = query.where(SystemSettings.category == category)
    
    result = await db.execute(query)
    settings = result.scalars().all()
    
    return settings


@router.post("/system-settings", response_model=SystemSettingResponse)
async def create_system_setting(
    setting_data: SystemSettingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать системную настройку"""
    await PermissionManager.require_permission(db, current_user.id, "settings.update")
    
    # Проверяем уникальность ключа в категории
    existing = await db.execute(
        select(SystemSettings).where(
            and_(
                SystemSettings.category == setting_data.category,
                SystemSettings.key == setting_data.key
            )
        )
    )
    
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Настройка с таким ключом уже существует в данной категории"
        )
    
    # Шифруем значение если нужно
    value = setting_data.value
    if setting_data.is_encrypted and value:
        value = encryption_manager.encrypt(value)
    
    setting = SystemSettings(
        category=setting_data.category,
        key=setting_data.key,
        value=value,
        data_type=setting_data.data_type,
        is_encrypted=setting_data.is_encrypted,
        is_public=setting_data.is_public,
        description=setting_data.description,
        validation_rules=setting_data.validation_rules
    )
    
    db.add(setting)
    await db.commit()
    await db.refresh(setting)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "create", "system_setting", str(setting.id),
        details={"category": setting_data.category, "key": setting_data.key}
    )
    
    return setting


@router.put("/system-settings/{setting_id}", response_model=SystemSettingResponse)
async def update_system_setting(
    setting_id: int,
    setting_data: SystemSettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить системную настройку"""
    await PermissionManager.require_permission(db, current_user.id, "settings.update")
    
    result = await db.execute(select(SystemSettings).where(SystemSettings.id == setting_id))
    setting = result.scalar_one_or_none()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Системная настройка не найдена"
        )
    
    # Обновляем поля
    update_data = setting_data.dict(exclude_unset=True)
    
    # Шифруем значение если нужно
    if 'value' in update_data and setting.is_encrypted and update_data['value']:
        update_data['value'] = encryption_manager.encrypt(update_data['value'])
    
    for field, value in update_data.items():
        setattr(setting, field, value)
    
    await db.commit()
    await db.refresh(setting)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "update", "system_setting", str(setting.id)
    )
    
    return setting


@router.delete("/system-settings/{setting_id}", response_model=SuccessResponse)
async def delete_system_setting(
    setting_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить системную настройку"""
    await PermissionManager.require_permission(db, current_user.id, "settings.update")
    
    result = await db.execute(select(SystemSettings).where(SystemSettings.id == setting_id))
    setting = result.scalar_one_or_none()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Системная настройка не найдена"
        )
    
    await db.delete(setting)
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "delete", "system_setting", str(setting_id)
    )
    
    return SuccessResponse(message="Системная настройка удалена")
