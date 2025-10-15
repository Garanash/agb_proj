#!/usr/bin/env python3
"""
Скрипт для создания тестовых чатов между сотрудниками
"""

import asyncio
import sys
import os

# Добавляем путь к backend в PYTHONPATH
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from database import AsyncSessionLocal
from models import ChatRoom, ChatParticipant, ChatMessage, User
from sqlalchemy import text
from datetime import datetime, timedelta

async def create_test_chats():
    """Создание тестовых чатов между сотрудниками"""
    print("💬 Создание тестовых чатов...")
    
    try:
        async with AsyncSessionLocal() as db:
            # Получаем пользователей
            result = await db.execute(text("SELECT id, username, first_name, last_name, role FROM users WHERE is_active = true"))
            users = result.fetchall()
            user_map = {user[1]: {"id": user[0], "name": f"{user[2]} {user[3]}", "role": user[4]} for user in users}
            
            # Создаем тестовые чаты
            test_chats = [
                {
                    "name": "Общий чат компании",
                    "description": "Общий чат для всех сотрудников компании",
                    "is_private": False,
                    "participants": ["admin", "manager1", "manager2", "employee1", "employee2", "ved_passport1", "user1"]
                },
                {
                    "name": "Отдел продаж",
                    "description": "Чат отдела продаж",
                    "is_private": False,
                    "participants": ["admin", "manager1", "user1"]
                },
                {
                    "name": "Производственный отдел",
                    "description": "Чат производственного отдела",
                    "is_private": False,
                    "participants": ["admin", "manager2", "employee1", "employee2"]
                },
                {
                    "name": "ВЭД отдел",
                    "description": "Чат отдела внешнеэкономической деятельности",
                    "is_private": False,
                    "participants": ["admin", "ved_passport1"]
                },
                {
                    "name": "Техническая поддержка",
                    "description": "Чат для технических вопросов",
                    "is_private": False,
                    "participants": ["admin", "employee1", "employee2"]
                },
                {
                    "name": "Личный чат: Админ - Менеджер",
                    "description": "Личный чат между администратором и менеджером",
                    "is_private": True,
                    "participants": ["admin", "manager1"]
                },
                {
                    "name": "Личный чат: Менеджер - Сотрудник",
                    "description": "Личный чат между менеджером и сотрудником",
                    "is_private": True,
                    "participants": ["manager1", "employee1"]
                }
            ]
            
            created_chats = []
            for chat_data in test_chats:
                # Проверяем, существует ли чат
                result = await db.execute(
                    text("SELECT id FROM chat_rooms WHERE name = :name"),
                    {"name": chat_data["name"]}
                )
                existing = result.fetchone()
                
                if not existing:
                    # Создаем чат
                    chat = ChatRoom(
                        name=chat_data["name"],
                        description=chat_data["description"],
                        is_private=chat_data["is_private"],
                        is_active=True,
                        created_by=user_map["admin"]["id"]
                    )
                    
                    db.add(chat)
                    await db.flush()
                    
                    # Добавляем участников
                    for username in chat_data["participants"]:
                        if username in user_map:
                            participant = ChatParticipant(
                                room_id=chat.id,
                                user_id=user_map[username]["id"],
                                is_admin=(username == "admin"),
                                joined_at=datetime.now()
                            )
                            db.add(participant)
                    
                    created_chats.append(chat)
                    print(f"✅ Создан чат: {chat.name} ({len(chat_data['participants'])} участников)")
                else:
                    print(f"ℹ️ Чат уже существует: {chat_data['name']}")
            
            await db.commit()
            
            # Создаем тестовые сообщения
            print("\n📝 Создание тестовых сообщений...")
            
            test_messages = [
                {
                    "chat_name": "Общий чат компании",
                    "sender": "admin",
                    "content": "Добро пожаловать в общий чат компании! Здесь мы обсуждаем общие вопросы и новости.",
                    "hours_ago": 24
                },
                {
                    "chat_name": "Общий чат компании",
                    "sender": "manager1",
                    "content": "Спасибо! Рад быть частью команды.",
                    "hours_ago": 23
                },
                {
                    "chat_name": "Общий чат компании",
                    "sender": "employee1",
                    "content": "Привет всем! Готов к работе!",
                    "hours_ago": 22
                },
                {
                    "chat_name": "Отдел продаж",
                    "sender": "admin",
                    "content": "Обсуждение планов продаж на текущий месяц.",
                    "hours_ago": 20
                },
                {
                    "chat_name": "Отдел продаж",
                    "sender": "manager1",
                    "content": "У нас есть несколько перспективных клиентов. Нужно подготовить коммерческие предложения.",
                    "hours_ago": 19
                },
                {
                    "chat_name": "Производственный отдел",
                    "sender": "manager2",
                    "content": "Обновление по текущим производственным задачам.",
                    "hours_ago": 18
                },
                {
                    "chat_name": "Производственный отдел",
                    "sender": "employee1",
                    "content": "Все идет по плану. Завершаем проект А.",
                    "hours_ago": 17
                },
                {
                    "chat_name": "ВЭД отдел",
                    "sender": "ved_passport1",
                    "content": "Подготовлены документы для экспорта партии оборудования.",
                    "hours_ago": 16
                },
                {
                    "chat_name": "Техническая поддержка",
                    "sender": "employee2",
                    "content": "Помощь нужна с настройкой нового сервера.",
                    "hours_ago": 15
                },
                {
                    "chat_name": "Личный чат: Админ - Менеджер",
                    "sender": "admin",
                    "content": "Привет! Как дела с новым проектом?",
                    "hours_ago": 14
                },
                {
                    "chat_name": "Личный чат: Админ - Менеджер",
                    "sender": "manager1",
                    "content": "Все хорошо! Проект движется по плану. Спасибо за поддержку!",
                    "hours_ago": 13
                },
                {
                    "chat_name": "Личный чат: Менеджер - Сотрудник",
                    "sender": "manager1",
                    "content": "Привет! Нужно обсудить задачу на завтра.",
                    "hours_ago": 12
                },
                {
                    "chat_name": "Личный чат: Менеджер - Сотрудник",
                    "sender": "employee1",
                    "content": "Конечно! Готов к обсуждению.",
                    "hours_ago": 11
                }
            ]
            
            created_messages = 0
            for msg_data in test_messages:
                # Находим чат
                result = await db.execute(
                    text("SELECT id FROM chat_rooms WHERE name = :name"),
                    {"name": msg_data["chat_name"]}
                )
                chat = result.fetchone()
                
                if chat and msg_data["sender"] in user_map:
                    # Создаем сообщение
                    message = ChatMessage(
                        room_id=chat[0],
                        sender_id=user_map[msg_data["sender"]]["id"],
                        content=msg_data["content"],
                        is_edited=False,
                        created_at=datetime.now() - timedelta(hours=msg_data["hours_ago"])
                    )
                    
                    db.add(message)
                    created_messages += 1
            
            await db.commit()
            print(f"✅ Создано {created_messages} тестовых сообщений!")
            
            # Выводим сводку
            print(f"\n🎉 Создано {len(created_chats)} чатов!")
            print("\n📋 Созданные чаты:")
            for chat in created_chats:
                print(f"  - {chat.name} ({'Приватный' if chat.is_private else 'Публичный'})")
            
            print(f"\n📝 Создано {created_messages} тестовых сообщений в чатах!")
                
    except Exception as e:
        print(f"❌ Ошибка при создании чатов: {e}")
        import traceback
        traceback.print_exc()
        raise

async def main():
    """Основная функция"""
    print("🚀 Создание тестовых чатов и сообщений...")
    
    try:
        await create_test_chats()
        print("\n🎉 Все тестовые чаты созданы успешно!")
        
    except Exception as e:
        print(f"\n💥 Критическая ошибка: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
