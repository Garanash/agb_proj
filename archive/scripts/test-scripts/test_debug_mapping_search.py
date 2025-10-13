#!/usr/bin/env python3
import asyncio
import sys
import os

# Добавляем путь к backend
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from api.v1.endpoints.article_matching import smart_search_with_ai
from models import ArticleMapping

async def test_debug_mapping_search():
    """Отладочный тест поиска по существующим сопоставлениям"""
    print("🔍 Отладочный тест поиска по существующим сопоставлениям...")
    
    # Подключаемся к базе данных
    DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/agb_db"
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        # Проверяем существующие сопоставления
        from sqlalchemy import select
        result = await db.execute(select(ArticleMapping).limit(5))
        mappings = result.scalars().all()
        
        print(f"📊 Найдено {len(mappings)} сопоставлений в БД:")
        for mapping in mappings:
            print(f"   - {mapping.contractor_article} -> {mapping.agb_article}")
        
        # Тестируем smart_search_with_ai
        test_text = "ОХКУ-000184 УБР - Кундуми Смазка антивибрационная GRIZZLY"
        print(f"\n🔍 Тестируем smart_search_with_ai с: '{test_text}'")
        
        try:
            result = await smart_search_with_ai(test_text, db)
            print(f"📊 Результат: {result}")
        except Exception as e:
            print(f"❌ Ошибка: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_debug_mapping_search())
