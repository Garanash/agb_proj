#!/usr/bin/env python3
"""
Тест API endpoints чата
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_chat_endpoints():
    """Тестирует API endpoints чата"""
    
    print("🧪 Тестирование API endpoints чата\n")
    
    # Сначала нужно получить токен авторизации
    # Для этого используем тестового пользователя
    login_data = {
        "username": "chattest",
        "password": "testpassword"
    }
    
    try:
        # Логинимся
        print("🔐 Авторизация...")
        response = requests.post(f"{BASE_URL}/api/v1/auth/login", json=login_data)
        
        if response.status_code != 200:
            print(f"❌ Ошибка авторизации: {response.status_code}")
            print(response.text)
            return
        
        token_data = response.json()
        token = token_data.get("access_token")
        
        if not token:
            print("❌ Токен не получен")
            return
        
        print("✅ Авторизация успешна")
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        # Тест 1: Получение сессий
        print("\n📋 Тест 1: Получение сессий чата")
        response = requests.get(f"{BASE_URL}/api/v1/chat/sessions/", headers=headers)
        
        if response.status_code == 200:
            sessions = response.json()
            print(f"✅ Получено сессий: {len(sessions)}")
            for session in sessions:
                print(f"  • {session['title']} (ID: {session['id']})")
        else:
            print(f"❌ Ошибка получения сессий: {response.status_code}")
            print(response.text)
        
        # Тест 2: Создание новой сессии
        print("\n🆕 Тест 2: Создание новой сессии")
        session_data = {
            "title": "Тестовая сессия API"
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/chat/sessions/", 
                               headers=headers, 
                               json=session_data)
        
        if response.status_code == 200:
            new_session = response.json()
            session_id = new_session['id']
            print(f"✅ Создана сессия: {new_session['title']} (ID: {session_id})")
        else:
            print(f"❌ Ошибка создания сессии: {response.status_code}")
            print(response.text)
            return
        
        # Тест 3: Создание сообщения
        print("\n💬 Тест 3: Создание сообщения")
        message_data = {
            "content": "Привет! Это тестовое сообщение",
            "files_data": None,
            "matching_results": None
        }
        
        response = requests.post(f"{BASE_URL}/api/v1/chat/sessions/{session_id}/messages/", 
                               headers=headers, 
                               json=message_data)
        
        if response.status_code == 200:
            message = response.json()
            print(f"✅ Создано сообщение: {message['content'][:50]}...")
        else:
            print(f"❌ Ошибка создания сообщения: {response.status_code}")
            print(response.text)
        
        # Тест 4: Получение сессии с сообщениями
        print("\n📖 Тест 4: Получение сессии с сообщениями")
        response = requests.get(f"{BASE_URL}/api/v1/chat/sessions/{session_id}", headers=headers)
        
        if response.status_code == 200:
            session = response.json()
            messages = session.get('messages', [])
            print(f"✅ Получена сессия с {len(messages)} сообщениями")
            for msg in messages:
                print(f"  • {msg['message_type']}: {msg['content'][:50]}...")
        else:
            print(f"❌ Ошибка получения сессии: {response.status_code}")
            print(response.text)
        
        print("\n🎉 Тестирование завершено!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Ошибка подключения к серверу. Убедитесь, что сервер запущен.")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    test_chat_endpoints()
