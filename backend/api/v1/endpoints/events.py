from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, date
from typing import Optional, List

from database import get_db
from models import Event, User, EventParticipant, UserRole
from ..schemas import EventResponse, EventCreate, EventUpdate
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[EventResponse])
async def get_events(
    start_date: Optional[date] = Query(None, description="Начальная дата фильтра"),
    end_date: Optional[date] = Query(None, description="Конечная дата фильтра"),
    event_type: Optional[str] = Query(None, description="Тип события"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка событий с фильтрацией"""
    # Базовый запрос для активных событий
    query = db.query(Event).filter(Event.is_active == True)
    
    # Фильтруем события: показываем только общие события или события, где пользователь является участником
    # Общие события (is_public=True) или события, где пользователь является участником
    query = query.filter(
        (Event.is_public == True) | 
        (Event.id.in_(
            db.query(EventParticipant.event_id).filter(EventParticipant.user_id == current_user.id)
        ))
    )
    
    if start_date:
        query = query.filter(Event.start_date >= datetime.combine(start_date, datetime.min.time()))
    
    if end_date:
        query = query.filter(Event.end_date <= datetime.combine(end_date, datetime.max.time()))
    
    if event_type:
        query = query.filter(Event.event_type == event_type)
    
    query = query.order_by(Event.start_date)
    
    events = query.all()
    
    # Сериализуем события в правильный формат
    events_list = []
    for event in events:
        # Формируем список участников
        participants_list = []
        if event.participants:
            for participant in event.participants:
                participants_list.append({
                    "id": participant.id,
                    "user_id": participant.user_id,
                    "status": participant.status,
                    "created_at": participant.created_at.isoformat(),
                    "user": {
                        "id": participant.user.id,
                        "username": participant.user.username,
                        "role": participant.user.role,
                        "is_active": participant.user.is_active
                    }
                })
        
        event_dict = {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "start_date": event.start_date.isoformat(),
            "end_date": event.end_date.isoformat(),
            "event_type": event.event_type,
            "is_public": event.is_public,
            "location": event.location,
            "max_participants": None,  # Поле не существует в модели
            "current_participants": len(event.participants) if event.participants else 0,
            "participants": participants_list,
            "created_at": event.created_at.isoformat(),
            "updated_at": event.updated_at.isoformat() if event.updated_at else None
        }
        events_list.append(event_dict)
    
    return events_list


@router.post("/", response_model=EventResponse)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового события"""
    # Проверяем права: только администраторы и менеджеры могут создавать события
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Недостаточно прав для создания событий")

    # Проверяем корректность дат
    start_dt = datetime.fromisoformat(event_data.start_date.replace('Z', '+00:00'))
    end_dt = datetime.fromisoformat(event_data.end_date.replace('Z', '+00:00'))
    
    if end_dt <= start_dt:
        raise HTTPException(
            status_code=400, 
            detail="Дата окончания должна быть позже даты начала"
        )
    
    # Создаем событие
    # Парсим строки дат в datetime объекты
    start_date_naive = start_dt.replace(tzinfo=None)
    end_date_naive = end_dt.replace(tzinfo=None)

    db_event = Event(
        title=event_data.title,
        description=event_data.description,
        start_date=start_date_naive,
        end_date=end_date_naive,
        location=event_data.location,
        event_type=event_data.event_type,
        organizer_id=current_user.id,
        is_public=event_data.is_public
    )
    
    db.add(db_event)
    await db.flush()  # Получаем ID события

    # Автоматически добавляем создателя события в список участников
    creator_participant = EventParticipant(
        event_id=db_event.id,
        user_id=current_user.id
    )
    db.add(creator_participant)
    
    # Добавляем остальных участников
    for user_id in event_data.participants:
        # Пропускаем создателя, если он уже добавлен
        if user_id == current_user.id:
            continue
            
        # Проверяем существование пользователя
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            await db.rollback()
            raise HTTPException(status_code=404, detail=f"Пользователь с ID {user_id} не найден")

        participant = EventParticipant(
            event_id=db_event.id,
            user_id=user_id
        )
        db.add(participant)

    await db.commit()
    
    # Загружаем событие с участниками для корректной сериализации
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.participants).selectinload(EventParticipant.user)
        )
        .where(Event.id == db_event.id)
    )
    db_event = result.scalar_one()
    
    # Формируем список участников
    participants_list = []
    if db_event.participants:
        for participant in db_event.participants:
            participants_list.append({
                "id": participant.id,
                "user_id": participant.user_id,
                "status": participant.status,
                "created_at": participant.created_at.isoformat(),
                "user": {
                    "id": participant.user.id,
                    "username": participant.user.username,
                    "role": participant.user.role,
                    "is_active": participant.user.is_active
                }
            })
    
    # Сериализуем событие в правильный формат
    event_dict = {
        "id": db_event.id,
        "title": db_event.title,
        "description": db_event.description,
        "start_date": db_event.start_date.isoformat(),
        "end_date": db_event.end_date.isoformat(),
        "event_type": db_event.event_type,
        "is_public": db_event.is_public,
        "location": db_event.location,
        "max_participants": None,  # Поле не существует в модели
        "current_participants": len(db_event.participants) if db_event.participants else 0,
        "participants": participants_list,
        "created_at": db_event.created_at.isoformat(),
        "updated_at": db_event.updated_at.isoformat() if db_event.updated_at else None
    }
    
    return event_dict


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение события по ID"""
    result = await db.execute(
        select(Event)
        .where(and_(Event.id == event_id, Event.is_active == True))
        .options(selectinload(Event.participants).selectinload(EventParticipant.user))
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    
    # Формируем список участников
    participants_list = []
    if event.participants:
        for participant in event.participants:
            participants_list.append({
                "id": participant.id,
                "user_id": participant.user_id,
                "status": participant.status,
                "created_at": participant.created_at.isoformat(),
                "user": {
                    "id": participant.user.id,
                    "username": participant.user.username,
                    "role": participant.user.role,
                    "is_active": participant.user.is_active
                }
            })
    
    # Сериализуем событие в правильный формат
    event_dict = {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "start_date": event.start_date.isoformat(),
        "end_date": event.end_date.isoformat(),
        "event_type": event.event_type,
        "is_public": event.is_public,
        "location": event.location,
        "max_participants": None,  # Поле не существует в модели
        "current_participants": len(event.participants) if event.participants else 0,
        "participants": participants_list,
        "created_at": event.created_at.isoformat(),
        "updated_at": event.updated_at.isoformat() if event.updated_at else None
    }
    
    return event_dict


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_data: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление события"""
    result = await db.execute(
        select(Event)
        .where(and_(Event.id == event_id, Event.is_active == True))
        .options(selectinload(Event.participants).selectinload(EventParticipant.user))
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    
    # Проверяем права: только создатель или администратор могут редактировать
    if event.organizer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Недостаточно прав для редактирования")

    # Обновляем поля
    update_data = event_data.dict(exclude_unset=True)

    # Проверяем корректность дат если они обновляются
    start_dt = update_data.get('start_date', event.start_date)
    end_dt = update_data.get('end_date', event.end_date)
    
    # Если даты приходят как строки, парсим их
    if isinstance(start_dt, str):
        start_dt = datetime.fromisoformat(start_dt.replace('Z', '+00:00'))
    if isinstance(end_dt, str):
        end_dt = datetime.fromisoformat(end_dt.replace('Z', '+00:00'))
    
    if end_dt <= start_dt:
        raise HTTPException(
            status_code=400,
            detail="Дата окончания должна быть позже даты начала"
        )
    
    # Обновляем участников если они указаны
    if 'participants' in update_data:
        # Удаляем старых участников
        result = await db.execute(
            select(EventParticipant).where(EventParticipant.event_id == event.id)
        )
        old_participants = result.scalars().all()
        for participant in old_participants:
            await db.delete(participant)

        # Автоматически добавляем создателя события в список участников
        creator_participant = EventParticipant(
            event_id=event.id,
            user_id=event.organizer_id
        )
        db.add(creator_participant)
        
        # Добавляем остальных участников (если они есть)
        for user_id in update_data['participants']:
            # Пропускаем создателя, если он уже добавлен
            if user_id == event.organizer_id:
                continue
                
            # Проверяем существование пользователя
            result = await db.execute(select(User).where(User.id == user_id))
            user = result.scalar_one_or_none()
            if not user:
                await db.rollback()
                raise HTTPException(status_code=404, detail=f"Пользователь с ID {user_id} не найден")

            participant = EventParticipant(
                event_id=event.id,
                user_id=user_id
            )
            db.add(participant)

        # Удаляем participants из update_data, так как мы уже обработали их
        del update_data['participants']
    
    # Обновляем остальные поля
    for field, value in update_data.items():
        # Конвертируем строки дат в datetime объекты
        if field in ['start_date', 'end_date'] and isinstance(value, str):
            value = datetime.fromisoformat(value.replace('Z', '+00:00')).replace(tzinfo=None)
        setattr(event, field, value)
    
    await db.commit()
    
    # Загружаем обновленные данные с участниками для корректной сериализации
    result = await db.execute(
        select(Event)
        .where(Event.id == event_id)
        .options(selectinload(Event.participants).selectinload(EventParticipant.user))
    )
    updated_event = result.scalar_one_or_none()
    
    # Формируем список участников
    participants_list = []
    if updated_event.participants:
        for participant in updated_event.participants:
            participants_list.append({
                "id": participant.id,
                "user_id": participant.user_id,
                "status": participant.status,
                "created_at": participant.created_at.isoformat(),
                "user": {
                    "id": participant.user.id,
                    "username": participant.user.username,
                    "role": participant.user.role,
                    "is_active": participant.user.is_active
                }
            })
    
    # Сериализуем событие в правильный формат
    event_dict = {
        "id": updated_event.id,
        "title": updated_event.title,
        "description": updated_event.description,
        "start_date": updated_event.start_date.isoformat(),
        "end_date": updated_event.end_date.isoformat(),
        "event_type": updated_event.event_type,
        "is_public": updated_event.is_public,
        "location": updated_event.location,
        "max_participants": None,  # Поле не существует в модели
        "current_participants": len(updated_event.participants) if updated_event.participants else 0,
        "participants": participants_list,
        "created_at": updated_event.created_at.isoformat(),
        "updated_at": updated_event.updated_at.isoformat() if updated_event.updated_at else None
    }
    
    return event_dict


@router.delete("/{event_id}")
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление события (мягкое удаление)"""
    result = await db.execute(
        select(Event).where(and_(Event.id == event_id, Event.is_active == True))
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    
    # Проверяем права: только создатель или администратор могут удалять
    if event.organizer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Недостаточно прав для удаления")
    
    # Мягкое удаление
    event.is_active = False
    await db.commit()
    
    return {"message": "Событие успешно удалено"}
