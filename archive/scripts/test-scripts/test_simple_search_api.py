#!/usr/bin/env python3
"""
Тест простого поиска через API
"""

import asyncio
import sys
import os
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

from database import get_db
from api.v1.endpoints.simple_search import simple_smart_search

async def test_simple_search_api():
    """Тестируем простой поиск через API"""
    print("🔍 Тестируем simple_smart_search...")
    
    async for db in get_db():
        try:
            result = await simple_smart_search("25241", db)
            print(f"Результат: {result}")
        except Exception as e:
            print(f"Ошибка: {e}")
            import traceback
            traceback.print_exc()
        break

if __name__ == "__main__":
    asyncio.run(test_simple_search_api())
