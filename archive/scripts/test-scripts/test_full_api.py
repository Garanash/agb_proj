#!/usr/bin/env python3
import asyncio
import sys
import os

# Добавляем путь к backend
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

from database import get_db
from api.v1.endpoints.article_matching import match_articles_with_database

async def test_full_api():
    """Тестируем полный API"""
    print("🔍 Тестируем полный API...")
    
    async for db in get_db():
        try:
            # Тестируем с данными, которые возвращает AI
            articles = [{
                'contractor_article': 'ОХКУ-000184',
                'description': 'Смазка антивибрационная GRIZZLY (ведро 17 кг.)',
                'quantity': 10,
                'unit': 'шт',
                'agb_article': None,
                'bl_article': None,
                'match_confidence': 0,
                'match_type': 'нет соответствий'
            }]
            
            print(f"🔍 Тестируем с артикулами: {articles}")
            results = await match_articles_with_database(articles, db)
            print(f"✅ Результаты: {results}")
            
        except Exception as e:
            print(f"❌ Ошибка: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await db.close()
        break

if __name__ == "__main__":
    asyncio.run(test_full_api())
