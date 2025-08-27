#!/usr/bin/env python3
"""
Скрипт для отладки API чата с аутентификацией
"""

import requests
import json

# Конфигурация
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def get_auth_token():
    """Получает токен аутентификации"""
    print("🔐 Получение токена аутентификации...")
    
    # Логин пользователя
    login_data = {
        "username": "agbttest1",
        "password": "test123"  # Используйте реальный пароль
    }
    
    try:
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get('access_token')
            print(f"✅ Токен получен: {token[:20]}...")
            return token
        else:
            print(f"❌ Ошибка логина: {response.status_code}")
            print(f"Ответ: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Ошибка при получении токена: {e}")
        return None

def test_chat_room(token, room_id):
    """Тестирует конкретный чат"""
    print(f"\n💬 Тестирование чата {room_id}...")
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        # Получаем детали чата
        response = requests.get(f"{API_URL}/chat/rooms/{room_id}", headers=headers)
        if response.status_code == 200:
            room_data = response.json()
            print(f"✅ Детали чата получены")
            
            # Проверяем участников
            participants = room_data.get('participants', [])
            print(f"👥 Участников: {len(participants)}")
            
            for i, participant in enumerate(participants):
                print(f"\n  {i+1}. ID участника: {participant.get('id')}")
                print(f"     Chat Room ID: {participant.get('chat_room_id')}")
                print(f"     User ID: {participant.get('user_id')}")
                print(f"     Bot ID: {participant.get('bot_id')}")
                print(f"     Is Admin: {participant.get('is_admin')}")
                print(f"     Joined At: {participant.get('joined_at')}")
                print(f"     Last Read At: {participant.get('last_read_at')}")
                
                # Проверяем данные пользователя
                if participant.get('user'):
                    user = participant['user']
                    print(f"     👤 Пользователь:")
                    print(f"        - ID: {user.get('id')}")
                    print(f"        - Имя: {user.get('first_name')} {user.get('last_name')}")
                    print(f"        - Username: {user.get('username')}")
                    print(f"        - Avatar: {user.get('avatar_url')}")
                    print(f"        - Department: {user.get('department_id')}")
                else:
                    print(f"     ❌ Данные пользователя отсутствуют!")
                
                # Проверяем данные бота
                if participant.get('bot'):
                    bot = participant['bot']
                    print(f"     🤖 Бот:")
                    print(f"        - ID: {bot.get('id')}")
                    print(f"        - Имя: {bot.get('name')}")
                else:
                    print(f"     ❌ Данные бота отсутствуют!")
            
            # Проверяем сообщения
            messages = room_data.get('messages', [])
            print(f"\n💬 Сообщений: {len(messages)}")
            
            if messages:
                for i, message in enumerate(messages[:3]):  # Показываем первые 3
                    print(f"\n  {i+1}. Сообщение:")
                    print(f"     ID: {message.get('id')}")
                    print(f"     Содержание: {message.get('content', 'No content')[:50]}...")
                    print(f"     Sender ID: {message.get('sender_id')}")
                    print(f"     Bot ID: {message.get('bot_id')}")
                    
                    if message.get('sender'):
                        sender = message['sender']
                        print(f"     👤 Отправитель:")
                        print(f"        - ID: {sender.get('id')}")
                        print(f"        - Имя: {sender.get('first_name')} {sender.get('last_name')}")
                    else:
                        print(f"     ❌ Данные отправителя отсутствуют!")
                    
                    if message.get('bot'):
                        bot = message['bot']
                        print(f"     🤖 От бота:")
                        print(f"        - ID: {bot.get('id')}")
                        print(f"        - Имя: {bot.get('name')}")
                    else:
                        print(f"     ❌ Данные бота отсутствуют!")
            
            return room_data
        else:
            print(f"❌ Ошибка получения деталей чата: {response.status_code}")
            print(f"Ответ: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Ошибка при тестировании чата: {e}")
        return None

def test_users_api(token):
    """Тестирует API пользователей"""
    print(f"\n👥 Тестирование API пользователей...")
    
    headers = {
        'Authorization': f'Bearer {token}'
    }
    
    try:
        response = requests.get(f"{API_URL}/users/chat-users/", headers=headers)
        if response.status_code == 200:
            users = response.json()
            print(f"✅ Пользователей для чата: {len(users)}")
            
            for i, user in enumerate(users[:5]):  # Показываем первые 5
                print(f"  {i+1}. {user.get('first_name', 'Unknown')} {user.get('last_name', 'Unknown')}")
                print(f"     📧 Username: {user.get('username', 'Unknown')}")
                print(f"     🖼️ Avatar: {user.get('avatar_url', 'None')}")
                print(f"     🏢 Department: {user.get('department_id', 'None')}")
        else:
            print(f"❌ Ошибка получения пользователей: {response.status_code}")
            print(f"Ответ: {response.text}")
    except Exception as e:
        print(f"❌ Ошибка при тестировании пользователей: {e}")

def main():
    print("🚀 Отладка API чата...")
    
    # Получаем токен
    token = get_auth_token()
    if not token:
        print("❌ Не удалось получить токен аутентификации")
        return
    
    # Тестируем API пользователей
    test_users_api(token)
    
    # Тестируем конкретный чат (ID 22 из логов)
    test_chat_room(token, 22)
    
    print("\n✅ Отладка завершена!")

if __name__ == "__main__":
    main()
