from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from database import get_db
from models import Event, User, UserRole
from ..schemas import EventResponse as EventSchema, EventCreate, EventUpdate
from .auth import get_current_user, get_current_user_optional

router = APIRouter()


def check_admin_or_manager(current_user: User):
    """Проверка прав администратора или менеджера"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения этой операции"
        )


@router.get("/list", response_model=List[EventSchema])
def get_events(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Получение списка событий"""
    try:
        # Используем raw SQL для получения событий
        query = "SELECT id, title, description, start_date, end_date, location, is_active, created_at FROM events ORDER BY created_at DESC LIMIT %s OFFSET %s"
        
        result = db.execute(text(query), [limit, skip]).fetchall()
        
        events_list = []
        for row in result:
            event_dict = {
                "id": row[0],
                "title": row[1],
                "description": row[2],
                "start_date": row[3].isoformat() if row[3] else None,
                "end_date": row[4].isoformat() if row[4] else None,
                "location": row[5],
                "is_active": row[6],
                "created_at": row[7].isoformat() if row[7] else None
            }
            events_list.append(event_dict)
        
        return events_list
    except Exception as e:
        print(f"Ошибка в get_events: {e}")
        return []


@router.get("/", response_model=List[EventSchema])
def get_events_root(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Получение списка событий (корневой endpoint)"""
    return get_events(skip, limit, db)


@router.get("/{event_id}", response_model=EventSchema)
def get_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Получение события по ID"""
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Событие не найдено"
        )
    
    return EventSchema(
        id=event.id,
        title=event.title,
        description=event.description,
        start_date=event.start_date.isoformat() if event.start_date else None,
        end_date=event.end_date.isoformat() if event.end_date else None,
        location=event.location,
        is_active=event.is_active,
        created_at=event.created_at.isoformat() if event.created_at else None,
        updated_at=event.updated_at.isoformat() if event.updated_at else None
    )