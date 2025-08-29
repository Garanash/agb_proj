#!/usr/bin/env python3
"""
Комплексный тест всех API эндпоинтов платформы
"""
import asyncio
import httpx
import json
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

class APIEndpointTester:
    """Тестер API эндпоинтов"""

    def __init__(self, base_url="http://localhost"):
        self.base_url = base_url
        self.client = None
        self.token = None
        self.user = None
        self.test_results = {}

    async def __aenter__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()

    def log_result(self, test_name, success, message=""):
        """Записывает результат теста"""
        self.test_results[test_name] = {
            "success": success,
            "message": message
        }
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {message}")

    async def test_health(self):
        """Тест здоровья API"""
        try:
            response = await self.client.get(f"{self.base_url}/api/health")
            if response.status_code == 200:
                data = response.json()
                self.log_result("API Health", True, f"Status: {data.get('status', 'unknown')}")
                return True
            else:
                self.log_result("API Health", False, f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("API Health", False, str(e))
            return False

    async def test_auth_login(self):
        """Тест авторизации"""
        try:
            login_data = {
                "username": "admin",
                "password": "admin123"
            }
            response = await self.client.post(
                f"{self.base_url}/api/auth/login",
                json=login_data
            )

            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.user = data.get("user")
                self.log_result("Auth Login", True, f"User: {self.user['username']}")
                return True
            else:
                self.log_result("Auth Login", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Auth Login", False, str(e))
            return False

    async def test_get_users(self):
        """Тест получения списка пользователей"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = await self.client.get(
                f"{self.base_url}/api/users/list",
                headers=headers
            )

            if response.status_code == 200:
                users = response.json()
                self.log_result("Get Users", True, f"Found {len(users)} users")
                return users
            else:
                self.log_result("Get Users", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_result("Get Users", False, str(e))
            return None

    async def test_create_chat(self, users):
        """Тест создания чата"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}

            # Берем первых 2 пользователей для теста
            participants = []
            for user in users[:2]:
                if user['id'] != self.user['id']:
                    participants.append(user['id'])
                    break

            chat_data = {
                "name": "Тестовый чат API",
                "description": "Создан автоматическим тестом",
                "is_private": False,
                "participants": participants,
                "bots": []
            }

            response = await self.client.post(
                f"{self.base_url}/api/chat/rooms/",
                json=chat_data,
                headers=headers
            )

            if response.status_code == 200:
                chat = response.json()
                self.log_result("Create Chat", True, f"Chat ID: {chat['id']}")
                return chat
            else:
                error_data = response.json()
                self.log_result("Create Chat", False, f"Error: {error_data.get('detail', 'Unknown')}")
                return None
        except Exception as e:
            self.log_result("Create Chat", False, str(e))
            return None

    async def test_create_employee(self):
        """Тест создания сотрудника"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}

            employee_data = {
                "first_name": "Иван",
                "last_name": "Иванов",
                "middle_name": "Иванович",
                "position": "Тестировщик",
                "department_id": 1,
                "email": "ivan@test.com",
                "phone": "+7(999)123-45-67"
            }

            response = await self.client.post(
                f"{self.base_url}/api/company-employees/",
                json=employee_data,
                headers=headers
            )

            if response.status_code == 200:
                employee = response.json()
                self.log_result("Create Employee", True, f"Employee: {employee['first_name']} {employee['last_name']}")
                return employee
            else:
                error_data = response.json()
                self.log_result("Create Employee", False, f"Error: {error_data.get('detail', 'Unknown')}")
                return None
        except Exception as e:
            self.log_result("Create Employee", False, str(e))
            return None

    async def test_create_event(self):
        """Тест создания события"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}

            from datetime import datetime, timedelta
            now = datetime.utcnow()
            start_time = now + timedelta(hours=1)
            end_time = start_time + timedelta(hours=1)

            event_data = {
                "title": "Тестовое событие API",
                "description": "Создано автоматическим тестом",
                "start_date": start_time.isoformat(),
                "end_date": end_time.isoformat(),
                "event_type": "meeting",
                "is_public": False,
                "participants": []
            }

            response = await self.client.post(
                f"{self.base_url}/api/events/",
                json=event_data,
                headers=headers
            )

            if response.status_code == 200:
                event = response.json()
                self.log_result("Create Event", True, f"Event: {event['title']}")
                return event
            else:
                error_data = response.json()
                self.log_result("Create Event", False, f"Error: {error_data.get('detail', 'Unknown')}")
                return None
        except Exception as e:
            self.log_result("Create Event", False, str(e))
            return None

    async def test_get_departments(self):
        """Тест получения отделов"""
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = await self.client.get(
                f"{self.base_url}/api/departments/list",
                headers=headers
            )

            if response.status_code == 200:
                departments = response.json()
                self.log_result("Get Departments", True, f"Found {len(departments)} departments")
                return departments
            else:
                self.log_result("Get Departments", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_result("Get Departments", False, str(e))
            return None

    async def run_all_tests(self):
        """Запуск всех тестов"""
        print("🚀 ЗАПУСК КОМПЛЕКСНОГО ТЕСТИРОВАНИЯ API")
        print("=" * 60)

        # 1. Тест здоровья
        if not await self.test_health():
            print("❌ API недоступен, прекращаем тестирование")
            return False

        # 2. Тест авторизации
        if not await self.test_auth_login():
            print("❌ Авторизация не работает, прекращаем тестирование")
            return False

        # 3. Тест получения пользователей
        users = await self.test_get_users()
        if not users:
            print("⚠️ Пользователи недоступны, продолжаем...")

        # 4. Тест получения отделов
        departments = await self.test_get_departments()
        if not departments:
            print("⚠️ Отделы недоступны, продолжаем...")

        # 5. Тест создания сотрудника
        employee = await self.test_create_employee()

        # 6. Тест создания события
        event = await self.test_create_event()

        # 7. Тест создания чата
        if users and len(users) > 1:
            chat = await self.test_create_chat(users)
        else:
            self.log_result("Create Chat", False, "Недостаточно пользователей для теста")

        print("\n" + "=" * 60)
        print("📊 РЕЗУЛЬТАТЫ ТЕСТИРОВАНИЯ:")

        successful_tests = 0
        total_tests = len(self.test_results)

        for test_name, result in self.test_results.items():
            if result["success"]:
                successful_tests += 1

        print(f"✅ Успешных тестов: {successful_tests}/{total_tests}")
        print(f"❌ Проваленных тестов: {total_tests - successful_tests}/{total_tests}")

        if successful_tests == total_tests:
            print("🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ! ПЛАТФОРМА РАБОТАЕТ КОРРЕКТНО!")
            return True
        else:
            print("⚠️ НЕКОТОРЫЕ ТЕСТЫ ПРОВАЛЕНЫ. ТРЕБУЕТСЯ ИСПРАВЛЕНИЕ!")
            return False

async def main():
    """Главная функция"""
    base_url = os.getenv("API_URL", "http://localhost")

    async with APIEndpointTester(base_url) as tester:
        success = await tester.run_all_tests()

        if success:
            print("\n🎯 РЕЗУЛЬТАТ: ПЛАТФОРМА ГОТОВА К РАБОТЕ!")
        else:
            print("\n⚠️ РЕЗУЛЬТАТ: ТРЕБУЮТСЯ ДОПОЛНИТЕЛЬНЫЕ ИСПРАВЛЕНИЯ!")

if __name__ == "__main__":
    asyncio.run(main())
