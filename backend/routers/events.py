from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime, date
from typing import Optional

from database import get_db
from models import Event, User
from schemas import Event as EventSchema, EventCreate, EventUpdate
from routers.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=list[EventSchema])
async def get_events(
    start_date: Optional[date] = Query(None, description="Начальная дата фильтра"),
    end_date: Optional[date] = Query(None, description="Конечная дата фильтра"),
    event_type: Optional[str] = Query(None, description="Тип события"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка событий с фильтрацией"""
    query = select(Event).where(Event.is_active == True)
    
    if start_date:
        query = query.where(Event.start_datetime >= datetime.combine(start_date, datetime.min.time()))
    
    if end_date:
        query = query.where(Event.end_datetime <= datetime.combine(end_date, datetime.max.time()))
    
    if event_type:
        query = query.where(Event.event_type == event_type)
    
    query = query.order_by(Event.start_datetime)
    
    result = await db.execute(query)
    events = result.scalars().all()
    return events


@router.post("/", response_model=EventSchema)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание нового события"""
    # Проверяем корректность дат
    if event_data.end_datetime <= event_data.start_datetime:
        raise HTTPException(
            status_code=400, 
            detail="Дата окончания должна быть позже даты начала"
        )
    
    # Создаем событие
    db_event = Event(
        title=event_data.title,
        description=event_data.description,
        start_datetime=event_data.start_datetime,
        end_datetime=event_data.end_datetime,
        event_type=event_data.event_type,
        creator_id=current_user.id
    )
    
    db.add(db_event)
    await db.commit()
    await db.refresh(db_event)
    
    return db_event


@router.get("/{event_id}", response_model=EventSchema)
async def get_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение события по ID"""
    result = await db.execute(
        select(Event).where(and_(Event.id == event_id, Event.is_active == True))
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    
    return event


@router.put("/{event_id}", response_model=EventSchema)
async def update_event(
    event_id: int,
    event_data: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление события"""
    result = await db.execute(
        select(Event).where(and_(Event.id == event_id, Event.is_active == True))
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    
    # Проверяем права: только создатель или администратор могут редактировать
    if event.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав для редактирования")
    
    # Обновляем поля
    update_data = event_data.dict(exclude_unset=True)
    
    # Проверяем корректность дат если они обновляются
    start_dt = update_data.get('start_datetime', event.start_datetime)
    end_dt = update_data.get('end_datetime', event.end_datetime)
    
    if end_dt <= start_dt:
        raise HTTPException(
            status_code=400,
            detail="Дата окончания должна быть позже даты начала"
        )
    
    for field, value in update_data.items():
        setattr(event, field, value)
    
    await db.commit()
    await db.refresh(event)
    
    return event


@router.delete("/{event_id}")
async def delete_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление события (мягкое удаление)"""
    result = await db.execute(
        select(Event).where(and_(Event.id == event_id, Event.is_active == True))
    )
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Событие не найдено")
    
    # Проверяем права: только создатель или администратор могут удалять
    if event.creator_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Недостаточно прав для удаления")
    
    # Мягкое удаление
    event.is_active = False
    await db.commit()
    
    return {"message": "Событие успешно удалено"}
