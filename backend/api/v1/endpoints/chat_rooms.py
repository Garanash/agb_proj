from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
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
async def get_chat_rooms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка чат-комнат пользователя"""
    result = await db.execute(
        select(ChatRoom)
        .join(ChatParticipant)
        .where(ChatParticipant.user_id == current_user.id)
        .options(selectinload(ChatRoom.participants))
    )
    rooms = result.scalars().all()
    return rooms

@router.post("/rooms/", response_model=ChatRoomSchema)
async def create_chat_room(
    room_data: ChatRoomCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание новой чат-комнаты"""
    new_room = ChatRoom(
        name=room_data.name,
        description=room_data.description,
        created_by=current_user.id
    )
    db.add(new_room)
    await db.commit()
    await db.refresh(new_room)
    
    # Добавляем создателя как участника и администратора
    participant = ChatParticipant(
        room_id=new_room.id,
        user_id=current_user.id,
        is_admin=True
    )
    db.add(participant)
    await db.commit()
    
    return new_room

@router.get("/rooms/{room_id}", response_model=ChatRoomSchema)
async def get_chat_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение информации о чат-комнате"""
    result = await db.execute(
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

@router.put("/rooms/{room_id}", response_model=ChatRoomSchema)
async def update_chat_room(
    room_id: int,
    room_data: ChatRoomUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление чат-комнаты"""
    # Проверяем права доступа
    result = await db.execute(
        select(ChatParticipant)
        .where(
            and_(
                ChatParticipant.room_id == room_id,
                ChatParticipant.user_id == current_user.id,
                ChatParticipant.is_admin == True
            )
        )
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    # Обновляем комнату
    result = await db.execute(
        select(ChatRoom).where(ChatRoom.id == room_id)
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Чат-комната не найдена")
    
    if room_data.name is not None:
        room.name = room_data.name
    if room_data.description is not None:
        room.description = room_data.description
    
    await db.commit()
    await db.refresh(room)
    return room

@router.delete("/rooms/{room_id}")
async def delete_chat_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление чат-комнаты"""
    # Проверяем права доступа
    result = await db.execute(
        select(ChatParticipant)
        .where(
            and_(
                ChatParticipant.room_id == room_id,
                ChatParticipant.user_id == current_user.id,
                ChatParticipant.is_admin == True
            )
        )
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    # Удаляем комнату
    result = await db.execute(
        select(ChatRoom).where(ChatRoom.id == room_id)
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Чат-комната не найдена")
    
    await db.delete(room)
    await db.commit()
    return {"message": "Чат-комната удалена"}

@router.post("/rooms/{room_id}/participants", response_model=ChatParticipantSchema)
async def add_participant(
    room_id: int,
    participant_data: ChatParticipantCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Добавление участника в чат-комнату"""
    # Проверяем права доступа
    result = await db.execute(
        select(ChatParticipant)
        .where(
            and_(
                ChatParticipant.room_id == room_id,
                ChatParticipant.user_id == current_user.id,
                ChatParticipant.is_admin == True
            )
        )
    )
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    # Проверяем, не добавлен ли уже участник
    result = await db.execute(
        select(ChatParticipant)
        .where(
            and_(
                ChatParticipant.room_id == room_id,
                or_(
                    ChatParticipant.user_id == participant_data.user_id,
                    ChatParticipant.bot_id == participant_data.bot_id
                )
            )
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Участник уже добавлен")
    
    # Добавляем участника
    new_participant = ChatParticipant(
        room_id=room_id,
        user_id=participant_data.user_id,
        bot_id=participant_data.bot_id,
        is_admin=participant_data.is_admin
    )
    db.add(new_participant)
    await db.commit()
    await db.refresh(new_participant)
    return new_participant

@router.delete("/rooms/{room_id}/participants/{participant_id}")
async def remove_participant(
    room_id: int,
    participant_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление участника из чат-комнаты"""
    # Проверяем права доступа
    result = await db.execute(
        select(ChatParticipant)
        .where(
            and_(
                ChatParticipant.room_id == room_id,
                ChatParticipant.user_id == current_user.id,
                ChatParticipant.is_admin == True
            )
        )
    )
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    # Удаляем участника
    result = await db.execute(
        select(ChatParticipant)
        .where(
            and_(
                ChatParticipant.room_id == room_id,
                ChatParticipant.id == participant_id
            )
        )
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Участник не найден")
    
    await db.delete(participant)
    await db.commit()
    return {"message": "Участник удален"}

@router.post("/rooms/{room_id}/mark-read")
async def mark_messages_as_read(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Отметить все сообщения в чате как прочитанные"""
    # Проверяем, что пользователь является участником чата
    result = await db.execute(
        select(ChatParticipant)
        .where(
            and_(
                ChatParticipant.room_id == room_id,
                ChatParticipant.user_id == current_user.id
            )
        )
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Чат не найден")
    
    # Обновляем время последнего прочтения
    participant.last_read_at = datetime.utcnow()
    await db.commit()
    
    return {"message": "Сообщения отмечены как прочитанные"}

@router.get("/bots/", response_model=List[ChatBotSchema])
async def get_chat_bots(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка доступных чат-ботов"""
    result = await db.execute(
        select(ChatBot)
        .where(ChatBot.is_active == True)
    )
    bots = result.scalars().all()
    return bots