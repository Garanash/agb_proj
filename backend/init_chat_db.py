#!/usr/bin/env python3
"""
Скрипт для инициализации таблиц чатов в базе данных
"""

import asyncio
import sys
import os

# Добавляем путь к backend в sys.path
sys.path.append(os.path.join(os.path.dirname(__file__)))

from database import get_db, engine
from models import Base, ChatRoom, ChatRoomParticipant, ChatMessage, ChatBot, ChatFolder, ChatRoomFolder

async def init_chat_tables():
    """Инициализирует таблицы чатов в базе данных"""
    try:
        print("🗄️ Создание таблиц чатов...")
        
        # Создаем все таблицы
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ Таблицы чатов успешно созданы!")
        
        # Проверяем, что таблицы существуют
        async for db in get_db():
            try:
                # Проверяем таблицу чатов
                result = await db.execute("SELECT COUNT(*) FROM chat_rooms")
                chat_count = result.scalar()
                print(f"📊 Таблица chat_rooms: {chat_count} записей")
                
                # Проверяем таблицу участников
                result = await db.execute("SELECT COUNT(*) FROM chat_room_participants")
                participant_count = result.scalar()
                print(f"👥 Таблица chat_room_participants: {participant_count} записей")
                
                # Проверяем таблицу сообщений
                result = await db.execute("SELECT COUNT(*) FROM chat_messages")
                message_count = result.scalar()
                print(f"💬 Таблица chat_messages: {message_count} записей")
                
                # Проверяем таблицу ботов
                result = await db.execute("SELECT COUNT(*) FROM chat_bots")
                bot_count = result.scalar()
                print(f"🤖 Таблица chat_bots: {bot_count} записей")
                
                # Проверяем таблицу папок
                result = await db.execute("SELECT COUNT(*) FROM chat_folders")
                folder_count = result.scalar()
                print(f"📁 Таблица chat_folders: {folder_count} записей")
                
                # Проверяем таблицу связи чатов с папками
                result = await db.execute("SELECT COUNT(*) FROM chat_room_folders")
                room_folder_count = result.scalar()
                print(f"🔗 Таблица chat_room_folders: {room_folder_count} записей")
                
            except Exception as e:
                print(f"❌ Ошибка при проверке таблиц: {e}")
            finally:
                await db.close()
            break
        
        print("\n🎉 Инициализация базы данных чатов завершена!")
        
    except Exception as e:
        print(f"❌ Ошибка при инициализации: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Инициализация базы данных чатов...")
    success = asyncio.run(init_chat_tables())
    
    if success:
        print("\n✅ База данных готова к использованию!")
    else:
        print("\n❌ Ошибка при инициализации базы данных!")
        sys.exit(1)
