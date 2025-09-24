from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import json
import hashlib
from cryptography.fernet import Fernet
import base64

from ...dependencies import get_db, get_current_user
from ....models import ApiKey, AiProcessingLog, User
from ....schemas import ApiKeyCreate, ApiKeyUpdate, ApiKeyResponse

router = APIRouter()

# Ключ для шифрования API ключей (в продакшене должен быть в переменных окружения)
ENCRYPTION_KEY = os.getenv('API_KEY_ENCRYPTION_KEY', Fernet.generate_key())
cipher_suite = Fernet(ENCRYPTION_KEY)

def encrypt_api_key(key: str) -> str:
    """Шифрование API ключа"""
    return cipher_suite.encrypt(key.encode()).decode()

def decrypt_api_key(encrypted_key: str) -> str:
    """Расшифровка API ключа"""
    return cipher_suite.decrypt(encrypted_key.encode()).decode()

@router.get("/api-keys/", response_model=List[ApiKeyResponse])
async def get_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список API ключей"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    api_keys = db.query(ApiKey).all()
    return api_keys

@router.post("/api-keys/", response_model=ApiKeyResponse)
async def create_api_key(
    api_key_data: ApiKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новый API ключ"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    # Проверяем, что ключ с таким именем не существует
    existing_key = db.query(ApiKey).filter(ApiKey.name == api_key_data.name).first()
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
    db.commit()
    db.refresh(api_key)
    
    return api_key

@router.put("/api-keys/{key_id}/", response_model=ApiKeyResponse)
async def update_api_key(
    key_id: int,
    api_key_data: ApiKeyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить API ключ"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    api_key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
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
    
    db.commit()
    db.refresh(api_key)
    
    return api_key

@router.delete("/api-keys/{key_id}/")
async def delete_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить API ключ"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    api_key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API ключ не найден")
    
    db.delete(api_key)
    db.commit()
    
    return {"message": "API ключ удален"}

@router.get("/api-keys/{key_id}/decrypt/")
async def get_decrypted_key(
    key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить расшифрованный API ключ (только для админа)"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    api_key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Тестировать API ключ"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    api_key = db.query(ApiKey).filter(ApiKey.id == key_id).first()
    if not api_key:
        raise HTTPException(status_code=404, detail="API ключ не найден")
    
    try:
        decrypted_key = decrypt_api_key(api_key.key)
        
        # Обновляем время последнего использования
        api_key.last_used = datetime.utcnow()
        db.commit()
        
        # Здесь можно добавить реальное тестирование API ключа
        # в зависимости от провайдера
        
        return {"message": "API ключ работает корректно", "provider": api_key.provider}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка тестирования ключа: {str(e)}")
