from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, func
from typing import Dict

from database import get_db
from models import ChatRoom, ChatMessage, ChatParticipant, User
from ..dependencies import get_current_user

router = APIRouter()

@router.get("/unread-summary")
def get_unread_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, int]:
    """Получение сводки о непрочитанных сообщениях"""
    try:
        # Получаем все чаты пользователя
        result = db.execute(
            select(ChatParticipant.room_id, ChatParticipant.last_read_at)
            .where(ChatParticipant.user_id == current_user.id)
        )
        participant_data = result.all()
        
        if not participant_data:
            return {
                "unread_counts": {},
                "total_unread": 0
            }
        
        unread_counts = {}
        for room_id, last_read_at in participant_data:
            # Для каждого чата считаем количество непрочитанных сообщений
            result = db.execute(
                select(func.count(ChatMessage.id))
                .where(
                    and_(
                        ChatMessage.room_id == room_id,
                        ChatMessage.created_at > (last_read_at or func.now())
                    )
                )
            )
            count = result.scalar()
            if count > 0:
                unread_counts[str(room_id)] = count
        
        return {
            "unread_counts": unread_counts,
            "total_unread": sum(unread_counts.values()) if unread_counts else 0
        }
    except Exception as e:
        # Если есть ошибка, возвращаем пустой результат
        return {
            "unread_counts": {},
            "total_unread": 0
        }
