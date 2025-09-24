#!/usr/bin/env python3
"""
Скрипт для инициализации настроек приложения
"""

import asyncio
import sys
import os

# Добавляем корневую директорию проекта в путь
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import async_session
from models import AppSettings
from sqlalchemy import select

async def init_app_settings():
    """Инициализирует настройки приложения"""
    
    # Настройки по умолчанию
    default_settings = [
        {
            "key": "SECRET_KEY",
            "value": "dev-secret-key-change-in-production",
            "description": "Секретный ключ для JWT токенов",
            "is_encrypted": True
        },
        {
            "key": "ALGORITHM",
            "value": "HS256",
            "description": "Алгоритм шифрования JWT",
            "is_encrypted": False
        },
        {
            "key": "ACCESS_TOKEN_EXPIRE_MINUTES",
            "value": "1440",
            "description": "Время жизни токена в минутах",
            "is_encrypted": False
        },
        {
            "key": "DATABASE_URL",
            "value": "postgresql+asyncpg://test_user:test_password@localhost:15432/test_platform_db",
            "description": "URL базы данных",
            "is_encrypted": True
        },
        {
            "key": "CORS_ORIGINS",
            "value": "http://localhost:3000,http://127.0.0.1:3000",
            "description": "Разрешенные CORS origins",
            "is_encrypted": False
        },
        {
            "key": "MAX_UPLOAD_SIZE",
            "value": "10485760",
            "description": "Максимальный размер загружаемого файла в байтах",
            "is_encrypted": False
        },
        {
            "key": "ALLOWED_EXTENSIONS",
            "value": "pdf,doc,docx,xls,xlsx,png,jpg,jpeg,gif",
            "description": "Разрешенные расширения файлов",
            "is_encrypted": False
        },
        {
            "key": "LOG_LEVEL",
            "value": "INFO",
            "description": "Уровень логирования",
            "is_encrypted": False
        }
    ]
    
    async with async_session() as db:
        try:
            for setting_data in default_settings:
                # Проверяем, существует ли настройка
                result = await db.execute(select(AppSettings).where(AppSettings.key == setting_data["key"]))
                existing_setting = result.scalar_one_or_none()
                
                if not existing_setting:
                    # Создаем новую настройку
                    setting = AppSettings(
                        key=setting_data["key"],
                        value=setting_data["value"],
                        description=setting_data["description"],
                        is_encrypted=setting_data["is_encrypted"]
                    )
                    db.add(setting)
                    print(f"✅ Создана настройка: {setting_data['key']}")
                else:
                    print(f"⚠️ Настройка уже существует: {setting_data['key']}")
            
            await db.commit()
            print("🎉 Настройки приложения инициализированы успешно!")
            
        except Exception as e:
            print(f"❌ Ошибка инициализации настроек: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()

if __name__ == "__main__":
    asyncio.run(init_app_settings())
