#!/usr/bin/env python3
"""
Скрипт для создания тестового ИИ бота в базе данных
"""

import asyncio
import sys
import os

# Добавляем путь к backend в sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from database import get_db
from models import ChatBot
from sqlalchemy.ext.asyncio import AsyncSession

async def create_test_bot():
    """Создает тестового бота в базе данных"""
    async for db in get_db():
        try:
            # Проверяем, существует ли уже тестовый бот
            existing_bot = await db.execute(
                "SELECT id FROM chat_bots WHERE name = 'Тестовый помощник'"
            )
            if existing_bot.fetchone():
                print("Тестовый бот уже существует!")
                return
            
            # Создаем тестового бота
            test_bot = ChatBot(
                name="Тестовый помощник",
                description="Тестовый ИИ бот для демонстрации функциональности чата",
                api_key="test_api_key_123",  # Замените на реальный API ключ
                bot_model_id="gpt-3.5-turbo",  # Замените на реальную модель
                system_prompt="Вы - полезный ассистент. Отвечайте кратко и по делу на русском языке.",
                is_active=True
            )
            
            db.add(test_bot)
            await db.commit()
            
            print("✅ Тестовый бот успешно создан!")
            print(f"ID: {test_bot.id}")
            print(f"Имя: {test_bot.name}")
            print(f"Описание: {test_bot.description}")
            print(f"Модель: {test_bot.bot_model_id}")
            print(f"Активен: {'Да' if test_bot.is_active else 'Нет'}")
            
        except Exception as e:
            print(f"❌ Ошибка при создании бота: {e}")
            await db.rollback()
        finally:
            await db.close()
        break

if __name__ == "__main__":
    print("🤖 Создание тестового ИИ бота...")
    asyncio.run(create_test_bot())
