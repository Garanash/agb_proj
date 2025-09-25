#!/usr/bin/env python3
import asyncio
import sys
import os

# Добавляем путь к backend
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

from database import get_db
from api.v1.endpoints.article_matching import smart_search_with_ai

async def test_smart_search():
    """Тестируем функцию smart_search_with_ai"""
    print("🔍 Тестируем smart_search_with_ai...")
    
    async for db in get_db():
        try:
            search_text = "ОХКУ-000184 УБР - Кундуми Смазка антивибрационная GRIZZLY (ведро 17 кг.) 10 шт"
            result = await smart_search_with_ai(search_text, db)
            print(f"✅ Результат: {result}")
        except Exception as e:
            print(f"❌ Ошибка: {e}")
        finally:
            await db.close()
        break

if __name__ == "__main__":
    asyncio.run(test_smart_search())
