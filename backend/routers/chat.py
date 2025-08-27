from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload
from typing import List
import aiohttp
from database import get_db
from models import ChatRoom, ChatRoomParticipant, ChatMessage, User, ChatBot
from schemas import (
    ChatRoom as ChatRoomSchema,
    ChatRoomCreate,
    ChatRoomUpdate,
    ChatRoomCreateResponse,
    ChatRoomDetailResponse,
    ChatMessage as ChatMessageSchema,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatRoomParticipant as ChatRoomParticipantSchema,
    ChatRoomParticipantCreate,
    ChatRoomParticipantResponse,
    ChatBot as ChatBotSchema,
    ChatBotCreate,
    ChatBotUpdate
)
from routers.auth import get_current_user

router = APIRouter(
    tags=["chat"]
)

# Подключенные WebSocket клиенты
connected_clients = {}


@router.post("/rooms/", response_model=ChatRoomCreateResponse)
async def create_chat_room(
    room: ChatRoomCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание новой беседы"""
    db_room = ChatRoom(
        name=room.name,
        creator_id=current_user.id
    )
    db.add(db_room)
    await db.flush()

    # Добавляем создателя как участника и администратора
    participant = ChatRoomParticipant(
        chat_room_id=db_room.id,
        user_id=current_user.id,
        bot_id=None,
        is_admin=True
    )
    db.add(participant)
    await db.commit()
    await db.refresh(db_room)
    
    # Возвращаем объект для корректной сериализации
    return ChatRoomCreateResponse(
        id=db_room.id,
        name=db_room.name,
        description=db_room.description,
        creator_id=db_room.creator_id,
        is_private=db_room.is_private,
        is_active=db_room.is_active,
        created_at=db_room.created_at,
        updated_at=db_room.updated_at,
        folders=[]
    )


@router.get("/rooms/", response_model=List[ChatRoomCreateResponse])
async def get_user_chat_rooms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка бесед пользователя"""
    result = await db.execute(
        select(ChatRoom)
        .join(ChatRoomParticipant, ChatRoom.id == ChatRoomParticipant.chat_room_id)
        .options(selectinload(ChatRoom.folders))
        .where(and_(
            ChatRoomParticipant.user_id == current_user.id,
            ChatRoom.is_active == True
        ))
    )
    rooms = result.scalars().all()
    
    # Преобразуем в простую схему без связанных данных
    return [
        ChatRoomCreateResponse(
            id=room.id,
            name=room.name,
            description=room.description,
            creator_id=room.creator_id,
            is_private=room.is_private,
            created_at=room.created_at,
            updated_at=room.updated_at,
            folders=room.folders
        )
        for room in rooms
    ]


@router.get("/rooms/{room_id}", response_model=ChatRoomDetailResponse)
async def get_chat_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение информации о беседе"""
    result = await db.execute(select(ChatRoom).where(ChatRoom.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Беседа не найдена")
    
    # Проверяем, является ли пользователь участником беседы
    result = await db.execute(
        select(ChatRoomParticipant).where(and_(
            ChatRoomParticipant.chat_room_id == room_id,
            ChatRoomParticipant.user_id == current_user.id
        ))
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="У вас нет доступа к этой беседе")
    
    # Загружаем участников и сообщения
    result = await db.execute(
        select(ChatRoomParticipant)
        .where(ChatRoomParticipant.chat_room_id == room_id)
    )
    participants = result.scalars().all()
    
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.chat_room_id == room_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    
    # Создаем ответ с участниками и сообщениями
    return ChatRoomDetailResponse(
        id=room.id,
        name=room.name,
        description=room.description,
        creator_id=room.creator_id,
        is_private=room.is_private,
        is_active=room.is_active,
        created_at=room.created_at,
        updated_at=room.updated_at,
        participants=participants,
        messages=messages
    )


@router.put("/rooms/{room_id}", response_model=ChatRoomSchema)
async def update_chat_room(
    room_id: int,
    room_update: ChatRoomUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление информации о беседе"""
    result = await db.execute(select(ChatRoom).where(ChatRoom.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Беседа не найдена")
    
    # Проверяем, является ли пользователь администратором беседы
    result = await db.execute(
        select(ChatRoomParticipant).where(and_(
            ChatRoomParticipant.chat_room_id == room_id,
            ChatRoomParticipant.user_id == current_user.id,
            ChatRoomParticipant.is_admin == True
        ))
    )
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=403, detail="У вас нет прав для редактирования этой беседы")
    
    for field, value in room_update.dict(exclude_unset=True).items():
        setattr(room, field, value)
    
    await db.commit()
    await db.refresh(room)
    return room


@router.post("/rooms/{room_id}/participants/", response_model=ChatRoomParticipantResponse)
async def add_chat_participant(
    room_id: int,
    participant: ChatRoomParticipantCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Добавление участника в беседу"""
    result = await db.execute(select(ChatRoom).where(ChatRoom.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Беседа не найдена")
    
    # Проверяем, является ли текущий пользователь администратором беседы
    result = await db.execute(
        select(ChatRoomParticipant).where(and_(
            ChatRoomParticipant.chat_room_id == room_id,
            ChatRoomParticipant.user_id == current_user.id,
            ChatRoomParticipant.is_admin == True
        ))
    )
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=403, detail="У вас нет прав для добавления участников")
    
    # Проверяем, добавляется ли пользователь или бот
    if participant.user_id:
        # Проверяем, существует ли пользователь
        result = await db.execute(select(User).where(User.id == participant.user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        # Проверяем, не является ли пользователь уже участником
        result = await db.execute(
            select(ChatRoomParticipant).where(and_(
                ChatRoomParticipant.chat_room_id == room_id,
                ChatRoomParticipant.user_id == participant.user_id
            ))
        )
        existing_participant = result.scalar_one_or_none()
        if existing_participant:
            raise HTTPException(status_code=400, detail="Пользователь уже является участником беседы")
    elif participant.bot_id:
        # Проверяем, существует ли бот
        result = await db.execute(select(ChatBot).where(ChatBot.id == participant.bot_id))
        bot = result.scalar_one_or_none()
        if not bot:
            raise HTTPException(status_code=404, detail="Бот не найден")
        
        # Проверяем, не является ли бот уже участником
        result = await db.execute(
            select(ChatRoomParticipant).where(and_(
                ChatRoomParticipant.chat_room_id == room_id,
                ChatRoomParticipant.bot_id == participant.bot_id
            ))
        )
        existing_participant = result.scalar_one_or_none()
        if existing_participant:
            raise HTTPException(status_code=400, detail="Бот уже является участником беседы")
    else:
        raise HTTPException(status_code=400, detail="Необходимо указать либо user_id, либо bot_id")
    
    new_participant = ChatRoomParticipant(
        chat_room_id=room_id,
        user_id=participant.user_id,
        bot_id=participant.bot_id,
        is_admin=participant.is_admin
    )
    db.add(new_participant)
    await db.commit()
    await db.refresh(new_participant)
    return new_participant


@router.delete("/rooms/{room_id}/participants/{participant_id}")
async def remove_chat_participant(
    room_id: int,
    participant_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление участника из беседы"""
    result = await db.execute(select(ChatRoom).where(ChatRoom.id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Беседа не найдена")
    
    # Проверяем, является ли текущий пользователь администратором беседы
    result = await db.execute(
        select(ChatRoomParticipant).where(and_(
            ChatRoomParticipant.chat_room_id == room_id,
            ChatRoomParticipant.user_id == current_user.id,
            ChatRoomParticipant.is_admin == True
        ))
    )
    admin = result.scalar_one_or_none()
    
    # Получаем участника
    result = await db.execute(
        select(ChatRoomParticipant).where(ChatRoomParticipant.id == participant_id)
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Участник не найден")
    
    # Разрешаем пользователю удалить самого себя из беседы
    if not admin and (participant.user_id != current_user.id):
        raise HTTPException(status_code=403, detail="У вас нет прав для удаления участников")
    
    await db.delete(participant)
    await db.commit()
    return {"message": "Участник успешно удален"}


@router.get("/rooms/{room_id}/messages/", response_model=List[ChatMessageSchema])
async def get_chat_messages(
    room_id: int,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение сообщений беседы"""
    # Проверяем, является ли пользователь участником беседы
    result = await db.execute(
        select(ChatRoomParticipant).where(and_(
            ChatRoomParticipant.chat_room_id == room_id,
            ChatRoomParticipant.user_id == current_user.id
        ))
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="У вас нет доступа к этой беседе")
    
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.chat_room_id == room_id)
        .order_by(ChatMessage.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    messages = result.scalars().all()
    
    return messages


@router.post("/rooms/{room_id}/messages/", response_model=ChatMessageResponse)
async def create_chat_message(
    room_id: int,
    message: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание нового сообщения"""
    # Проверяем, является ли пользователь участником беседы
    result = await db.execute(
        select(ChatRoomParticipant).where(and_(
            ChatRoomParticipant.chat_room_id == room_id,
            ChatRoomParticipant.user_id == current_user.id
        ))
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="У вас нет доступа к этой беседе")
    
    db_message = ChatMessage(
        chat_room_id=room_id,
        sender_id=current_user.id,
        content=message.content
    )
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    
    # Отправляем сообщение всем подключенным клиентам в этой комнате
    if room_id in connected_clients:
        for client in connected_clients[room_id]:
            await client.send_json({
                "type": "message",
                "data": {
                    "id": db_message.id,
                    "content": db_message.content,
                    "sender_id": db_message.sender_id,
                    "created_at": db_message.created_at.isoformat()
                }
            })
    
    # Проверяем, есть ли боты в чате и отправляем им сообщения
    result = await db.execute(
        select(ChatRoomParticipant).where(and_(
            ChatRoomParticipant.chat_room_id == room_id,
            ChatRoomParticipant.bot_id.isnot(None)
        ))
    )
    bots = result.scalars().all()
    
    # Запускаем асинхронную задачу для ботов (они будут отвечать каждую минуту)
    if bots:
        import asyncio
        asyncio.create_task(process_bot_responses(room_id, bots, db))
    
    return db_message


# Роуты для ботов
@router.post("/bots/", response_model=ChatBotSchema)
async def create_chat_bot(
    bot: ChatBotCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание нового бота"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только администраторы могут создавать ботов")
    
    db_bot = ChatBot(**bot.dict())
    db.add(db_bot)
    await db.commit()
    await db.refresh(db_bot)
    return db_bot


@router.get("/bots/", response_model=List[ChatBotSchema])
async def get_chat_bots(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка ботов"""
    result = await db.execute(select(ChatBot).where(ChatBot.is_active == True))
    bots = result.scalars().all()
    return bots


@router.get("/bots/{bot_id}", response_model=ChatBotSchema)
async def get_chat_bot(
    bot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение информации о боте"""
    result = await db.execute(select(ChatBot).where(ChatBot.id == bot_id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Бот не найден")
    return bot


@router.put("/bots/{bot_id}", response_model=ChatBotSchema)
async def update_chat_bot(
    bot_id: int,
    bot_update: ChatBotUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление информации о боте"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только администраторы могут обновлять ботов")
    
    result = await db.execute(select(ChatBot).where(ChatBot.id == bot_id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Бот не найден")
    
    for field, value in bot_update.dict(exclude_unset=True).items():
        setattr(bot, field, value)
    
    await db.commit()
    await db.refresh(bot)
    return bot


@router.delete("/bots/{bot_id}")
async def delete_chat_bot(
    bot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление бота"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только администраторы могут удалять ботов")
    
    result = await db.execute(select(ChatBot).where(ChatBot.id == bot_id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(status_code=404, detail="Бот не найден")
    
    bot.is_active = False
    await db.commit()
    return {"message": "Бот успешно удален"}


@router.delete("/rooms/{room_id}/participants/me")
async def leave_chat_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Выход пользователя из беседы"""
    # Проверяем, является ли пользователь участником беседы
    result = await db.execute(
        select(ChatRoomParticipant).where(and_(
            ChatRoomParticipant.chat_room_id == room_id,
            ChatRoomParticipant.user_id == current_user.id
        ))
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Вы не являетесь участником этой беседы")
    
    # Удаляем участника
    await db.delete(participant)
    
    # Создаем системное сообщение о выходе
    system_message = ChatMessage(
        chat_room_id=room_id,
        content=f"{current_user.first_name} {current_user.last_name} покинул беседу",
        sender_id=None,
        bot_id=None
    )
    db.add(system_message)
    
    await db.commit()
    
    # Отправляем уведомление через WebSocket
    if room_id in connected_clients:
        for client in connected_clients[room_id]:
            try:
                await client.send_json({
                    "type": "system_message",
                    "data": {
                        "id": system_message.id,
                        "content": system_message.content,
                        "created_at": system_message.created_at.isoformat()
                    }
                })
            except:
                pass
    
    return {"message": "Вы успешно покинули беседу"}


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: int,
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """WebSocket endpoint для real-time сообщений"""
    try:
        # Проверяем токен и получаем пользователя
        current_user = await get_current_user(token, db)
        
        # Проверяем, является ли пользователь участником беседы
        result = await db.execute(
            select(ChatRoomParticipant).where(and_(
                ChatRoomParticipant.chat_room_id == room_id,
                ChatRoomParticipant.user_id == current_user.id
            ))
        )
        participant = result.scalar_one_or_none()
        if not participant:
            await websocket.close(code=4003)
            return
        
        await websocket.accept()
        
        # Добавляем клиента в список подключенных
        if room_id not in connected_clients:
            connected_clients[room_id] = set()
        connected_clients[room_id].add(websocket)
        
        try:
            while True:
                # Ожидаем сообщения от клиента
                data = await websocket.receive_json()
                
                if data["type"] == "message":
                    # Создаем новое сообщение в базе данных
                    db_message = ChatMessage(
                        chat_room_id=room_id,
                        sender_id=current_user.id,
                        content=data["content"]
                    )
                    db.add(db_message)
                    await db.commit()
                    await db.refresh(db_message)
                    
                    # Отправляем сообщение всем подключенным клиентам в этой комнате
                    message_data = {
                        "type": "message",
                        "data": {
                            "id": db_message.id,
                            "content": db_message.content,
                            "sender_id": db_message.sender_id,
                            "sender_name": f"{current_user.first_name} {current_user.last_name}",
                            "created_at": db_message.created_at.isoformat()
                        }
                    }
                    for client in connected_clients[room_id]:
                        try:
                            await client.send_json(message_data)
                        except:
                            pass
        
        except WebSocketDisconnect:
            # Удаляем клиента из списка подключенных
            connected_clients[room_id].remove(websocket)
            if not connected_clients[room_id]:
                del connected_clients[room_id]
    
    except Exception as e:
        await websocket.close(code=4000)


async def process_bot_responses(room_id: int, bots: list, db: AsyncSession):
    """Обработка ответов ботов каждую минуту"""
    import asyncio
    
    while True:
        try:
            # Ждем минуту
            await asyncio.sleep(60)
            
            # Получаем неотвеченные сообщения за последние 5 минут
            from datetime import datetime, timedelta
            five_minutes_ago = datetime.now() - timedelta(minutes=5)
            
            result = await db.execute(
                select(ChatMessage).where(and_(
                    ChatMessage.chat_room_id == room_id,
                    ChatMessage.created_at >= five_minutes_ago,
                    ChatMessage.bot_id.is_(None),  # Только сообщения от пользователей
                    ChatMessage.sender_id.isnot(None)  # Не системные сообщения
                ))
            )
            unresponded_messages = result.scalars().all()
            
            if not unresponded_messages:
                continue
            
            # Создаем саммари неотвеченных сообщений
            message_summary = "\n".join([f"- {msg.content}" for msg in unresponded_messages])
            
            for bot_participant in bots:
                result = await db.execute(select(ChatBot).where(ChatBot.id == bot_participant.bot_id))
                bot = result.scalar_one_or_none()
                if not bot or not bot.is_active:
                    continue
                
                try:
                    # Отправляем запрос к VseGPT API
                    async with aiohttp.ClientSession() as session:
                        async with session.post(
                            "https://api.vsegpt.ru/v1/chat/completions",
                            headers={
                                "Authorization": f"Bearer {bot.api_key}",
                                "Content-Type": "application/json"
                            },
                            json={
                                "model": bot.bot_model_id,
                                "messages": [
                                    {"role": "system", "content": bot.system_prompt or "Вы - полезный ассистент. Отвечайте кратко и по делу."},
                                    {"role": "user", "content": f"Вот неотвеченные сообщения в чате:\n{message_summary}\n\nПожалуйста, дайте краткий ответ или комментарий к этим сообщениям."}
                                ],
                                "max_tokens": 200,
                                "temperature": 0.7
                            }
                        ) as response:
                            if response.status == 200:
                                bot_response = await response.json()
                                bot_message = bot_response["choices"][0]["message"]["content"]
                                
                                # Сохраняем ответ бота
                                db_bot_message = ChatMessage(
                                    chat_room_id=room_id,
                                    bot_id=bot.id,
                                    content=bot_message
                                )
                                db.add(db_bot_message)
                                await db.commit()
                                await db.refresh(db_bot_message)
                                
                                # Отправляем ответ бота всем подключенным клиентам
                                if room_id in connected_clients:
                                    for client in connected_clients[room_id]:
                                        try:
                                            await client.send_json({
                                                "type": "message",
                                                "data": {
                                                    "id": db_bot_message.id,
                                                    "content": db_bot_message.content,
                                                    "bot_id": bot.id,
                                                    "created_at": db_bot_message.created_at.isoformat()
                                                }
                                            })
                                        except:
                                            pass
                except Exception as e:
                    print(f"Error sending message to bot {bot.id}: {str(e)}")
                    
        except Exception as e:
            print(f"Error in process_bot_responses: {str(e)}")
            break
