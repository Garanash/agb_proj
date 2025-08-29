from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import and_, select
from sqlalchemy.orm import selectinload, joinedload
from typing import List
import aiohttp
from database import get_db
from models import ChatRoom, ChatParticipant, ChatMessage, User, ChatBot, ChatFolder, ChatRoomFolder
from schemas import (
    ChatRoom as ChatRoomSchema,
    ChatRoomCreate,
    ChatRoomUpdate,
    ChatRoomCreateResponse,
    ChatRoomDetailResponse,
    ChatMessage as ChatMessageSchema,
    ChatMessageCreate,
    ChatMessageResponse,
    ChatParticipant as ChatParticipantSchema,
    ChatParticipantCreate,
    ChatParticipantResponse as ChatParticipantResponse,
    ChatBot as ChatBotSchema,
    ChatBotCreate,
    ChatBotUpdate,
    ChatFolder as ChatFolderSchema,
    ChatFolderCreate,
    ChatFolderUpdate
)
from routers.auth import get_current_user, get_user_by_username
from datetime import datetime, timedelta
import jwt
from routers.auth import SECRET_KEY, ALGORITHM

router = APIRouter(
    tags=["chat"]
)

async def get_current_user_from_token(token: str, db: AsyncSession) -> User:
    """Получение пользователя из токена для WebSocket"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Неверный токен")
        
        user = await get_user_by_username(db, username)
        if user is None:
            raise HTTPException(status_code=401, detail="Пользователь не найден")
        
        return user
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Неверный токен")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Ошибка аутентификации: {str(e)}")


# Подключенные WebSocket клиенты
connected_clients = {}  # room_id -> set of websockets
user_connections = {}   # user_id -> set of websockets
room_participants = {}  # room_id -> set of user_ids

# ID системного пользователя для системных сообщений
SYSTEM_USER_ID = 8


@router.post("/rooms/", response_model=ChatRoomCreateResponse)
async def create_chat_room(
    room: ChatRoomCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание новой беседы"""
    try:
        # Создаем чат
        db_room = ChatRoom(
            name=room.name,
            description=getattr(room, 'description', None),
            created_by=current_user.id,
            is_private=getattr(room, 'is_private', False)
        )
        db.add(db_room)
        await db.flush()

        # Добавляем создателя как участника и администратора
        creator_participant = ChatParticipant(
            room_id=db_room.id,
            user_id=current_user.id,
            is_admin=True
        )
        db.add(creator_participant)

        # Добавляем выбранных участников
        for user_id in getattr(room, 'participants', []):
            if user_id != current_user.id:  # Пропускаем создателя, если он уже добавлен
                participant = ChatParticipant(
                    room_id=db_room.id,
                    user_id=user_id,
                    is_admin=False
                )
                db.add(participant)

        # Добавляем выбранных ботов
        for bot_id in getattr(room, 'bots', []):
            bot_participant = ChatParticipant(
                room_id=db_room.id,
                user_id=None,
                bot_id=bot_id,
                is_admin=False
            )
            db.add(bot_participant)

        await db.commit()
        await db.refresh(db_room)
        
        # Возвращаем объект для корректной сериализации
        return ChatRoomCreateResponse(
            id=db_room.id,
            name=db_room.name,
            description=db_room.description,
            created_by=db_room.created_by,
            is_private=db_room.is_private,
            is_active=db_room.is_active,
            created_at=db_room.created_at,
            updated_at=db_room.updated_at,
            folders=[]
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при создании чата: {str(e)}")


@router.get("/rooms/", response_model=List[ChatRoomCreateResponse])
async def get_user_chat_rooms(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка бесед пользователя"""
    result = await db.execute(
        select(ChatRoom)
        .join(ChatParticipant, ChatRoom.id == ChatParticipant.room_id)
        .options(selectinload(ChatRoom.folders))
        .where(and_(
            ChatParticipant.user_id == current_user.id,
            ChatRoom.is_active == True
        ))
    )
    rooms = result.scalars().all()
    
    # Для каждого чата загружаем только папки текущего пользователя
    rooms_with_user_folders = []
    for room in rooms:
        # Получаем папки для этого чата (пока что все папки)
        folder_result = await db.execute(
            select(ChatRoomFolder)
            .where(ChatRoomFolder.room_id == room.id)
        )
        user_folders = folder_result.scalars().all()

        # Создаем копию чата с папками только для текущего пользователя
        room_copy = ChatRoomCreateResponse(
            id=room.id,
            name=room.name,
            description=room.description,
            created_by=room.created_by,
            is_private=room.is_private,
            created_at=room.created_at,
            updated_at=room.updated_at,
            folders=user_folders
        )
        rooms_with_user_folders.append(room_copy)
    
    return rooms_with_user_folders


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
        select(ChatParticipant).where(and_(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == current_user.id
        ))
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="У вас нет доступа к этой беседе")
    
    # Загружаем участников с полной информацией о пользователях и ботах
    result = await db.execute(
        select(ChatParticipant)
        .options(
            joinedload(ChatParticipant.user),
            joinedload(ChatParticipant.bot)
        )
        .where(ChatParticipant.room_id == room_id)
    )
    participants = result.scalars().all()
    
    # Загружаем сообщения с полной информацией об отправителях
    result = await db.execute(
        select(ChatMessage)
        .options(
            joinedload(ChatMessage.sender),
            joinedload(ChatMessage.bot)
        )
        .where(ChatMessage.room_id == room_id)
        .order_by(ChatMessage.created_at)
    )
    messages = result.scalars().all()
    
    # Создаем ответ с участниками и сообщениями
    return ChatRoomDetailResponse(
        id=room.id,
        name=room.name,
        description=room.description,
        created_by=room.created_by,
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
        select(ChatParticipant).where(and_(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == current_user.id,
            ChatParticipant.is_admin == True
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


@router.post("/rooms/{room_id}/participants/", response_model=ChatParticipantResponse)
async def add_chat_participant(
    room_id: int,
    participant: ChatParticipantCreate,
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
        select(ChatParticipant).where(and_(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == current_user.id,
            ChatParticipant.is_admin == True
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
            select(ChatParticipant).where(and_(
                ChatParticipant.room_id == room_id,
                ChatParticipant.user_id == participant.user_id
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
            select(ChatParticipant).where(and_(
                ChatParticipant.room_id == room_id,
                ChatParticipant.bot_id == participant.bot_id
            ))
        )
        existing_participant = result.scalar_one_or_none()
        if existing_participant:
            raise HTTPException(status_code=400, detail="Бот уже является участником беседы")
    else:
        raise HTTPException(status_code=400, detail="Необходимо указать либо user_id, либо bot_id")
    
    new_participant = ChatParticipant(
        room_id=room_id,
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
        select(ChatParticipant).where(and_(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == current_user.id,
            ChatParticipant.is_admin == True
        ))
    )
    admin = result.scalar_one_or_none()
    
    # Получаем участника
    result = await db.execute(
        select(ChatParticipant).where(ChatParticipant.id == participant_id)
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


@router.put("/rooms/{room_id}/participants/{participant_id}/toggle-admin")
async def toggle_participant_admin(
    room_id: int,
    participant_id: int,
    admin_update: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Переключение прав администратора участника беседы"""
    # Проверяем, является ли текущий пользователь администратором беседы
    result = await db.execute(
        select(ChatParticipant).where(and_(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == current_user.id,
            ChatParticipant.is_admin == True
        ))
    )
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=403, detail="У вас нет прав для изменения прав участников")
    
    # Получаем участника
    result = await db.execute(
        select(ChatParticipant).where(ChatParticipant.id == participant_id)
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=404, detail="Участник не найден")
    
    # Проверяем, что участник принадлежит к этой беседе
    if participant.room_id != room_id:
        raise HTTPException(status_code=400, detail="Участник не принадлежит к этой беседе")
    
    # Обновляем права администратора
    participant.is_admin = admin_update.get("is_admin", False)
    await db.commit()
    await db.refresh(participant)
    
    return {"message": "Права администратора успешно обновлены", "is_admin": participant.is_admin}


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
        select(ChatParticipant).where(and_(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == current_user.id
        ))
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="У вас нет доступа к этой беседе")
    
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.room_id == room_id)
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
        select(ChatParticipant).where(and_(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == current_user.id
        ))
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="У вас нет доступа к этой беседе")
    
    db_message = ChatMessage(
        room_id=room_id,
        sender_id=current_user.id,
        content=message.content
    )
    db.add(db_message)
    await db.commit()
    await db.refresh(db_message)
    
    # Загружаем полную информацию о пользователе
    await db.refresh(current_user)
    
    # Отправляем сообщение всем подключенным клиентам в этой комнате
    if room_id in connected_clients:
        message_data = {
            "type": "message",
            "data": {
                "id": db_message.id,
                "content": db_message.content,
                "sender_id": db_message.sender_id,
                "sender": {
                    "id": current_user.id,
                    "username": current_user.username,
                    "first_name": current_user.first_name,
                    "last_name": current_user.last_name,
                    "avatar_url": current_user.avatar_url,
                    "department_id": current_user.department_id
                },
                "created_at": db_message.created_at.isoformat()
            }
        }
        
        # Отправляем всем подключенным клиентам в комнате, кроме отправителя
        disconnected_clients = set()
        for client in connected_clients[room_id]:
            try:
                # Исключаем отправителя из получателей
                # Проверяем, не является ли клиент отправителем сообщения
                # Для этого нужно найти WebSocket соединение отправителя
                is_sender = False
                if current_user.id in user_connections:
                    if client in user_connections[current_user.id]:
                        is_sender = True
                
                if not is_sender:
                    await client.send_json(message_data)
            except Exception as e:
                print(f"❌ Ошибка отправки HTTP сообщения клиенту: {e}")
                disconnected_clients.add(client)
        
        # Удаляем отключенных клиентов
        for client in disconnected_clients:
            connected_clients[room_id].discard(client)
        
        print(f"📤 HTTP сообщение отправлено {len(connected_clients.get(room_id, set()))} клиентам в чате {room_id}")
    
    # Проверяем, есть ли боты в чате и отправляем им сообщения
    result = await db.execute(
        select(ChatParticipant).where(and_(
            ChatParticipant.room_id == room_id,
            ChatParticipant.bot_id.isnot(None)
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


@router.delete("/rooms/{room_id}/leave")
async def leave_chat_room(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Выход пользователя из беседы"""
    try:
        # Проверяем, является ли пользователь участником беседы
        result = await db.execute(
            select(ChatParticipant).where(and_(
                ChatParticipant.room_id == room_id,
                ChatParticipant.user_id == current_user.id
            ))
        )
        participant = result.scalar_one_or_none()
        if not participant:
            raise HTTPException(status_code=404, detail="Вы не являетесь участником этой беседы")
        
        # Удаляем участника
        await db.delete(participant)
        
        # Создаем системное сообщение о выходе
        system_message = ChatMessage(
            room_id=room_id,
            content=f"{current_user.first_name} {current_user.last_name} покинул беседу",
            sender_id=SYSTEM_USER_ID,  # ID системного пользователя
            bot_id=None,
            is_edited=False
        )
        db.add(system_message)
        
        await db.commit()
        await db.refresh(system_message)
        
        print(f"🚪 Пользователь {current_user.username} покинул чат {room_id}")
        
        # Отправляем уведомление через WebSocket всем участникам
        if room_id in connected_clients:
            system_message_data = {
                "type": "system_message",
                "data": {
                    "id": system_message.id,
                    "content": system_message.content,
                    "created_at": system_message.created_at.isoformat(),
                    "room_id": room_id
                }
            }
            
            # Отправляем всем подключенным клиентам в комнате, кроме покидающего пользователя
            disconnected_clients = set()
            for client in connected_clients[room_id]:
                try:
                    # Исключаем покидающего пользователя из получателей
                    is_leaving_user = False
                    if current_user.id in user_connections:
                        if client in user_connections[current_user.id]:
                            is_leaving_user = True
                    
                    if not is_leaving_user:
                        await client.send_json(system_message_data)
                except Exception as e:
                    print(f"❌ Ошибка отправки системного сообщения клиенту: {e}")
                    disconnected_clients.add(client)
            
            # Удаляем отключенных клиентов
            for client in disconnected_clients:
                connected_clients[room_id].discard(client)
            
            print(f"📤 Системное сообщение отправлено {len(connected_clients.get(room_id, set()))} клиентам")
        
        # Удаляем пользователя из списка участников комнаты
        if room_id in room_participants:
            room_participants[room_id].discard(current_user.id)
            if not room_participants[room_id]:
                del room_participants[room_id]
        
        # Удаляем WebSocket подключения пользователя для этой комнаты
        if current_user.id in user_connections:
            # Закрываем все WebSocket подключения пользователя к этой комнате
            websockets_to_close = set()
            for websocket in user_connections[current_user.id]:
                try:
                    await websocket.close(code=1000, reason="User left the room")
                    websockets_to_close.add(websocket)
                except Exception as e:
                    print(f"❌ Ошибка закрытия WebSocket: {e}")
                    websockets_to_close.add(websocket)
            
            # Удаляем закрытые WebSocket из списка
            for websocket in websockets_to_close:
                user_connections[current_user.id].discard(websocket)
            
            if not user_connections[current_user.id]:
                del user_connections[current_user.id]
        
        return {"message": "Вы успешно покинули беседу"}
        
    except Exception as e:
        await db.rollback()
        print(f"❌ Ошибка при выходе из чата: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при выходе из беседы: {str(e)}")


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
        current_user = await get_current_user_from_token(token, db)
        
        # Проверяем, является ли пользователь участником беседы
        result = await db.execute(
            select(ChatParticipant).where(and_(
                ChatParticipant.room_id == room_id,
                ChatParticipant.user_id == current_user.id
            ))
        )
        participant = result.scalar_one_or_none()
        if not participant:
            await websocket.close(code=4003)
            return
        
        await websocket.accept()
        
        # Добавляем клиента в список подключенных для комнаты
        if room_id not in connected_clients:
            connected_clients[room_id] = set()
        connected_clients[room_id].add(websocket)
        
        # Добавляем клиента в список подключений пользователя
        if current_user.id not in user_connections:
            user_connections[current_user.id] = set()
        user_connections[current_user.id].add(websocket)
        
        # Добавляем пользователя в список участников комнаты
        if room_id not in room_participants:
            room_participants[room_id] = set()
        room_participants[room_id].add(current_user.id)
        
        print(f"🔌 WebSocket подключен: пользователь {current_user.username} к чату {room_id}")
        print(f"📊 Статистика: {len(connected_clients.get(room_id, set()))} подключений в чате {room_id}")
        
        try:
            while True:
                # Ожидаем сообщения от клиента
                data = await websocket.receive_json()
                
                if data["type"] == "message":
                    # Создаем новое сообщение в базе данных
                    db_message = ChatMessage(
                        room_id=room_id,
                        sender_id=current_user.id,
                        content=data["content"]
                    )
                    db.add(db_message)
                    await db.commit()
                    await db.refresh(db_message)
                    
                    # Загружаем полную информацию о пользователе
                    await db.refresh(current_user)
                    
                    # Отправляем сообщение всем подключенным клиентам в этой комнате
                    message_data = {
                        "type": "message",
                        "data": {
                            "id": db_message.id,
                            "content": db_message.content,
                            "sender_id": db_message.sender_id,
                            "sender": {
                                "id": current_user.id,
                                "username": current_user.username,
                                "first_name": current_user.first_name,
                                "last_name": current_user.last_name,
                                "avatar_url": current_user.avatar_url,
                                "department_id": current_user.department_id
                            },
                            "created_at": db_message.created_at.isoformat()
                        }
                    }
                    
                    # Отправляем всем подключенным клиентам в комнате, кроме отправителя
                    disconnected_clients = set()
                    for client in connected_clients[room_id]:
                        try:
                            # Исключаем отправителя из получателей
                            if client != websocket:
                                await client.send_json(message_data)
                        except Exception as e:
                            print(f"❌ Ошибка отправки сообщения клиенту: {e}")
                            disconnected_clients.add(client)
                    
                    # Удаляем отключенных клиентов
                    for client in disconnected_clients:
                        connected_clients[room_id].discard(client)
                    
                    print(f"📤 Сообщение отправлено {len(connected_clients[room_id])} клиентам в чате {room_id}")
        
        except WebSocketDisconnect:
            print(f"🔌 WebSocket отключен: пользователь {current_user.username} от чата {room_id}")
        finally:
            # Удаляем клиента из всех списков
            if room_id in connected_clients:
                connected_clients[room_id].discard(websocket)
                if not connected_clients[room_id]:
                    del connected_clients[room_id]
            
            if current_user.id in user_connections:
                user_connections[current_user.id].discard(websocket)
                if not user_connections[current_user.id]:
                    del user_connections[current_user.id]
            
            if room_id in room_participants:
                room_participants[room_id].discard(current_user.id)
                if not room_participants[room_id]:
                    del room_participants[room_id]
    
    except Exception as e:
        print(f"❌ Ошибка WebSocket: {e}")
        await websocket.close(code=4000)


@router.get("/ws-stats")
async def get_websocket_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение статистики WebSocket подключений"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Только администраторы могут просматривать статистику")
    
    stats = {
        "total_rooms": len(connected_clients),
        "total_users": len(user_connections),
        "rooms": {}
    }
    
    for room_id, websockets in connected_clients.items():
        stats["rooms"][room_id] = {
            "connected_clients": len(websockets),
            "participants": list(room_participants.get(room_id, set()))
        }
    
    return stats


async def send_notification_to_room_participants(room_id: int, message_data: dict, exclude_user_id: int = None):
    """Отправляет уведомление всем участникам чата"""
    try:
        # Получаем всех участников чата
        result = await db.execute(
            select(ChatParticipant).where(ChatParticipant.room_id == room_id)
        )
        participants = result.scalars().all()
        
        notification_data = {
            "type": "notification",
            "room_id": room_id,
            "data": message_data
        }
        
        # Отправляем уведомления всем подключенным участникам
        for participant in participants:
            user_id = participant.user_id
            if user_id and user_id != exclude_user_id and user_id in user_connections:
                for websocket in user_connections[user_id]:
                    try:
                        await websocket.send_json(notification_data)
                    except Exception as e:
                        print(f"❌ Ошибка отправки уведомления пользователю {user_id}: {e}")
        
        print(f"📢 Уведомления отправлены участникам чата {room_id}")
        
    except Exception as e:
        print(f"❌ Ошибка отправки уведомлений: {e}")


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
                    ChatMessage.room_id == room_id,
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
                                    room_id=room_id,
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
                                                    "bot": {
                                                        "id": bot.id,
                                                        "name": bot.name,
                                                        "description": bot.description,
                                                        "is_active": bot.is_active
                                                    },
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

# Роуты для папок
@router.post("/folders/", response_model=ChatFolderSchema)
async def create_chat_folder(
    folder: ChatFolderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание новой папки для чатов"""
    db_folder = ChatFolder(
        name=folder.name,
        order_index=folder.order_index,
        user_id=current_user.id
    )
    db.add(db_folder)
    await db.commit()
    await db.refresh(db_folder)
    return db_folder


@router.get("/folders/", response_model=List[ChatFolderSchema])
async def get_chat_folders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка папок пользователя"""
    result = await db.execute(
        select(ChatFolder).where(ChatFolder.user_id == current_user.id)
    )
    folders = result.scalars().all()
    return folders


@router.put("/folders/{folder_id}", response_model=ChatFolderSchema)
async def update_chat_folder(
    folder_id: int,
    folder_update: ChatFolderUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление папки"""
    result = await db.execute(
        select(ChatFolder).where(and_(
            ChatFolder.id == folder_id,
            ChatFolder.user_id == current_user.id
        ))
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Папка не найдена")
    
    for field, value in folder_update.dict(exclude_unset=True).items():
        setattr(folder, field, value)
    
    await db.commit()
    await db.refresh(folder)
    return folder


@router.delete("/folders/{folder_id}")
async def delete_chat_folder(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление папки"""
    result = await db.execute(
        select(ChatFolder).where(and_(
            ChatFolder.id == folder_id,
            ChatFolder.user_id == current_user.id
        ))
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Папка не найдена")
    
    await db.delete(folder)
    await db.commit()
    return {"message": "Папка успешно удалена"}


@router.post("/folders/{folder_id}/rooms/{room_id}")
async def add_room_to_folder(
    folder_id: int,
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Добавление чата в папку"""
    # Проверяем, существует ли папка и принадлежит ли она пользователю
    result = await db.execute(
        select(ChatFolder).where(and_(
            ChatFolder.id == folder_id,
            ChatFolder.user_id == current_user.id
        ))
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Папка не найдена")
    
    # Проверяем, является ли пользователь участником чата
    result = await db.execute(
        select(ChatParticipant).where(and_(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == current_user.id
        ))
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="У вас нет доступа к этому чату")
    
    # Проверяем, не добавлен ли уже чат в эту папку для данного пользователя
    result = await db.execute(
        select(ChatRoomFolder).where(and_(
            ChatRoomFolder.folder_id == folder_id,
            ChatRoomFolder.room_id == room_id,
            ChatRoomFolder.user_id == current_user.id
        ))
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Чат уже добавлен в эту папку")
    
    # Добавляем чат в папку для данного пользователя
    room_folder = ChatRoomFolder(
        folder_id=folder_id,
        room_id=room_id,
        user_id=current_user.id
    )
    db.add(room_folder)
    await db.commit()
    
    return {"message": "Чат успешно добавлен в папку"}


@router.delete("/folders/{folder_id}/rooms/{room_id}")
async def remove_room_from_folder(
    folder_id: int,
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление чата из папки"""
    # Проверяем, существует ли папка и принадлежит ли она пользователю
    result = await db.execute(
        select(ChatFolder).where(and_(
            ChatFolder.id == folder_id,
            ChatFolder.user_id == current_user.id
        ))
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Папка не найдена")
    
    # Удаляем связь чата с папкой для данного пользователя
    result = await db.execute(
        select(ChatRoomFolder).where(and_(
            ChatRoomFolder.folder_id == folder_id,
            ChatRoomFolder.room_id == room_id,
            ChatRoomFolder.user_id == current_user.id
        ))
    )
    room_folder = result.scalar_one_or_none()
    if not room_folder:
        raise HTTPException(status_code=404, detail="Чат не найден в этой папке")
    
    await db.delete(room_folder)
    await db.commit()
    
    return {"message": "Чат успешно удален из папки"}


@router.get("/rooms/{room_id}/unread-count")
async def get_unread_count(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение количества непрочитанных сообщений в чате"""
    # Проверяем, является ли пользователь участником беседы
    result = await db.execute(
        select(ChatParticipant).where(and_(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == current_user.id
        ))
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="У вас нет доступа к этой беседе")
    
    # Получаем время последнего прочтения
    last_read = participant.last_read_at or participant.joined_at
    
    # Подсчитываем непрочитанные сообщения
    result = await db.execute(
        select(ChatMessage).where(and_(
            ChatMessage.room_id == room_id,
            ChatMessage.created_at > last_read,
            ChatMessage.sender_id != current_user.id,  # Исключаем собственные сообщения
            ChatMessage.bot_id.is_(None)  # Исключаем сообщения от ботов
        ))
    )
    unread_messages = result.scalars().all()
    
    return {"unread_count": len(unread_messages)}


@router.post("/rooms/{room_id}/mark-read")
async def mark_messages_as_read(
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Отметить сообщения в чате как прочитанные"""
    # Проверяем, является ли пользователь участником беседы
    result = await db.execute(
        select(ChatParticipant).where(and_(
            ChatParticipant.room_id == room_id,
            ChatParticipant.user_id == current_user.id
        ))
    )
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=403, detail="У вас нет доступа к этой беседе")
    
    # Обновляем время последнего прочтения
    participant.last_read_at = datetime.now()
    await db.commit()
    
    return {"message": "Сообщения отмечены как прочитанные"}


@router.get("/unread-summary")
async def get_unread_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение сводки непрочитанных сообщений по всем чатам пользователя"""
    # Получаем все чаты пользователя
    result = await db.execute(
        select(ChatParticipant)
        .options(selectinload(ChatParticipant.chat_room))
        .where(ChatParticipant.user_id == current_user.id)
    )
    participants = result.scalars().all()
    
    unread_summary = []
    
    for participant in participants:
        if not participant.chat_room.is_active:
            continue
            
        # Получаем время последнего прочтения
        last_read = participant.last_read_at or participant.joined_at
        
        # Подсчитываем непрочитанные сообщения
        result = await db.execute(
            select(ChatMessage).where(and_(
                ChatMessage.room_id == participant.room_id,
                ChatMessage.created_at > last_read,
                ChatMessage.sender_id != current_user.id,
                ChatMessage.bot_id.is_(None)
            ))
        )
        unread_count = len(result.scalars().all())
        
        if unread_count > 0:
            unread_summary.append({
                "room_id": participant.room_id,
                "room_name": participant.chat_room.name,
                "unread_count": unread_count
            })
    
    return {"unread_summary": unread_summary}
