#!/usr/bin/env python3
"""
Простой тест API v3 без аутентификации
"""

import asyncio
import aiohttp
import json

async def test_v3_simple():
    """Простой тест API v3"""
    
    try:
        async with aiohttp.ClientSession() as session:
            print("🔍 Тестируем API v3...")
            
            # Тест health check
            async with session.get("http://localhost:8000/api/v3/health") as response:
                print(f"✅ Health check: {response.status}")
                data = await response.json()
                print(f"   Ответ: {data}")
            
            # Проверим доступные эндпоинты
            print("\n🔍 Проверяем доступные эндпоинты...")
            async with session.get("http://localhost:8000/docs") as response:
                print(f"   Docs: {response.status}")
            
            # Проверим OpenAPI схему
            async with session.get("http://localhost:8000/openapi.json") as response:
                if response.status == 200:
                    data = await response.json()
                    paths = data.get('paths', {})
                    v3_paths = [path for path in paths.keys() if path.startswith('/api/v3/')]
                    print(f"   Найдено {len(v3_paths)} эндпоинтов v3:")
                    for path in v3_paths[:10]:  # Показываем первые 10
                        print(f"     - {path}")
                else:
                    print(f"   ❌ OpenAPI недоступен: {response.status}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    asyncio.run(test_v3_simple())
