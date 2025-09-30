#!/usr/bin/env python3
"""
Прямой тест поиска без импорта models
"""

import asyncio
import aiohttp
import json

async def test_direct_search():
    """Тестируем прямой поиск"""
    
    try:
        async with aiohttp.ClientSession() as session:
            print("🔍 Тестируем прямой поиск...")
            
            # Тест health check
            async with session.get("http://localhost:8000/api/v1/health") as response:
                print(f"✅ Health check: {response.status}")
                data = await response.json()
                print(f"   Ответ: {data}")
            
            # Тест поиска
            print("\n🔍 Тестируем поиск...")
            async with session.post(
                "http://localhost:8000/api/v1/search/",
                headers={"Content-Type": "application/json"},
                json={"search_text": "25241"}
            ) as response:
                print(f"   Статус: {response.status}")
                text = await response.text()
                print(f"   Ответ: {text}")
                
                if response.status == 200:
                    data = json.loads(text)
                    print(f"   ✅ Успех! Найдено совпадений: {len(data.get('matches', []))}")
                else:
                    print(f"   ❌ Ошибка: {text}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    asyncio.run(test_direct_search())