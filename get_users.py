#!/usr/bin/env python3
"""
Простой скрипт для получения пользователей через API
"""

import requests
import json

def get_users():
    """Получение пользователей через API"""
    try:
        print("🔍 Получение пользователей через API...")
        
        # Пробуем получить пользователей через API
        response = requests.get("http://localhost:8000/api/users/", timeout=10)
        
        if response.status_code == 200:
            users = response.json()
            print(f"✅ Найдено пользователей: {len(users)}")
            print("=" * 60)
            
            for user in users:
                print(f"ID: {user.get('id', 'N/A')}")
                print(f"Username: {user.get('username', 'N/A')}")
                print(f"Email: {user.get('email', 'N/A')}")
                print(f"First Name: {user.get('first_name', 'N/A')}")
                print(f"Last Name: {user.get('last_name', 'N/A')}")
                print(f"Middle Name: {user.get('middle_name', 'N/A')}")
                print(f"Role: {user.get('role', 'N/A')}")
                print(f"Is Active: {user.get('is_active', 'N/A')}")
                print(f"Created At: {user.get('created_at', 'N/A')}")
                print(f"Updated At: {user.get('updated_at', 'N/A')}")
                print("-" * 40)
        else:
            print(f"❌ Ошибка API: {response.status_code}")
            print(f"Ответ: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Не удалось подключиться к API. Проверьте, запущен ли backend.")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    get_users()
