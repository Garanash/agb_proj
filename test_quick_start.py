#!/usr/bin/env python3
"""
Быстрый тест запуска backend
"""
import asyncio
import sys
import os

# Добавляем путь к backend
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

async def test_imports():
    """Тестируем импорты"""
    try:
        print("🔍 Тестируем импорты...")

        # Тестируем импорт моделей
        from models import ChatRoom, ChatParticipant, ChatMessage, User, ChatBot
        print("✅ Модели импортированы успешно")

        # Тестируем импорт схем
        from schemas import ChatRoomCreate, ChatParticipantCreate
        print("✅ Схемы импортированы успешно")

        # Тестируем импорт роутеров
        from routers.chat import router as chat_router
        print("✅ Chat роутер импортирован успешно")

        return True

    except Exception as e:
        print(f"❌ Ошибка импорта: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_imports())
    if result:
        print("🎉 Все импорты работают!")
        sys.exit(0)
    else:
        print("💥 Есть проблемы с импортами")
        sys.exit(1)
