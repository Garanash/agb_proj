from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict

from database import SessionLocal
from models import ChatFolder, ChatRoom, ChatMessage, ChatParticipant, User
from ..schemas import (
    ChatFolder as ChatFolderSchema,
    ChatFolderCreate,
    ChatRoom as ChatRoomSchema
)
from .auth import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/folders", response_model=List[ChatFolderSchema])
def get_folders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка папок пользователя"""
    try:
        folders = db.query(ChatFolder).filter(
            ChatFolder.user_id == current_user.id
        ).order_by(ChatFolder.order_index).all()
        
        return folders
        
    except Exception as e:
        print(f"Ошибка при получении папок: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.post("/folders", response_model=ChatFolderSchema)
def create_folder(
    folder_data: ChatFolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание новой папки"""
    try:
        # Проверяем уникальность имени для пользователя
        existing_folder = db.query(ChatFolder).filter(
            ChatFolder.user_id == current_user.id,
            ChatFolder.name == folder_data.name
        ).first()
        
        if existing_folder:
            raise HTTPException(status_code=400, detail="Папка с таким именем уже существует")
        
        # Создаем новую папку
        new_folder = ChatFolder(
            name=folder_data.name,
            user_id=current_user.id,
            order_index=folder_data.order_index or 0
        )
        
        db.add(new_folder)
        db.commit()
        db.refresh(new_folder)
        
        return new_folder
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при создании папки: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.get("/unread-summary", response_model=Dict[str, int])
def get_unread_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение сводки о непрочитанных сообщениях"""
    try:
        # Получаем все чаты пользователя
        participants = db.query(ChatParticipant).filter(
            ChatParticipant.user_id == current_user.id
        ).all()
        
        if not participants:
            return {
                "unread_counts": {},
                "total_unread": 0
            }
        
        unread_counts = {}
        total_unread = 0
        
        for participant in participants:
            # Для каждого чата считаем количество непрочитанных сообщений
            unread_count = db.query(ChatMessage).filter(
                ChatMessage.room_id == participant.room_id,
                ChatMessage.created_at > (participant.last_read_at or ChatMessage.created_at)
            ).count()
            
            if unread_count > 0:
                unread_counts[str(participant.room_id)] = unread_count
                total_unread += unread_count
        
        return {
            "unread_counts": unread_counts,
            "total_unread": total_unread
        }
        
    except Exception as e:
        print(f"Ошибка при получении сводки непрочитанных сообщений: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.get("/rooms/", response_model=List[ChatRoomSchema])
def get_chat_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка чатов пользователя"""
    try:
        # Получаем комнаты, в которых участвует пользователь
        rooms = db.query(ChatRoom).join(ChatParticipant).filter(
            ChatParticipant.user_id == current_user.id
        ).order_by(ChatRoom.updated_at.desc()).all()
        
        return rooms
        
    except Exception as e:
        print(f"Ошибка при получении чатов: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.get("/", response_model=List[ChatRoomSchema])
def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка чат-сессий пользователя (алиас для get_chat_rooms)"""
    return get_chat_rooms(current_user, db)
