#!/usr/bin/env python3
"""
Тестовый скрипт для проверки API чата
"""

import asyncio
import sys
from pathlib import Path

# Добавляем корневую директорию проекта в путь
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from database import get_db
from models import User, AIChatSession, AIChatMessage
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def test_chat_api():
    """Тестирует API чата"""
    
    print("🧪 Тестирование API чата\n")
    
    async for db in get_db():
        try:
            # Получаем первого пользователя для тестирования
            result = await db.execute(select(User).limit(1))
            user = result.scalar_one_or_none()
            if not user:
                print("❌ Нет пользователей в базе данных")
                return
            
            print(f"👤 Тестируем с пользователем: {user.username}")
            
            # Создаем тестовую сессию
            session = AIChatSession(
                user_id=user.id,
                title="Тестовая сессия"
            )
            
            db.add(session)
            await db.flush()
            
            print(f"✅ Создана сессия: {session.id}")
            
            # Создаем тестовые сообщения
            messages = [
                AIChatMessage(
                    session_id=session.id,
                    message_type="user",
                    content="Привет! Помоги найти смазку для бурового оборудования",
                    files_data=None,
                    matching_results=None
                ),
                AIChatMessage(
                    session_id=session.id,
                    message_type="ai",
                    content="Привет! Я помогу найти подходящую смазку. Какие характеристики вам нужны?",
                    files_data=None,
                    matching_results=None
                ),
                AIChatMessage(
                    session_id=session.id,
                    message_type="user",
                    content="Нужна антивибрационная смазка для керноприемника",
                    files_data=None,
                    matching_results=None
                ),
                AIChatMessage(
                    session_id=session.id,
                    message_type="ai",
                    content="Отлично! Я нашел несколько вариантов антивибрационной смазки для керноприемника:",
                    files_data=None,
                    matching_results='[{"id": "1", "contractor_article": "ОХКУ-000184", "description": "Смазка антивибрационная", "agb_article": "940006/2", "match_confidence": 90}]'
                )
            ]
            
            for message in messages:
                db.add(message)
            
            await db.commit()
            
            print(f"✅ Создано {len(messages)} сообщений")
            
            # Проверяем, что сообщения сохранились
            result = await db.execute(
                select(AIChatMessage)
                .where(AIChatMessage.session_id == session.id)
                .order_by(AIChatMessage.created_at)
            )
            saved_messages = result.scalars().all()
            
            print(f"📋 Сохранено сообщений: {len(saved_messages)}")
            for msg in saved_messages:
                print(f"  • {msg.message_type}: {msg.content[:50]}...")
            
            # Проверяем сессию с сообщениями
            result = await db.execute(
                select(AIChatSession)
                .where(AIChatSession.id == session.id)
                .options(selectinload(AIChatSession.messages))
            )
            session_with_messages = result.scalar_one_or_none()
            
            if session_with_messages:
                print(f"✅ Сессия с сообщениями загружена: {len(session_with_messages.messages)} сообщений")
            
        except Exception as e:
            print(f"❌ Ошибка при тестировании: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await db.close()
        break

if __name__ == "__main__":
    asyncio.run(test_chat_api())
