#!/usr/bin/env python3
"""
Простой тест API endpoints для проверки работоспособности
"""
import asyncio
import httpx
import json

async def test_api_endpoints():
    """Тестирование основных API endpoints"""
    print("🚀 ТЕСТИРОВАНИЕ API ENDPOINTS")
    print("=" * 50)

    base_url = "http://localhost"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # 1. Тест здоровья API
            print("📊 1. Проверка здоровья API...")
            response = await client.get(f"{base_url}/api/health")
            if response.status_code == 200:
                print("✅ API здоровье: OK")
            else:
                print(f"❌ API здоровье: {response.status_code}")

            # 2. Тест корневого API endpoint
            print("\n📋 2. Проверка корневого API endpoint...")
            response = await client.get(f"{base_url}/api/")
            if response.status_code == 200:
                data = response.json()
                print("✅ Корневой API: OK")
                print(f"   Доступные endpoints: {len(data.get('endpoints', {}))}")
                for name, path in data.get('endpoints', {}).items():
                    print(f"   - {name}: {path}")
            else:
                print(f"❌ Корневой API: {response.status_code}")

            # 3. Тест отладки маршрутов
            print("\n🔍 3. Проверка зарегистрированных маршрутов...")
            response = await client.get(f"{base_url}/api/debug/routes")
            if response.status_code == 200:
                data = response.json()
                print("✅ Маршруты: OK")
                print(f"   Всего маршрутов: {data.get('total', 0)}")

                # Проверяем наличие ключевых маршрутов
                routes = [route['path'] for route in data.get('routes', [])]
                key_routes = [
                    '/api/auth/login',
                    '/api/users/chat-users',
                    '/api/departments/list',
                    '/api/company-employees/',
                    '/api/events/',
                    '/api/chat/rooms/',
                    '/api/chat/bots/'
                ]

                print("   🔑 Ключевые маршруты:")
                for route in key_routes:
                    if any(r.startswith(route) for r in routes):
                        print(f"   ✅ {route}")
                    else:
                        print(f"   ❌ {route} - НЕ НАЙДЕН")
            else:
                print(f"❌ Маршруты: {response.status_code}")

        except Exception as e:
            print(f"❌ Ошибка при тестировании: {e}")

    print("\n" + "=" * 50)
    print("🏁 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")

if __name__ == "__main__":
    asyncio.run(test_api_endpoints())
