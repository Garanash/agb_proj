from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import logging

from database import get_db
from models import User, AIChatSession, AIChatMessage
from ..dependencies import get_current_user
from ..schemas import (
    ChatSessionCreate, 
    ChatSessionResponse, 
    ChatMessageCreate,
    ChatMessageResponse
)

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/sessions/", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка сессий чата пользователя"""
    try:
        result = await db.execute(
            select(AIChatSession)
            .where(AIChatSession.user_id == current_user.id)
            .order_by(desc(AIChatSession.updated_at))
            .options(selectinload(AIChatSession.messages))
        )
        sessions = result.scalars().all()
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения сессий: {str(e)}")

@router.post("/sessions/", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание новой сессии чата"""
    logger.info("🚀 POST /sessions/ вызван")
    try:
        logger.info(f"🔧 Создание сессии для пользователя {current_user.id}")
        
        # Генерируем название сессии, если не указано
        title = session_data.title
        if not title:
            title = f"Чат от {datetime.now().strftime('%d.%m.%Y %H:%M')}"
        
        logger.info(f"📝 Название сессии: {title}")
        
        new_session = AIChatSession(
            user_id=current_user.id,
            title=title
        )
        
        logger.info(f"💾 Добавляем сессию в БД...")
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        
        logger.info(f"✅ Сессия создана с ID: {new_session.id}")
        
        # Возвращаем сессию напрямую
        return new_session
    except Exception as e:
        logger.error(f"❌ Ошибка создания сессии: {e}")
        import traceback
        traceback.print_exc()
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания сессии: {str(e)}")

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение сессии чата с сообщениями"""
    try:
        result = await db.execute(
            select(AIChatSession)
            .where(
                AIChatSession.id == session_id,
                AIChatSession.user_id == current_user.id
            )
            .options(selectinload(AIChatSession.messages))
        )
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(status_code=404, detail="Сессия не найдена")
        
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения сессии: {str(e)}")

@router.post("/sessions/{session_id}/messages/", response_model=ChatMessageResponse)
async def create_chat_message(
    session_id: int,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание сообщения в сессии чата"""
    try:
        # Проверяем, что сессия принадлежит пользователю
        result = await db.execute(
            select(AIChatSession).where(
                AIChatSession.id == session_id,
                AIChatSession.user_id == current_user.id
            )
        )
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(status_code=404, detail="Сессия не найдена")
        
        new_message = AIChatMessage(
            session_id=session_id,
            message_type="user",
            content=message_data.content,
            files_data=message_data.files_data,
            matching_results=message_data.matching_results
        )
        
        db.add(new_message)
        await db.commit()
        await db.refresh(new_message)
        
        return new_message
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания сообщения: {str(e)}")

@router.put("/messages/{message_id}/", response_model=ChatMessageResponse)
async def update_chat_message(
    message_id: int,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление сообщения в чате"""
    try:
        # Получаем сообщение с проверкой прав доступа
        result = await db.execute(
            select(AIChatMessage)
            .join(AIChatSession)
            .where(
                AIChatMessage.id == message_id,
                AIChatSession.user_id == current_user.id
            )
        )
        message = result.scalar_one_or_none()
        
        if not message:
            raise HTTPException(status_code=404, detail="Сообщение не найдено")
        
        # Обновляем поля
        message.content = message_data.content
        message.files_data = message_data.files_data
        message.matching_results = message_data.matching_results
        
        await db.commit()
        await db.refresh(message)
        
        return message
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка обновления сообщения: {str(e)}")

@router.delete("/sessions/{session_id}/")
async def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление сессии чата"""
    try:
        result = await db.execute(
            select(AIChatSession).where(
                AIChatSession.id == session_id,
                AIChatSession.user_id == current_user.id
            )
        )
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(status_code=404, detail="Сессия не найдена")
        
        await db.delete(session)
        await db.commit()
        
        return {"message": "Сессия удалена"}
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка удаления сессии: {str(e)}")