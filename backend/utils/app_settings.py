"""
Утилиты для работы с настройками приложения
"""

import os
import asyncio
from typing import Optional, Any
from database import async_session
from models import AppSettings
from sqlalchemy import select
from cryptography.fernet import Fernet
import base64

# Ключ для расшифровки настроек (в продакшене должен быть в переменных окружения)
DECRYPTION_KEY = os.getenv('APP_SETTINGS_DECRYPTION_KEY', Fernet.generate_key())
cipher_suite = Fernet(DECRYPTION_KEY)

def decrypt_value(encrypted_value: str) -> str:
    """Расшифровывает значение настройки"""
    try:
        return cipher_suite.decrypt(encrypted_value.encode()).decode()
    except Exception:
        return encrypted_value

async def get_setting(key: str, default: Optional[str] = None) -> Optional[str]:
    """Получить значение настройки по ключу"""
    async with async_session() as db:
        try:
            result = await db.execute(select(AppSettings).where(AppSettings.key == key))
            setting = result.scalar_one_or_none()
            
            if setting:
                if setting.is_encrypted:
                    return decrypt_value(setting.value)
                else:
                    return setting.value
            else:
                return default
        except Exception as e:
            print(f"Ошибка получения настройки {key}: {e}")
            return default
        finally:
            await db.close()

async def get_all_settings() -> dict:
    """Получить все настройки приложения"""
    async with async_session() as db:
        try:
            result = await db.execute(select(AppSettings))
            settings = result.scalars().all()
            
            settings_dict = {}
            for setting in settings:
                if setting.is_encrypted:
                    settings_dict[setting.key] = decrypt_value(setting.value)
                else:
                    settings_dict[setting.key] = setting.value
            
            return settings_dict
        except Exception as e:
            print(f"Ошибка получения настроек: {e}")
            return {}
        finally:
            await db.close()

def get_setting_sync(key: str, default: Optional[str] = None) -> Optional[str]:
    """Синхронная версия получения настройки"""
    return asyncio.run(get_setting(key, default))

def get_all_settings_sync() -> dict:
    """Синхронная версия получения всех настроек"""
    return asyncio.run(get_all_settings())
