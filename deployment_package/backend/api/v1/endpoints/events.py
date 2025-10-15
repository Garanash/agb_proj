from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from api.v1.dependencies import get_db, get_current_user_optional
from api.v1.schemas import EventCreate, EventUpdate, EventResponse
from models import Event, User

router = APIRouter(tags=["events"])


def check_admin_or_manager(user: User):
    """Проверка прав администратора или менеджера"""
    if user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения этой операции"
        )


def safe_isoformat(date_obj):
    """Безопасное преобразование дат в ISO формат"""
    if date_obj is None:
        return None
    if isinstance(date_obj, str):
        return date_obj
    return date_obj.isoformat()


@router.get("/", response_model=List[EventResponse])
def get_events_root(
    skip: int = 0,
    limit: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получение списка событий (корневой endpoint)"""
    try:
        # Используем SQLAlchemy для получения событий
        events = db.query(Event).order_by(Event.created_at.desc()).limit(limit).offset(skip).all()
        
        events_list = []
        for event in events:
            event_dict = {
                "id": event.id,
                "title": event.title,
                "description": event.description,
                "event_type": event.event_type,
                "start_date": safe_isoformat(event.start_date),
                "end_date": safe_isoformat(event.end_date),
                "location": event.location,
                "is_public": event.is_public,
                "is_active": event.is_active,
                "organizer_id": event.organizer_id,
                "organizer_name": event.organizer.username if event.organizer else None,
                "created_at": safe_isoformat(event.created_at)
            }
            events_list.append(event_dict)
    
        return events_list
    except Exception as e:
        print(f"Ошибка в get_events_root: {e}")
        return []


@router.get("/list", response_model=List[EventResponse])
def get_events_list(
    skip: int = 0,
    limit: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получение списка событий (альтернативный endpoint)"""
    return get_events_root(skip, limit, start_date, end_date, db)


@router.get("/all", response_model=List[EventResponse])
def get_events_all(
    skip: int = 0,
    limit: int = 10,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получение списка событий (альтернативный endpoint)"""
    return get_events_root(skip, limit, start_date, end_date, db)


@router.post("/", response_model=EventResponse)
def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Создание нового события"""
    try:
        # Проверяем права доступа
        if not current_user:
            raise HTTPException(status_code=401, detail="Требуется аутентификация")
        
        check_admin_or_manager(current_user)
        
        # Создаем новое событие
        try:
            start_date = datetime.fromisoformat(event_data.start_date.replace('Z', '+00:00'))
        except ValueError:
            start_date = datetime.fromisoformat(event_data.start_date)
        
        try:
            end_date = datetime.fromisoformat(event_data.end_date.replace('Z', '+00:00'))
        except ValueError:
            end_date = datetime.fromisoformat(event_data.end_date)
        
        event = Event(
            title=event_data.title,
            description=event_data.description,
            event_type=event_data.event_type,
            start_date=start_date,
            end_date=end_date,
            location=event_data.location,
            organizer_id=current_user.id,
            is_public=event_data.is_public
        )
    
        db.add(event)
        db.commit()
        db.refresh(event)
        
        # Возвращаем событие в правильном формате
        return EventResponse(
            id=event.id,
            title=event.title,
            description=event.description,
            event_type=event.event_type,
            start_date=safe_isoformat(event.start_date),
            end_date=safe_isoformat(event.end_date),
            location=event.location,
            is_public=event.is_public,
            is_active=event.is_active,
            organizer_id=event.organizer_id,
            organizer_name=event.organizer.username if event.organizer else None,
            created_at=safe_isoformat(event.created_at),
            updated_at=safe_isoformat(event.updated_at)
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при создании события: {str(e)}")


@router.get("/{event_id}", response_model=EventResponse)
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
    
    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        event_type=event.event_type,
        start_date=safe_isoformat(event.start_date),
        end_date=safe_isoformat(event.end_date),
        location=event.location,
        is_public=event.is_public,
        is_active=event.is_active,
        organizer_id=event.organizer_id,
        organizer_name=event.organizer.username if event.organizer else None,
        created_at=safe_isoformat(event.created_at),
        updated_at=safe_isoformat(event.updated_at)
    )


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: int,
    event_data: EventUpdate,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Обновление события"""
    try:
        # Проверяем права доступа
        if not current_user:
            raise HTTPException(status_code=401, detail="Требуется аутентификация")
        
        check_admin_or_manager(current_user)
        
        # Находим событие
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Событие не найдено"
            )
        
        # Обновляем поля
        if event_data.title is not None:
            event.title = event_data.title
        if event_data.description is not None:
            event.description = event_data.description
        if event_data.event_type is not None:
            event.event_type = event_data.event_type
        if event_data.start_date is not None:
            event.start_date = event_data.start_date
        if event_data.end_date is not None:
            event.end_date = event_data.end_date
        if event_data.location is not None:
            event.location = event_data.location
        if event_data.is_public is not None:
            event.is_public = event_data.is_public
        
        db.commit()
        db.refresh(event)
        
        return EventResponse(
            id=event.id,
            title=event.title,
            description=event.description,
            event_type=event.event_type,
            start_date=safe_isoformat(event.start_date),
            end_date=safe_isoformat(event.end_date),
            location=event.location,
            is_public=event.is_public,
            is_active=event.is_active,
            organizer_id=event.organizer_id,
            organizer_name=event.organizer.username if event.organizer else None,
            created_at=safe_isoformat(event.created_at),
            updated_at=safe_isoformat(event.updated_at)
        )
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении события: {str(e)}")


@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Удаление события"""
    try:
        # Проверяем права доступа
        if not current_user:
            raise HTTPException(status_code=401, detail="Требуется аутентификация")
        
        check_admin_or_manager(current_user)
        
        # Находим событие
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Событие не найдено"
            )
        
        db.delete(event)
        db.commit()
        
        return {"message": "Событие успешно удалено"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении события: {str(e)}")