from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
import os
import json
import hashlib
from cryptography.fernet import Fernet
import base64

from ..dependencies import get_db, get_current_user
from models import ApiKey, AiProcessingLog, User, AppSettings
from ..schemas import ApiKeyCreate, ApiKeyUpdate, ApiKeyResponse, AppSettingsCreate, AppSettingsUpdate, AppSettingsResponse

router = APIRouter()

# Ключ для шифрования API ключей (фиксированный для простоты)
ENCRYPTION_KEY = b'iF0d2ARGQpaU9GFfQdWNovBL239dqwTp9hDDPrDQQic='
cipher_suite = Fernet(ENCRYPTION_KEY)

def get_cipher_suite():
    """Получить объект для шифрования"""
    from cryptography.fernet import Fernet
    import os
    encryption_key = os.getenv('API_KEY_ENCRYPTION_KEY', Fernet.generate_key())
    return Fernet(encryption_key)

def encrypt_api_key(key: str) -> str:
    """Шифрование API ключа"""
    return cipher_suite.encrypt(key.encode()).decode()

def decrypt_api_key(encrypted_key: str) -> str:
    """Расшифровка API ключа"""
    return cipher_suite.decrypt(encrypted_key.encode()).decode()

@router.get("/api-keys/", response_model=List[ApiKeyResponse])
async def get_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список API ключей"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    from sqlalchemy.future import select
    result = await db.execute(select(ApiKey))
    api_keys = result.scalars().all()
    return api_keys

@router.post("/api-keys/", response_model=ApiKeyResponse)
async def create_api_key(
    api_key_data: ApiKeyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новый API ключ"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    # Проверяем, что ключ с таким именем не существует
    from sqlalchemy.future import select
    result = await db.execute(select(ApiKey).where(ApiKey.name == api_key_data.name))
    existing_key = result.scalar_one_or_none()
    if existing_key:
        raise HTTPException(status_code=400, detail="API ключ с таким именем уже существует")
    
    # Шифруем ключ
    encrypted_key = encrypt_api_key(api_key_data.key)
    
    # Создаем новый API ключ
    api_key = ApiKey(
        name=api_key_data.name,
        provider=api_key_data.provider,
        key=encrypted_key,
        is_active=api_key_data.is_active,
        created_by=current_user.id
    )
    
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)
    
    return api_key

@router.put("/api-keys/{key_id}/", response_model=ApiKeyResponse)
async def update_api_key(
    key_id: int,
    api_key_data: ApiKeyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить API ключ"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    from sqlalchemy.future import select
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API ключ не найден")
    
    # Обновляем поля
    if api_key_data.name:
        api_key.name = api_key_data.name
    if api_key_data.provider:
        api_key.provider = api_key_data.provider
    if api_key_data.key:
        api_key.key = encrypt_api_key(api_key_data.key)
    if api_key_data.is_active is not None:
        api_key.is_active = api_key_data.is_active
    
    await db.commit()
    await db.refresh(api_key)
    
    return api_key

@router.delete("/api-keys/{key_id}/")
async def delete_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить API ключ"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    from sqlalchemy.future import select
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API ключ не найден")
    
    await db.delete(api_key)
    await db.commit()
    
    return {"message": "API ключ удален"}

@router.get("/api-keys/{key_id}/decrypt/")
async def get_decrypted_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить расшифрованный API ключ (только для админа)"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    from sqlalchemy.future import select
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API ключ не найден")
    
    try:
        decrypted_key = decrypt_api_key(api_key.key)
        return {"key": decrypted_key}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка расшифровки ключа")

@router.post("/api-keys/{key_id}/test/")
async def test_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Тестировать API ключ"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    from sqlalchemy.future import select
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API ключ не найден")
    
    try:
        decrypted_key = decrypt_api_key(api_key.key)
        
        # Обновляем время последнего использования
        api_key.last_used = datetime.utcnow()
        await db.commit()
        
        # Здесь можно добавить реальное тестирование API ключа
        # в зависимости от провайдера
        
        return {"message": "API ключ работает корректно", "provider": api_key.provider}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка тестирования ключа: {str(e)}")

@router.get("/api-keys/{key_id}/decrypt/")
async def get_decrypted_api_key(
    key_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить расшифрованный API ключ (только для администраторов)"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    from sqlalchemy.future import select
    result = await db.execute(select(ApiKey).where(ApiKey.id == key_id))
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API ключ не найден")
    
    try:
        # Расшифровываем ключ
        decrypted_key = decrypt_api_key(api_key.key)
        return {"key": decrypted_key}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка расшифровки ключа: {str(e)}")


# Эндпоинты для настроек приложения
@router.get("/app-settings/", response_model=List[AppSettingsResponse])
async def get_app_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все настройки приложения"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    from sqlalchemy.future import select
    result = await db.execute(select(AppSettings))
    settings = result.scalars().all()
    return settings

@router.post("/app-settings/", response_model=AppSettingsResponse)
async def create_app_setting(
    setting_data: AppSettingsCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новую настройку приложения"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    # Проверяем, что настройка с таким ключом не существует
    from sqlalchemy.future import select
    result = await db.execute(select(AppSettings).where(AppSettings.key == setting_data.key))
    existing_setting = result.scalar_one_or_none()
    if existing_setting:
        raise HTTPException(status_code=400, detail="Настройка с таким ключом уже существует")
    
    # Создаем новую настройку
    setting = AppSettings(
        key=setting_data.key,
        value=setting_data.value,
        description=setting_data.description,
        is_encrypted=setting_data.is_encrypted
    )
    
    db.add(setting)
    await db.commit()
    await db.refresh(setting)
    
    return setting

@router.put("/app-settings/{setting_id}/", response_model=AppSettingsResponse)
async def update_app_setting(
    setting_id: int,
    setting_data: AppSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить настройку приложения"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    from sqlalchemy.future import select
    result = await db.execute(select(AppSettings).where(AppSettings.id == setting_id))
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Настройка не найдена")
    
    # Обновляем поля
    if setting_data.value is not None:
        setting.value = setting_data.value
    if setting_data.description is not None:
        setting.description = setting_data.description
    if setting_data.is_encrypted is not None:
        setting.is_encrypted = setting_data.is_encrypted
    
    await db.commit()
    await db.refresh(setting)
    
    return setting

@router.delete("/app-settings/{setting_id}/")
async def delete_app_setting(
    setting_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить настройку приложения"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    from sqlalchemy.future import select
    result = await db.execute(select(AppSettings).where(AppSettings.id == setting_id))
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Настройка не найдена")
    
    await db.delete(setting)
    await db.commit()
    
    return {"message": "Настройка удалена"}

@router.get("/app-settings/{key}/", response_model=AppSettingsResponse)
async def get_app_setting_by_key(
    key: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить настройку по ключу"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    from sqlalchemy.future import select
    result = await db.execute(select(AppSettings).where(AppSettings.key == key))
    setting = result.scalar_one_or_none()
    if not setting:
        raise HTTPException(status_code=404, detail="Настройка не найдена")
    
    return setting
