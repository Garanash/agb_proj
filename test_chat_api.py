#!/usr/bin/env python3
"""
Тест API чатов для диагностики проблем
"""
import asyncio
import httpx
import json

async def test_chat_api():
    """Тестирование API чатов"""
    print("🔍 ТЕСТИРОВАНИЕ API ЧАТОВ")
    print("=" * 50)

    base_url = "http://localhost"

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # 1. Проверяем здоровье API
            print("📊 1. Проверка здоровья API...")
            response = await client.get(f"{base_url}/api/health")
            if response.status_code == 200:
                print("✅ API здоровье: OK")
            else:
                print(f"❌ API здоровье: {response.status_code}")
                return

            # 2. Проверяем авторизацию
            print("\n🔐 2. Авторизация...")
            auth_response = await client.post(
                f"{base_url}/api/auth/login",
                json={"username": "admin", "password": "admin123"},
                timeout=10.0
            )

            if auth_response.status_code == 200:
                auth_data = auth_response.json()
                token = auth_data.get("access_token")
                user = auth_data.get("user")
                print(f"✅ Авторизация успешна: {user['username']}")
            else:
                print(f"❌ Ошибка авторизации: {auth_response.status_code}")
                print(f"   Ответ: {auth_response.text}")
                return

            headers = {"Authorization": f"Bearer {token}"}

            # 3. Проверяем список пользователей
            print("\n👥 3. Получение списка пользователей...")
            users_response = await client.get(
                f"{base_url}/api/users/list",
                headers=headers,
                timeout=10.0
            )

            users = []
            if users_response.status_code == 200:
                users = users_response.json()
                print(f"✅ Пользователи получены: {len(users)} пользователей")
                if users:
                    print(f"   Первый пользователь: {users[0]['username']}")
            else:
                print(f"❌ Ошибка получения пользователей: {users_response.status_code}")
                print(f"   Ответ: {users_response.text}")

            # 4. Проверяем список отделов
            print("\n🏢 4. Получение списка отделов...")
            depts_response = await client.get(
                f"{base_url}/api/departments/list",
                headers=headers,
                timeout=10.0
            )

            if depts_response.status_code == 200:
                departments = depts_response.json()
                print(f"✅ Отделы получены: {len(departments)} отделов")
                if departments:
                    print(f"   Первый отдел: {departments[0]['name']}")
            else:
                print(f"❌ Ошибка получения отделов: {depts_response.status_code}")
                print(f"   Ответ: {depts_response.text}")

            # 5. Проверяем список чатов
            print("\n💬 5. Получение списка чатов...")
            chats_response = await client.get(
                f"{base_url}/api/chat/rooms/",
                headers=headers,
                timeout=10.0
            )

            if chats_response.status_code == 200:
                chats = chats_response.json()
                print(f"✅ Чаты получены: {len(chats)} чатов")
            else:
                print(f"❌ Ошибка получения чатов: {chats_response.status_code}")
                print(f"   Ответ: {chats_response.text}")

            # 6. Пытаемся создать чат
            print("\n💬 6. Попытка создания чата...")
            if len(users) > 1:
                # Берем первого пользователя кроме текущего
                participants = []
                for user in users[:2]:  # Берем первых 2 пользователей
                    if user['id'] != user['id']:  # Исключаем текущего пользователя
                        participants.append(user['id'])
                    if len(participants) >= 1:  # Минимум 1 участник для теста
                        break

                chat_data = {
                    "name": "Тестовый чат API",
                    "description": "Создан через API тест",
                    "is_private": False,
                    "participants": participants,
                    "bots": []
                }

                create_response = await client.post(
                    f"{base_url}/api/chat/rooms/",
                    json=chat_data,
                    headers=headers,
                    timeout=15.0
                )

                if create_response.status_code == 200:
                    chat = create_response.json()
                    print(f"✅ Чат создан: {chat['name']}")
                    print(f"   ID: {chat['id']}")
                else:
                    print(f"❌ Ошибка создания чата: {create_response.status_code}")
                    print(f"   Ответ: {create_response.text}")
            else:
                print("⚠️  Недостаточно пользователей для создания чата")

        except Exception as e:
            print(f"❌ Ошибка при тестировании: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "=" * 50)
    print("🏁 ТЕСТИРОВАНИЕ ЗАВЕРШЕНО")

if __name__ == "__main__":
    asyncio.run(test_chat_api())
