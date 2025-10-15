from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime

from database import get_db
from models import ChatRoom, ChatMessage, ChatParticipant, User, ChatBot
from ..dependencies import get_current_user
from ..schemas import (
    ChatRoom as ChatRoomSchema,
    ChatRoomCreate,
    ChatRoomUpdate,
    ChatMessage as ChatMessageSchema,
    ChatMessageCreate,
    ChatParticipant as ChatParticipantSchema,
    ChatParticipantCreate,
    ChatBot as ChatBotSchema
)

router = APIRouter()

@router.get("/rooms/", response_model=List[ChatRoomSchema])
def get_chat_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка чат-комнат пользователя"""
    try:
        result = db.execute(
            select(ChatRoom)
            .join(ChatParticipant)
            .where(ChatParticipant.user_id == current_user.id)
            .options(selectinload(ChatRoom.participants))
        )
        rooms = result.scalars().all()
        return rooms
    except Exception as e:
        print(f"Ошибка при получении чатов: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@router.post("/rooms/", response_model=ChatRoomSchema)
def create_chat_room(
    room_data: ChatRoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание новой чат-комнаты"""
    try:
        new_room = ChatRoom(
            name=room_data.name,
            description=room_data.description,
            created_by=current_user.id
        )
        db.add(new_room)
        db.commit()
        db.refresh(new_room)
        
        # Добавляем создателя как участника и администратора
        participant = ChatParticipant(
            room_id=new_room.id,
            user_id=current_user.id,
            is_admin=True
        )
        db.add(participant)
        db.commit()
        
        return new_room
    except Exception as e:
        print(f"Ошибка при создании чата: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@router.get("/rooms/{room_id}", response_model=ChatRoomSchema)
def get_chat_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение информации о чат-комнате"""
    try:
        result = db.execute(
            select(ChatRoom)
            .join(ChatParticipant)
            .where(
                and_(
                    ChatRoom.id == room_id,
                    ChatParticipant.user_id == current_user.id
                )
            )
            .options(
                selectinload(ChatRoom.participants),
                selectinload(ChatRoom.messages)
            )
        )
        room = result.scalar_one_or_none()
        
        if not room:
            raise HTTPException(status_code=404, detail="Чат-комната не найдена")
        
        return room
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при получении чата: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@router.get("/rooms/{room_id}/messages/", response_model=List[ChatMessageSchema])
def get_chat_messages(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение сообщений чат-комнаты"""
    try:
        # Проверяем, что пользователь является участником чата
        result = db.execute(
            select(ChatParticipant).where(
                and_(
                    ChatParticipant.room_id == room_id,
                    ChatParticipant.user_id == current_user.id
                )
            )
        )
        participant = result.scalar_one_or_none()
        
        if not participant:
            raise HTTPException(status_code=403, detail="Доступ к чату запрещен")
        
        # Получаем сообщения
        result = db.execute(
            select(ChatMessage)
            .where(ChatMessage.room_id == room_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(50)
        )
        messages = result.scalars().all()
        
        return messages
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при получении сообщений: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@router.post("/rooms/{room_id}/messages/", response_model=ChatMessageSchema)
def create_chat_message(
    room_id: int,
    message_data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание сообщения в чат-комнате"""
    try:
        # Проверяем, что пользователь является участником чата
        result = db.execute(
            select(ChatParticipant).where(
                and_(
                    ChatParticipant.room_id == room_id,
                    ChatParticipant.user_id == current_user.id
                )
            )
        )
        participant = result.scalar_one_or_none()
        
        if not participant:
            raise HTTPException(status_code=403, detail="Доступ к чату запрещен")
        
        # Создаем сообщение
        new_message = ChatMessage(
            room_id=room_id,
            sender_id=current_user.id,
            content=message_data.content,
            is_edited=False
        )
        
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        return new_message
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при создании сообщения: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@router.put("/rooms/{room_id}", response_model=ChatRoomSchema)
def update_chat_room(
    room_id: int,
    room_data: ChatRoomUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление чат-комнаты"""
    try:
        # Проверяем, что пользователь является администратором чата
        result = db.execute(
            select(ChatParticipant).where(
                and_(
                    ChatParticipant.room_id == room_id,
                    ChatParticipant.user_id == current_user.id,
                    ChatParticipant.is_admin == True
                )
            )
        )
        participant = result.scalar_one_or_none()
        
        if not participant:
            raise HTTPException(status_code=403, detail="Недостаточно прав для изменения чата")
        
        # Получаем чат
        result = db.execute(
            select(ChatRoom).where(ChatRoom.id == room_id)
        )
        room = result.scalar_one_or_none()
        
        if not room:
            raise HTTPException(status_code=404, detail="Чат-комната не найдена")
        
        # Обновляем поля
        if room_data.name is not None:
            room.name = room_data.name
        if room_data.description is not None:
            room.description = room_data.description
        
        db.commit()
        db.refresh(room)
        
        return room
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при обновлении чата: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@router.delete("/rooms/{room_id}")
def delete_chat_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление чат-комнаты"""
    try:
        # Проверяем, что пользователь является администратором чата
        result = db.execute(
            select(ChatParticipant).where(
                and_(
                    ChatParticipant.room_id == room_id,
                    ChatParticipant.user_id == current_user.id,
                    ChatParticipant.is_admin == True
                )
            )
        )
        participant = result.scalar_one_or_none()
        
        if not participant:
            raise HTTPException(status_code=403, detail="Недостаточно прав для удаления чата")
        
        # Получаем чат
        result = db.execute(
            select(ChatRoom).where(ChatRoom.id == room_id)
        )
        room = result.scalar_one_or_none()
        
        if not room:
            raise HTTPException(status_code=404, detail="Чат-комната не найдена")
        
        # Мягкое удаление - деактивируем чат
        room.is_active = False
        db.commit()
        
        return {"message": "Чат-комната успешно удалена"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при удалении чата: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@router.post("/rooms/{room_id}/participants/", response_model=ChatParticipantSchema)
def add_participant(
    room_id: int,
    participant_data: ChatParticipantCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавление участника в чат-комнату"""
    try:
        # Проверяем, что пользователь является администратором чата
        result = db.execute(
            select(ChatParticipant).where(
                and_(
                    ChatParticipant.room_id == room_id,
                    ChatParticipant.user_id == current_user.id,
                    ChatParticipant.is_admin == True
                )
            )
        )
        admin_participant = result.scalar_one_or_none()
        
        if not admin_participant:
            raise HTTPException(status_code=403, detail="Недостаточно прав для добавления участников")
        
        # Проверяем, что пользователь не является уже участником
        result = db.execute(
            select(ChatParticipant).where(
                and_(
                    ChatParticipant.room_id == room_id,
                    ChatParticipant.user_id == participant_data.user_id
                )
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            raise HTTPException(status_code=400, detail="Пользователь уже является участником чата")
        
        # Добавляем участника
        new_participant = ChatParticipant(
            room_id=room_id,
            user_id=participant_data.user_id,
            is_admin=participant_data.is_admin or False
        )
        
        db.add(new_participant)
        db.commit()
        db.refresh(new_participant)
        
        return new_participant
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при добавлении участника: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")

@router.delete("/rooms/{room_id}/participants/{user_id}")
def remove_participant(
    room_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление участника из чат-комнаты"""
    try:
        # Проверяем, что пользователь является администратором чата или удаляет себя
        result = db.execute(
            select(ChatParticipant).where(
                and_(
                    ChatParticipant.room_id == room_id,
                    ChatParticipant.user_id == current_user.id,
                    or_(
                        ChatParticipant.is_admin == True,
                        ChatParticipant.user_id == user_id
                    )
                )
            )
        )
        participant = result.scalar_one_or_none()
        
        if not participant:
            raise HTTPException(status_code=403, detail="Недостаточно прав для удаления участника")
        
        # Удаляем участника
        result = db.execute(
            select(ChatParticipant).where(
                and_(
                    ChatParticipant.room_id == room_id,
                    ChatParticipant.user_id == user_id
                )
            )
        )
        participant_to_remove = result.scalar_one_or_none()
        
        if not participant_to_remove:
            raise HTTPException(status_code=404, detail="Участник не найден")
        
        db.delete(participant_to_remove)
        db.commit()
        
        return {"message": "Участник успешно удален из чата"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при удалении участника: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")
