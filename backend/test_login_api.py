import asyncio
import httpx
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    """Хеширование пароля для теста"""
    return pwd_context.hash(password)

async def test_login_api():
    """Тест API логина"""
    base_url = "http://localhost:8000"

    try:
        # Сначала проверим здоровье API
        async with httpx.AsyncClient() as client:
            health_response = await client.get(f"{base_url}/api/health")
            print(f"Health check: {health_response.status_code}")
            print(f"Health response: {health_response.json()}")

            # Пробуем разные комбинации логина/пароля
            login_attempts = [
                {"username": "admin", "password": "admin"},
                {"username": "admin", "password": "admin123"},
                {"username": "admin", "password": "password"}
            ]

            for attempt in login_attempts:
                print(f"\n🔐 Тестируем логин: {attempt['username']} / {attempt['password']}")

                try:
                    response = await client.post(
                        f"{base_url}/api/auth/login",
                        json=attempt,
                        timeout=10.0
                    )

                    print(f"Status: {response.status_code}")
                    print(f"Response: {response.json()}")

                    if response.status_code == 200:
                        data = response.json()
                        if "access_token" in data:
                            print("✅ Успешный вход!")
                            return True
                        else:
                            print("❌ Нет токена в ответе")
                    else:
                        print(f"❌ Ошибка входа: {response.json()}")

                except httpx.RequestError as e:
                    print(f"❌ Ошибка запроса: {e}")

        return False

    except Exception as e:
        print(f"❌ Ошибка: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_login_api())
    if result:
        print("\n🎉 Логин работает!")
    else:
        print("\n❌ Логин не работает!")
