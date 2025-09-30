#!/usr/bin/env python3
"""
Тест API v3 с аутентификацией
"""

import asyncio
import aiohttp
import json

async def test_v3_auth():
    """Тест API v3 с аутентификацией"""
    
    # Сначала получим токен
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            print("🔐 Получаем токен аутентификации...")
            
            # Логин
            async with session.post(
                "http://localhost:8000/api/v1/auth/login",
                headers=headers,
                json=login_data
            ) as response:
                print(f"   Статус логина: {response.status}")
                if response.status == 200:
                    data = await response.json()
                    token = data.get('access_token')
                    print(f"   ✅ Токен получен: {token[:20]}...")
                else:
                    text = await response.text()
                    print(f"   ❌ Ошибка логина: {text}")
                    return
            
            # Теперь тестируем поиск с токеном
            auth_headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}"
            }
            
            test_data = {
                "articles": ["25241"],
                "request_name": "Тест поиска",
                "use_ai": False,
                "validate_contacts": False
            }
            
            print("\n🔍 Тестируем поиск с аутентификацией...")
            async with session.post(
                "http://localhost:8000/api/v3/article-search/search",
                headers=auth_headers,
                json=test_data
            ) as response:
                print(f"   Статус поиска: {response.status}")
                text = await response.text()
                print(f"   Ответ: {text}")
                
                if response.status == 200:
                    data = json.loads(text)
                    print(f"   ✅ Успех! ID запроса: {data.get('id')}")
                else:
                    print(f"   ❌ Ошибка: {text}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    asyncio.run(test_v3_auth())
