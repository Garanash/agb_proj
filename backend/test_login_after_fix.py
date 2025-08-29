#!/usr/bin/env python3
"""
Тест логина после исправления пароля
"""
import asyncio
import httpx
import json

async def test_login_after_fix():
    """Тест логина после исправления пароля"""
    print("🧪 ТЕСТ ЛОГИНА ПОСЛЕ ИСПРАВЛЕНИЯ ПАРОЛЯ")
    print("=" * 45)

    login_data = {
        "username": "admin",
        "password": "admin123"
    }

    try:
        async with httpx.AsyncClient() as client:
            # Тест 1: Через nginx
            print("\n🔐 Тест через nginx:")
            try:
                response = await client.post(
                    "http://localhost/api/auth/login",
                    json=login_data,
                    timeout=10.0
                )

                print(f"📊 Статус: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    if "access_token" in data:
                        print("✅ ЛОГИН УСПЕШЕН через nginx!")
                        print(f"🎟️ Токен: {data['access_token'][:50]}...")
                        return True
                    else:
                        print("❌ Нет токена в ответе")
                else:
                    print(f"❌ Ошибка: {response.json()}")

            except Exception as e:
                print(f"❌ Ошибка nginx: {e}")

            # Тест 2: Через backend напрямую
            print("\n🔐 Тест через backend напрямую:")
            try:
                response = await client.post(
                    "http://localhost:8000/api/auth/login",
                    json=login_data,
                    timeout=10.0
                )

                print(f"📊 Статус: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    if "access_token" in data:
                        print("✅ ЛОГИН УСПЕШЕН через backend!")
                        print(f"🎟️ Токен: {data['access_token'][:50]}...")
                        return True
                    else:
                        print("❌ Нет токена в ответе")
                else:
                    print(f"❌ Ошибка: {response.json()}")

            except Exception as e:
                print(f"❌ Ошибка backend: {e}")

        return False

    except Exception as e:
        print(f"❌ Общая ошибка: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_login_after_fix())
    if result:
        print("\n🎉 ВСЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!")
        print("✅ Проблема с паролем исправлена!")
    else:
        print("\n❌ Тесты не прошли. Проверьте логи.")
