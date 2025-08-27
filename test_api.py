#!/usr/bin/env python3
"""
Скрипт для тестирования API чата
"""

import requests
import json

# Конфигурация
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"

def test_auth():
    """Тестирует аутентификацию"""
    print("🔐 Тестирование аутентификации...")
    
    # Получаем список пользователей для получения токена
    response = requests.get(f"{API_URL}/users/")
    if response.status_code == 200:
        users = response.json()
        if users:
            # Берем первого пользователя для тестирования
            user = users[0]
            print(f"✅ Найден пользователь: {user.get('first_name', 'Unknown')} {user.get('last_name', 'Unknown')}")
            return user.get('id')
        else:
            print("❌ Пользователи не найдены")
            return None
    else:
        print(f"❌ Ошибка получения пользователей: {response.status_code}")
        return None

def test_chat_rooms(user_id):
    """Тестирует API чатов"""
    print(f"\n💬 Тестирование API чатов для пользователя {user_id}...")
    
    # Получаем список чатов
    response = requests.get(f"{API_URL}/chat/rooms/")
    if response.status_code == 200:
        rooms = response.json()
        print(f"✅ Найдено чатов: {len(rooms)}")
        
        if rooms:
            # Тестируем первый чат
            room = rooms[0]
            print(f"📋 Тестируем чат: {room.get('name', 'Unknown')} (ID: {room.get('id')})")
            
            # Получаем детали чата
            room_response = requests.get(f"{API_URL}/chat/rooms/{room['id']}")
            if room_response.status_code == 200:
                room_details = room_response.json()
                print(f"✅ Детали чата получены")
                
                # Проверяем участников
                participants = room_details.get('participants', [])
                print(f"👥 Участников: {len(participants)}")
                
                for i, participant in enumerate(participants):
                    print(f"  {i+1}. ID: {participant.get('id')}")
                    if participant.get('user'):
                        user = participant['user']
                        print(f"     👤 Пользователь: {user.get('first_name', 'Unknown')} {user.get('last_name', 'Unknown')}")
                        print(f"     📧 Username: {user.get('username', 'Unknown')}")
                        print(f"     🖼️ Avatar: {user.get('avatar_url', 'None')}")
                    elif participant.get('bot'):
                        bot = participant['bot']
                        print(f"     🤖 Бот: {bot.get('name', 'Unknown')}")
                    else:
                        print(f"     ❓ Неизвестный тип участника")
                    print(f"     👑 Админ: {participant.get('is_admin', False)}")
                
                # Проверяем сообщения
                messages = room_details.get('messages', [])
                print(f"💬 Сообщений: {len(messages)}")
                
                if messages:
                    for i, message in enumerate(messages[:3]):  # Показываем первые 3
                        print(f"  {i+1}. {message.get('content', 'No content')[:50]}...")
                        if message.get('sender'):
                            sender = message['sender']
                            print(f"     👤 От: {sender.get('first_name', 'Unknown')} {sender.get('last_name', 'Unknown')}")
                        elif message.get('bot'):
                            bot = message['bot']
                            print(f"     🤖 От бота: {bot.get('name', 'Unknown')}")
                
                return room_details
            else:
                print(f"❌ Ошибка получения деталей чата: {room_response.status_code}")
                return None
        else:
            print("❌ Чаты не найдены")
            return None
    else:
        print(f"❌ Ошибка получения чатов: {response.status_code}")
        return None

def test_users_api():
    """Тестирует API пользователей"""
    print(f"\n👥 Тестирование API пользователей...")
    
    response = requests.get(f"{API_URL}/users/chat-users/")
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

def main():
    print("🚀 Тестирование API чата...")
    
    # Тестируем аутентификацию
    user_id = test_auth()
    
    if user_id:
        # Тестируем чаты
        test_chat_rooms(user_id)
        
        # Тестируем пользователей
        test_users_api()
    else:
        print("❌ Не удалось получить пользователя для тестирования")
    
    print("\n✅ Тестирование завершено!")

if __name__ == "__main__":
    main()
