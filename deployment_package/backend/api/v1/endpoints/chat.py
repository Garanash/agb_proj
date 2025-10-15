from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import logging

from database import get_db
from models import User, AIChatSession, AIChatMessage, ChatBot
from ..dependencies import get_current_user
from ..schemas import (
    ChatSessionCreate, 
    ChatSessionResponse, 
    ChatMessageCreate,
    ChatMessageResponse
)
from pydantic import BaseModel

class ChatBotCreate(BaseModel):
    name: str
    description: Optional[str] = None
    model_id: Optional[str] = None

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/sessions/", response_model=List[ChatSessionResponse])
async def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка сессий чата пользователя"""
    try:
        result = db.execute(
            select(AIChatSession)
            .where(AIChatSession.user_id == current_user.id)
            .order_by(desc(AIChatSession.updated_at))
            .options(selectinload(AIChatSession.messages))
        )
        sessions = result.scalars().all()
        # Преобразуем каждую сессию в объект ответа
        return [
            ChatSessionResponse(
                id=session.id,
                title=session.title,
                created_at=session.created_at,
                updated_at=session.updated_at,
                messages=[
                    ChatMessageResponse(
                        id=msg.id,
                        message_type=msg.message_type,
                        content=msg.content,
                        files_data=msg.files_data,
                        matching_results=msg.matching_results,
                        is_processing=msg.is_processing,
                        created_at=msg.created_at
                    ) for msg in session.messages
                ] if session.messages else []
            ) for session in sessions
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения сессий: {str(e)}")

@router.post("/sessions/", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
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
        db.commit()
        db.refresh(new_session)
        
        logger.info(f"✅ Сессия создана с ID: {new_session.id}")
        
        # Создаем объект ответа вручную
        return ChatSessionResponse(
            id=new_session.id,
            title=new_session.title,
            created_at=new_session.created_at,
            updated_at=new_session.updated_at,
            messages=[]  # Новая сессия без сообщений
        )
    except Exception as e:
        logger.error(f"❌ Ошибка создания сессии: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания сессии: {str(e)}")

@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение сессии чата с сообщениями"""
    try:
        result = db.execute(
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
        
        # Преобразуем сессию в объект ответа
        return ChatSessionResponse(
            id=session.id,
            title=session.title,
            created_at=session.created_at,
            updated_at=session.updated_at,
            messages=[
                ChatMessageResponse(
                    id=msg.id,
                    message_type=msg.message_type,
                    content=msg.content,
                    files_data=msg.files_data,
                    matching_results=msg.matching_results,
                    is_processing=msg.is_processing,
                    created_at=msg.created_at
                ) for msg in session.messages
            ] if session.messages else []
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения сессии: {str(e)}")

@router.post("/sessions/{session_id}/messages/", response_model=ChatMessageResponse)
async def create_chat_message(
    session_id: int,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание сообщения в сессии чата"""
    try:
        # Проверяем, что сессия принадлежит пользователю
        result = db.execute(
            select(AIChatSession).where(
                AIChatSession.id == session_id,
                AIChatSession.user_id == current_user.id
            )
        )
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(status_code=404, detail="Сессия не найдена")
        
        # Создаем сообщение пользователя
        user_message = AIChatMessage(
            session_id=session_id,
            message_type="user",
            content=message_data.content,
            files_data=message_data.files_data,
            matching_results=message_data.matching_results,
            is_processing=False
        )
        
        db.add(user_message)
        db.commit()
        db.refresh(user_message)
        
        # Создаем сообщение ИИ
        ai_message = AIChatMessage(
            session_id=session_id,
            message_type="ai",
            content="",
            is_processing=True
        )
        
        db.add(ai_message)
        db.commit()
        db.refresh(ai_message)
        
        # Асинхронно обрабатываем запрос к ИИ
        try:
            from .article_matching import process_natural_language_query
            
            # Получаем ответ от ИИ
            ai_response = await process_natural_language_query(message_data.content, db)
            
            # Обновляем сообщение ИИ
            ai_message.content = ai_response.get("message", "")
            ai_message.matching_results = {
                "search_results": ai_response.get("search_results", []),
                "success": ai_response.get("success", False)
            }
            ai_message.is_processing = False
            
            db.commit()
            db.refresh(ai_message)
            
        except Exception as e:
            print(f"Ошибка при обработке ИИ: {e}")
            ai_message.content = "Извините, произошла ошибка при обработке запроса. Попробуйте переформулировать."
            ai_message.is_processing = False
            db.commit()
        
        # Возвращаем сообщение пользователя
        return ChatMessageResponse(
            id=user_message.id,
            message_type=user_message.message_type,
            content=user_message.content,
            files_data=user_message.files_data,
            matching_results=user_message.matching_results,
            is_processing=user_message.is_processing,
            created_at=user_message.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания сообщения: {str(e)}")

@router.put("/messages/{message_id}/", response_model=ChatMessageResponse)
async def update_chat_message(
    message_id: int,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление сообщения в чате"""
    try:
        # Получаем сообщение с проверкой прав доступа
        result = db.execute(
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
        
        db.commit()
        db.refresh(message)
        
        # Преобразуем сообщение в объект ответа
        return ChatMessageResponse(
            id=message.id,
            message_type=message.message_type,
            content=message.content,
            files_data=message.files_data,
            matching_results=message.matching_results,
            is_processing=message.is_processing,
            created_at=message.created_at
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка обновления сообщения: {str(e)}")

@router.delete("/sessions/{session_id}/")
async def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление сессии чата"""
    try:
        result = db.execute(
            select(AIChatSession).where(
                AIChatSession.id == session_id,
                AIChatSession.user_id == current_user.id
            )
        )
        session = result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(status_code=404, detail="Сессия не найдена")
        
        db.delete(session)
        db.commit()
        
        return {"message": "Сессия удалена"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка удаления сессии: {str(e)}")


# Дополнительные endpoints для совместимости с фронтендом
@router.get("/folders/", response_model=List[dict])
def get_folders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка папок пользователя (заглушка)"""
    try:
        # Возвращаем пустой список, так как папки чата пока не реализованы
        return []
    except Exception as e:
        logger.error(f"Ошибка при получении папок: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.get("/unread-summary", response_model=dict)
def get_unread_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение сводки о непрочитанных сообщениях (заглушка)"""
    try:
        # Возвращаем пустую сводку, так как система непрочитанных сообщений пока не реализована
        return {
            "unread_counts": {},
            "total_unread": 0
        }
    except Exception as e:
        logger.error(f"Ошибка при получении сводки непрочитанных сообщений: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

# Endpoints для управления ботами
@router.get("/bots/", response_model=List[dict])
def get_chat_bots(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка чат-ботов"""
    try:
        result = db.execute(
            select(ChatBot)
            .where(ChatBot.is_active == True)
            .order_by(ChatBot.created_at.desc())
        )
        bots = result.scalars().all()
        
        return [
            {
                "id": bot.id,
                "name": bot.name,
                "description": bot.description,
                "model_id": bot.model_id,
                "is_active": bot.is_active,
                "created_at": bot.created_at.isoformat() if bot.created_at else None
            } for bot in bots
        ]
    except Exception as e:
        logger.error(f"Ошибка при получении ботов: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@router.post("/bots/", response_model=dict)
def create_chat_bot(
    bot_data: ChatBotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового чат-бота"""
    try:
        # Проверяем права доступа (только админы могут создавать ботов)
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Доступ запрещен")
        
        new_bot = ChatBot(
            name=bot_data.name,
            description=bot_data.description,
            model_id=bot_data.model_id,
            is_active=True,
            created_by=current_user.id
        )
        
        db.add(new_bot)
        db.commit()
        db.refresh(new_bot)
        
        return {
            "id": new_bot.id,
            "name": new_bot.name,
            "description": new_bot.description,
            "model_id": new_bot.model_id,
            "is_active": new_bot.is_active,
            "created_at": new_bot.created_at.isoformat() if new_bot.created_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка при создании бота: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@router.put("/bots/{bot_id}/", response_model=dict)
def update_chat_bot(
    bot_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None,
    model_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление чат-бота"""
    try:
        # Проверяем права доступа
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Доступ запрещен")
        
        result = db.execute(
            select(ChatBot).where(ChatBot.id == bot_id)
        )
        bot = result.scalar_one_or_none()
        
        if not bot:
            raise HTTPException(status_code=404, detail="Бот не найден")
        
        # Обновляем поля
        if name is not None:
            bot.name = name
        if description is not None:
            bot.description = description
        if model_id is not None:
            bot.model_id = model_id
        if is_active is not None:
            bot.is_active = is_active
        
        db.commit()
        db.refresh(bot)
        
        return {
            "id": bot.id,
            "name": bot.name,
            "description": bot.description,
            "model_id": bot.model_id,
            "is_active": bot.is_active,
            "created_at": bot.created_at.isoformat() if bot.created_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка при обновлении бота: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@router.delete("/bots/{bot_id}/")
def delete_chat_bot(
    bot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление чат-бота"""
    try:
        # Проверяем права доступа
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Доступ запрещен")
        
        result = db.execute(
            select(ChatBot).where(ChatBot.id == bot_id)
        )
        bot = result.scalar_one_or_none()
        
        if not bot:
            raise HTTPException(status_code=404, detail="Бот не найден")
        
        # Мягкое удаление - деактивируем бота
        bot.is_active = False
        db.commit()
        
        return {"message": "Бот успешно деактивирован"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Ошибка при удалении бота: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")