#!/usr/bin/env python3
"""
Финальный тест API v3
"""

import asyncio
import aiohttp
import json

async def test_v3_final():
    """Финальный тест API v3"""
    
    # Используем существующий токен
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc1OTA5NjIwMH0.ruFLXYacTWatO1rqkeHh_UWTOcmntErJ3VxyqcoU2Iw"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    test_data = {
        "articles": ["25241"],
        "request_name": "Тест поиска",
        "use_ai": False,
        "validate_contacts": False
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            print("🔍 Финальный тест API v3...")
            
            # Тест health check
            async with session.get("http://localhost:8000/api/v3/health") as response:
                print(f"✅ Health check: {response.status}")
            
            # Тест поиска
            print("\n🔍 Тестируем поиск...")
            async with session.post(
                "http://localhost:8000/api/v3/article-search/search",
                headers=headers,
                json=test_data
            ) as response:
                print(f"   Статус: {response.status}")
                text = await response.text()
                print(f"   Ответ: {text}")
                
                if response.status == 200:
                    data = json.loads(text)
                    print(f"   ✅ Успех! ID запроса: {data.get('id')}")
                    print(f"   Статус: {data.get('status')}")
                    print(f"   Артикулы: {data.get('articles')}")
                else:
                    print(f"   ❌ Ошибка: {text}")
            
            # Тест получения запросов
            print("\n📋 Тестируем получение запросов...")
            async with session.get(
                "http://localhost:8000/api/v3/article-search/requests",
                headers=headers
            ) as response:
                print(f"   Статус: {response.status}")
                text = await response.text()
                print(f"   Ответ: {text}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    asyncio.run(test_v3_final())
