from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload

from database import get_db
from models import ChatFolder, ChatRoom, ChatRoomFolder, User
from schemas import (
    ChatFolder as ChatFolderSchema,
    ChatFolderCreate,
    ChatFolderUpdate,
    ChatFolderRoomAdd,
    ChatRoom as ChatRoomSchema
)
from routers.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=list[ChatFolderSchema])
async def get_folders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка папок пользователя"""
    result = await db.execute(
        select(ChatFolder)
        .where(ChatFolder.user_id == current_user.id)
        .order_by(ChatFolder.order_index)
    )
    folders = result.scalars().all()
    return folders


@router.post("/", response_model=ChatFolderSchema)
async def create_folder(
    folder_data: ChatFolderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание новой папки"""
    # Проверяем уникальность имени для пользователя
    result = await db.execute(
        select(ChatFolder).where(and_(
            ChatFolder.user_id == current_user.id,
            ChatFolder.name == folder_data.name
        ))
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Папка с таким именем уже существует")

    # Создаем папку
    folder = ChatFolder(
        name=folder_data.name,
        user_id=current_user.id,
        order_index=folder_data.order_index
    )
    db.add(folder)
    await db.commit()
    await db.refresh(folder)
    return folder


@router.put("/{folder_id}", response_model=ChatFolderSchema)
async def update_folder(
    folder_id: int,
    folder_data: ChatFolderUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление папки"""
    # Получаем папку
    result = await db.execute(
        select(ChatFolder).where(and_(
            ChatFolder.id == folder_id,
            ChatFolder.user_id == current_user.id
        ))
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Папка не найдена")

    # Проверяем уникальность имени если оно меняется
    if folder_data.name and folder_data.name != folder.name:
        result = await db.execute(
            select(ChatFolder).where(and_(
                ChatFolder.user_id == current_user.id,
                ChatFolder.name == folder_data.name,
                ChatFolder.id != folder_id
            ))
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Папка с таким именем уже существует")

    # Обновляем поля
    update_data = folder_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(folder, field, value)

    await db.commit()
    await db.refresh(folder)
    return folder


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление папки"""
    # Получаем папку
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


@router.get("/{folder_id}/rooms", response_model=list[ChatRoomSchema])
async def get_folder_rooms(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка чатов в папке"""
    # Проверяем существование папки и права доступа
    result = await db.execute(
        select(ChatFolder).where(and_(
            ChatFolder.id == folder_id,
            ChatFolder.user_id == current_user.id
        ))
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Папка не найдена")

    # Получаем чаты из папки
    result = await db.execute(
        select(ChatRoom)
        .join(ChatRoomFolder)
        .where(ChatRoomFolder.folder_id == folder_id)
        .order_by(ChatRoom.created_at.desc())
    )
    rooms = result.scalars().all()
    return rooms


@router.post("/{folder_id}/rooms", response_model=ChatRoomSchema)
async def add_room_to_folder(
    folder_id: int,
    room_data: ChatFolderRoomAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Добавление чата в папку"""
    # Проверяем существование папки и права доступа
    result = await db.execute(
        select(ChatFolder).where(and_(
            ChatFolder.id == folder_id,
            ChatFolder.user_id == current_user.id
        ))
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Папка не найдена")

    # Проверяем существование чата и права доступа
    result = await db.execute(
        select(ChatRoom)
        .join(ChatRoomParticipant)
        .where(and_(
            ChatRoom.id == room_data.room_id,
            ChatRoomParticipant.user_id == current_user.id
        ))
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Чат не найден или у вас нет к нему доступа")

    # Проверяем, не добавлен ли чат уже в эту папку
    result = await db.execute(
        select(ChatRoomFolder).where(and_(
            ChatRoomFolder.folder_id == folder_id,
            ChatRoomFolder.room_id == room_data.room_id
        ))
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Чат уже добавлен в эту папку")

    # Добавляем чат в папку
    folder_room = ChatRoomFolder(
        folder_id=folder_id,
        room_id=room_data.room_id
    )
    db.add(folder_room)
    await db.commit()

    return room


@router.delete("/{folder_id}/rooms/{room_id}")
async def remove_room_from_folder(
    folder_id: int,
    room_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление чата из папки"""
    # Проверяем существование папки и права доступа
    result = await db.execute(
        select(ChatFolder).where(and_(
            ChatFolder.id == folder_id,
            ChatFolder.user_id == current_user.id
        ))
    )
    folder = result.scalar_one_or_none()
    if not folder:
        raise HTTPException(status_code=404, detail="Папка не найдена")

    # Получаем связь чата с папкой
    result = await db.execute(
        select(ChatRoomFolder).where(and_(
            ChatRoomFolder.folder_id == folder_id,
            ChatRoomFolder.room_id == room_id
        ))
    )
    folder_room = result.scalar_one_or_none()
    if not folder_room:
        raise HTTPException(status_code=404, detail="Чат не найден в этой папке")

    await db.delete(folder_room)
    await db.commit()
    return {"message": "Чат успешно удален из папки"}
