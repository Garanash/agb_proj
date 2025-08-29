#!/usr/bin/env python3
"""
Тест логина изнутри контейнера backend
"""
import asyncio
import httpx
import json

async def test_login_from_container():
    """Тест логина через локальный API backend'а"""
    print("🔍 Тестируем логин через локальный API backend'а...")

    try:
        # Сначала проверим здоровье через локальный адрес
        async with httpx.AsyncClient() as client:
            # Тест 1: Проверка здоровья через localhost:8000
            print("\n📊 Тест 1: Проверка здоровья через localhost:8000")
            try:
                response = await client.get("http://localhost:8000/api/health", timeout=5.0)
                print(f"✅ Health check: {response.status_code}")
                print(f"📄 Response: {response.text}")
            except Exception as e:
                print(f"❌ Health check failed: {e}")

            # Тест 2: Проверка здоровья через backend:8000
            print("\n📊 Тест 2: Проверка здоровья через backend:8000")
            try:
                response = await client.get("http://backend:8000/api/health", timeout=5.0)
                print(f"✅ Health check (backend): {response.status_code}")
                print(f"📄 Response: {response.text}")
            except Exception as e:
                print(f"❌ Health check (backend) failed: {e}")

            # Тест 3: Попытка логина через localhost:8000
            print("\n🔐 Тест 3: Попытка логина через localhost:8000")
            login_data = {
                "username": "admin",
                "password": "admin123"
            }

            try:
                response = await client.post(
                    "http://localhost:8000/api/auth/login",
                    json=login_data,
                    timeout=10.0
                )

                print(f"📊 Status: {response.status_code}")
                print(f"📄 Response: {response.text}")

                if response.status_code == 200:
                    data = response.json()
                    if "access_token" in data:
                        print("✅ Логин успешен через localhost!")
                        return True
                    else:
                        print("❌ Нет токена в ответе")
                else:
                    print(f"❌ Ошибка логина: {response.status_code}")

            except Exception as e:
                print(f"❌ Login через localhost failed: {e}")

            # Тест 4: Попытка логина через backend:8000
            print("\n🔐 Тест 4: Попытка логина через backend:8000")
            try:
                response = await client.post(
                    "http://backend:8000/api/auth/login",
                    json=login_data,
                    timeout=10.0
                )

                print(f"📊 Status: {response.status_code}")
                print(f"📄 Response: {response.text}")

                if response.status_code == 200:
                    data = response.json()
                    if "access_token" in data:
                        print("✅ Логин успешен через backend!")
                        return True
                    else:
                        print("❌ Нет токена в ответе")
                else:
                    print(f"❌ Ошибка логина: {response.status_code}")

            except Exception as e:
                print(f"❌ Login через backend failed: {e}")

        return False

    except Exception as e:
        print(f"❌ Общая ошибка: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_login_from_container())
    if result:
        print("\n🎉 Логин работает!")
    else:
        print("\n❌ Логин не работает. Проверьте логи backend'а.")
