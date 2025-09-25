#!/usr/bin/env python3
import asyncio
import sys
import os

# Добавляем путь к backend
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

from database import get_db
from api.v1.endpoints.article_matching import process_ai_request
from fastapi import Form, File, UploadFile
from io import BytesIO

async def test_api_processing():
    """Тестируем обработку API"""
    print("🔍 Тестируем обработку API...")
    
    async for db in get_db():
        try:
            # Создаем тестовые данные
            message = "ОХКУ-000184 УБР - Кундуми Смазка антивибрационная GRIZZLY (ведро 17 кг.) 10 шт"
            files = []
            
            # Получаем пользователя
            from models import User
            from sqlalchemy import select
            
            result = await db.execute(select(User).where(User.username == 'admin'))
            user = result.scalar_one_or_none()
            
            if not user:
                print("❌ Пользователь admin не найден")
                return
            
            print(f"✅ Пользователь найден: {user.username}")
            
            # Тестируем функцию process_ai_request
            response = await process_ai_request(message, files, db, user)
            print(f"✅ Ответ API: {response}")
            
        except Exception as e:
            print(f"❌ Ошибка: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await db.close()
        break

if __name__ == "__main__":
    asyncio.run(test_api_processing())
