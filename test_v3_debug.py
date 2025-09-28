#!/usr/bin/env python3
"""
Тест для отладки API v3
"""

import asyncio
import aiohttp
import json

async def test_v3_api():
    """Тестируем API v3"""
    
    # Тестовые данные
    test_data = {
        "articles": ["25241"],
        "request_name": "Тест поиска",
        "use_ai": False,
        "validate_contacts": False
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc1OTA5NjIwMH0.ruFLXYacTWatO1rqkeHh_UWTOcmntErJ3VxyqcoU2Iw"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            print("🔍 Тестируем API v3...")
            
            # Тест health check
            async with session.get("http://localhost:8000/api/v3/health") as response:
                print(f"✅ Health check: {response.status}")
                data = await response.json()
                print(f"   Ответ: {data}")
            
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
                    print(f"   ID запроса: {data.get('id')}")
                    print(f"   Статус: {data.get('status')}")
                else:
                    print(f"   ❌ Ошибка: {text}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    asyncio.run(test_v3_api())
