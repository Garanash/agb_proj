#!/usr/bin/env python3
"""
Комплексный тест всех функций платформы
"""
import asyncio
import httpx
import json
from typing import Dict, Any

class PlatformTester:
    def __init__(self, base_url: str = "http://localhost"):
        self.base_url = base_url
        self.token = None
        self.user = None

    async def login(self, username: str = "admin", password: str = "admin123") -> bool:
        """Авторизация в системе"""
        print(f"🔐 Авторизация пользователя: {username}")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/api/auth/login",
                    json={"username": username, "password": password},
                    timeout=10.0
                )

                if response.status_code == 200:
                    data = response.json()
                    self.token = data.get("access_token")
                    self.user = data.get("user")
                    print(f"✅ Успешная авторизация: {self.user['username']}")
                    return True
                else:
                    print(f"❌ Ошибка авторизации: {response.status_code}")
                    print(f"   Ответ: {response.text}")
                    return False
        except Exception as e:
            print(f"❌ Ошибка сети при авторизации: {e}")
            return False

    async def test_api_health(self) -> bool:
        """Тест здоровья API"""
        print("📊 Тест здоровья API")

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/health", timeout=5.0)
                if response.status_code == 200:
                    print("✅ API здоровье: OK")
                    return True
                else:
                    print(f"❌ API здоровье: {response.status_code}")
                    return False
        except Exception as e:
            print(f"❌ Ошибка при проверке здоровья API: {e}")
            return False

    async def test_users_api(self) -> bool:
        """Тест API пользователей для чата"""
        print("👥 Тест API пользователей для чата")

        if not self.token:
            print("❌ Нет токена авторизации")
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/users/chat-users",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10.0
                )

                if response.status_code == 200:
                    users = response.json()
                    print(f"✅ Пользователи для чата: {len(users)} пользователей")
                    if len(users) > 0:
                        print(f"   Первый пользователь: {users[0]['username']}")
                    return True
                else:
                    print(f"❌ Ошибка получения пользователей: {response.status_code}")
                    print(f"   Ответ: {response.text}")
                    return False
        except Exception as e:
            print(f"❌ Ошибка при получении пользователей: {e}")
            return False

    async def test_departments_api(self) -> bool:
        """Тест API отделов"""
        print("🏢 Тест API отделов")

        if not self.token:
            print("❌ Нет токена авторизации")
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/departments/list",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10.0
                )

                if response.status_code == 200:
                    departments = response.json()
                    print(f"✅ Отделы: {len(departments)} отделов")
                    if len(departments) > 0:
                        print(f"   Первый отдел: {departments[0]['name']}")
                    return True
                else:
                    print(f"❌ Ошибка получения отделов: {response.status_code}")
                    print(f"   Ответ: {response.text}")
                    return False
        except Exception as e:
            print(f"❌ Ошибка при получении отделов: {e}")
            return False

    async def test_employees_api(self) -> bool:
        """Тест API сотрудников компании"""
        print("👷 Тест API сотрудников компании")

        if not self.token:
            print("❌ Нет токена авторизации")
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/company-employees/",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10.0
                )

                if response.status_code == 200:
                    employees = response.json()
                    print(f"✅ Сотрудники компании: {len(employees)} сотрудников")
                    if len(employees) > 0:
                        print(f"   Первый сотрудник: {employees[0]['first_name']} {employees[0]['last_name']}")
                    return True
                else:
                    print(f"❌ Ошибка получения сотрудников: {response.status_code}")
                    print(f"   Ответ: {response.text}")
                    return False
        except Exception as e:
            print(f"❌ Ошибка при получении сотрудников: {e}")
            return False

    async def test_event_creation(self) -> bool:
        """Тест создания события с участниками"""
        print("📅 Тест создания события")

        if not self.token or not self.user:
            print("❌ Нет токена или данных пользователя")
            return False

        try:
            async with httpx.AsyncClient() as client:
                # Получаем пользователей для участников
                users_response = await client.get(
                    f"{self.base_url}/api/users/chat-users",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10.0
                )

                if users_response.status_code != 200:
                    print("❌ Не удалось получить список пользователей")
                    return False

                users = users_response.json()
                # Берем первых 2 пользователей как участников (кроме текущего)
                participants = []
                for user in users[:3]:  # Берем первых 3 пользователей
                    if user['id'] != self.user['id']:
                        participants.append(user['id'])
                        if len(participants) >= 2:  # Максимум 2 участника для теста
                            break

                if len(participants) == 0:
                    print("⚠️  Недостаточно пользователей для создания события с участниками")
                    participants = [self.user['id']]  # Только текущий пользователь

                # Создаем тестовое событие
                from datetime import datetime, timedelta
                now = datetime.now()
                start_time = now + timedelta(days=1, hours=10)
                end_time = start_time + timedelta(hours=1)

                event_data = {
                    "title": "Тестовое событие",
                    "description": "Создано автоматическим тестом",
                    "start_date": start_time.isoformat(),
                    "end_date": end_time.isoformat(),
                    "event_type": "meeting",
                    "is_public": False,
                    "participants": participants
                }

                print(f"   Создание события с {len(participants)} участниками...")

                response = await client.post(
                    f"{self.base_url}/api/events/",
                    json=event_data,
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=15.0
                )

                if response.status_code == 200:
                    event = response.json()
                    print(f"✅ Событие создано: {event['title']}")
                    print(f"   ID: {event['id']}")
                    print(f"   Участники: {len(event.get('participants', []))}")
                    return True
                else:
                    print(f"❌ Ошибка создания события: {response.status_code}")
                    print(f"   Ответ: {response.text}")
                    return False
        except Exception as e:
            print(f"❌ Ошибка при создании события: {e}")
            return False

    async def test_chat_rooms(self) -> bool:
        """Тест API чат-комнат"""
        print("💬 Тест API чат-комнат")

        if not self.token:
            print("❌ Нет токена авторизации")
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/chat/rooms/",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10.0
                )

                if response.status_code == 200:
                    rooms = response.json()
                    print(f"✅ Чат-комнаты: {len(rooms)} комнат")
                    if len(rooms) > 0:
                        print(f"   Первая комната: {rooms[0]['name']}")
                    return True
                else:
                    print(f"❌ Ошибка получения чат-комнат: {response.status_code}")
                    print(f"   Ответ: {response.text}")
                    return False
        except Exception as e:
            print(f"❌ Ошибка при получении чат-комнат: {e}")
            return False

    async def test_bots_api(self) -> bool:
        """Тест API чат-ботов"""
        print("🤖 Тест API чат-ботов")

        if not self.token:
            print("❌ Нет токена авторизации")
            return False

        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/chat/bots/",
                    headers={"Authorization": f"Bearer {self.token}"},
                    timeout=10.0
                )

                if response.status_code == 200:
                    bots = response.json()
                    print(f"✅ Чат-боты: {len(bots)} ботов")
                    if len(bots) > 0:
                        print(f"   Первый бот: {bots[0]['name']}")
                    return True
                else:
                    print(f"❌ Ошибка получения чат-ботов: {response.status_code}")
                    print(f"   Ответ: {response.text}")
                    return False
        except Exception as e:
            print(f"❌ Ошибка при получении чат-ботов: {e}")
            return False

    async def run_all_tests(self) -> Dict[str, bool]:
        """Запуск всех тестов"""
        print("🚀 ЗАПУСК КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ ПЛАТФОРМЫ")
        print("=" * 60)

        results = {}

        # 1. Тест здоровья API
        results['api_health'] = await self.test_api_health()

        # 2. Авторизация
        results['login'] = await self.login()

        if results['login']:
            # 3. Тест пользователей
            results['users_api'] = await self.test_users_api()

            # 4. Тест отделов
            results['departments_api'] = await self.test_departments_api()

            # 5. Тест сотрудников
            results['employees_api'] = await self.test_employees_api()

            # 6. Тест создания событий
            results['event_creation'] = await self.test_event_creation()

            # 7. Тест чат-комнат
            results['chat_rooms'] = await self.test_chat_rooms()

            # 8. Тест ботов
            results['bots_api'] = await self.test_bots_api()
        else:
            # Если авторизация не прошла, остальные тесты не имеют смысла
            results['users_api'] = False
            results['departments_api'] = False
            results['employees_api'] = False
            results['event_creation'] = False
            results['chat_rooms'] = False
            results['bots_api'] = False

        # Вывод результатов
        print("\n" + "=" * 60)
        print("📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:")
        print("=" * 60)

        all_passed = True
        for test_name, result in results.items():
            status = "✅ ПРОЙДЕН" if result else "❌ ПРОВАЛЕН"
            print("25")
            if not result:
                all_passed = False

        print("=" * 60)
        if all_passed:
            print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! ПЛАТФОРМА РАБОТАЕТ КОРРЕКТНО!")
        else:
            print("⚠️  НЕКОТОРЫЕ ТЕСТЫ ПРОВАЛЕНЫ. ТРЕБУЕТСЯ ИСПРАВЛЕНИЕ!")
        print("=" * 60)

        return results

async def main():
    """Главная функция"""
    import sys

    # Получаем URL из аргументов командной строки
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost"

    print(f"🎯 Тестирование платформы на: {base_url}")

    tester = PlatformTester(base_url)
    results = await tester.run_all_tests()

    # Выход с кодом ошибки если есть проваленные тесты
    failed_tests = [name for name, result in results.items() if not result]
    if failed_tests:
        print(f"\n❌ Проваленные тесты: {', '.join(failed_tests)}")
        sys.exit(1)
    else:
        print("\n✅ Все тесты пройдены!")
        sys.exit(0)

if __name__ == "__main__":
    asyncio.run(main())
