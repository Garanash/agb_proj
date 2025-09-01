from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List
from datetime import datetime

from database import get_db
from models import (
    User, CustomerProfile, ContractorProfile, RepairRequest,
    ContractorResponse, UserRole, RequestStatus, ResponseStatus
)
from schemas import (
    RepairRequestCreate,
    RepairRequestUpdate,
    RepairRequest as RepairRequestSchema,
    ContractorResponseCreate,
    ContractorResponse as ContractorResponseSchema,
    ContractorResponseUpdate
)
from dependencies import get_current_user

# Импорт Telegram функций (будет добавлен позже)
try:
    from telegram_bot import notify_new_request
except ImportError:
    notify_new_request = None

router = APIRouter(prefix="/repair-requests", tags=["repair-requests"])


@router.post("/", response_model=RepairRequestSchema)
async def create_repair_request(
    request_data: RepairRequestCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать новую заявку на ремонт (только для заказчиков)"""

    if current_user.role != UserRole.CUSTOMER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только заказчики могут создавать заявки"
        )

    # Получаем профиль заказчика
    result = await db.execute(
        select(CustomerProfile).where(CustomerProfile.user_id == current_user.id)
    )
    customer_profile = result.scalars().first()

    if not customer_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль заказчика не найден"
        )

    # Создаем заявку
    new_request = RepairRequest(
        customer_id=customer_profile.id,
        title=request_data.title,
        description=request_data.description,
        urgency=request_data.urgency,
        preferred_date=request_data.preferred_date,
        address=request_data.address,
        city=request_data.city,
        region=request_data.region,
        status=RequestStatus.NEW
    )

    db.add(new_request)
    await db.commit()
    await db.refresh(new_request)

    # Отправляем уведомление в Telegram (в фоне)
    if notify_new_request:
        background_tasks.add_task(notify_new_request, new_request.id)

    return new_request


@router.get("/", response_model=List[RepairRequestSchema])
async def get_repair_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Получить список заявок"""

    if current_user.role == UserRole.CUSTOMER:
        # Заказчик видит только свои заявки
        result = await db.execute(
            select(CustomerProfile).where(CustomerProfile.user_id == current_user.id)
        )
        customer_profile = result.scalars().first()

        if customer_profile:
            query = select(RepairRequest).where(
                RepairRequest.customer_id == customer_profile.id
            )
        else:
            return []

    elif current_user.role == UserRole.CONTRACTOR:
        # Исполнители видят все заявки со статусом NEW или PROCESSING
        query = select(RepairRequest).where(
            RepairRequest.status.in_([RequestStatus.NEW, RequestStatus.PROCESSING])
        )

    elif current_user.role in [UserRole.SERVICE_ENGINEER, UserRole.ADMIN]:
        # Сервисные инженеры и админы видят все заявки
        query = select(RepairRequest)

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )

    query = query.offset(skip).limit(limit).order_by(RepairRequest.created_at.desc())
    result = await db.execute(query)
    requests = result.scalars().all()

    return requests


@router.get("/{request_id}", response_model=RepairRequestSchema)
async def get_repair_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить детали заявки"""

    result = await db.execute(select(RepairRequest).where(RepairRequest.id == request_id))
    request = result.scalars().first()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )

    # Проверяем права доступа
    if current_user.role == UserRole.CUSTOMER:
        # Заказчик может видеть только свои заявки
        result = await db.execute(
            select(CustomerProfile).where(CustomerProfile.user_id == current_user.id)
        )
        customer_profile = result.scalars().first()

        if not customer_profile or request.customer_id != customer_profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Доступ запрещен"
            )

    return request


@router.put("/{request_id}", response_model=RepairRequestSchema)
async def update_repair_request(
    request_id: int,
    request_update: RepairRequestUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить заявку"""

    result = await db.execute(select(RepairRequest).where(RepairRequest.id == request_id))
    request = result.scalars().first()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )

    # Проверяем права доступа
    can_update = False

    if current_user.role == UserRole.CUSTOMER:
        # Заказчик может обновлять только свои заявки со статусом NEW
        result = await db.execute(
            select(CustomerProfile).where(CustomerProfile.user_id == current_user.id)
        )
        customer_profile = result.scalars().first()

        if (customer_profile and
            request.customer_id == customer_profile.id and
            request.status == RequestStatus.NEW):
            can_update = True
            # Заказчик может обновлять только определенные поля
            allowed_fields = ['title', 'description', 'urgency', 'preferred_date',
                            'address', 'city', 'region']
            for field in request_update.dict(exclude_unset=True).keys():
                if field not in allowed_fields:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Поле '{field}' нельзя изменить"
                    )

    elif current_user.role in [UserRole.SERVICE_ENGINEER, UserRole.ADMIN]:
        # Сервисные инженеры и админы могут обновлять любые поля
        can_update = True

    if not can_update:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для изменения заявки"
        )

    # Обновляем поля
    for field, value in request_update.dict(exclude_unset=True).items():
        if hasattr(request, field):
            setattr(request, field, value)

    # Устанавливаем метку времени
    if 'status' in request_update.dict(exclude_unset=True):
        if request.status == RequestStatus.PROCESSING and not request.processed_at:
            request.processed_at = datetime.utcnow()
        elif request.status == RequestStatus.ASSIGNED and not request.assigned_at:
            request.assigned_at = datetime.utcnow()
        elif request.status == RequestStatus.COMPLETED and not request.completed_at:
            request.completed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(request)

    return request


@router.post("/{request_id}/respond", response_model=ContractorResponseSchema)
async def create_contractor_response(
    request_id: int,
    response_data: ContractorResponseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создать отклик исполнителя на заявку"""

    if current_user.role != UserRole.CONTRACTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Только исполнители могут откликаться на заявки"
        )

    # Проверяем, что заявка существует и доступна для откликов
    result = await db.execute(select(RepairRequest).where(RepairRequest.id == request_id))
    request = result.scalars().first()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )

    if request.status not in [RequestStatus.NEW, RequestStatus.PROCESSING]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="На эту заявку больше нельзя откликнуться"
        )

    # Проверяем, что у исполнителя есть профиль
    result = await db.execute(
        select(ContractorProfile).where(ContractorProfile.user_id == current_user.id)
    )
    contractor_profile = result.scalars().first()

    if not contractor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Профиль исполнителя не найден"
        )

    # Проверяем, что исполнитель еще не откликался на эту заявку
    result = await db.execute(
        select(ContractorResponse).where(
            ContractorResponse.request_id == request_id,
            ContractorResponse.contractor_id == contractor_profile.id
        )
    )
    existing_response = result.scalars().first()

    if existing_response:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже откликнулись на эту заявку"
        )

    # Создаем отклик
    new_response = ContractorResponse(
        request_id=request_id,
        contractor_id=contractor_profile.id,
        proposed_cost=response_data.proposed_cost,
        estimated_days=response_data.estimated_days,
        comment=response_data.comment,
        status=ResponseStatus.PENDING
    )

    db.add(new_response)
    await db.commit()
    await db.refresh(new_response)

    return new_response


@router.get("/{request_id}/responses", response_model=List[ContractorResponseSchema])
async def get_request_responses(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получить отклики на заявку"""

    result = await db.execute(select(RepairRequest).where(RepairRequest.id == request_id))
    request = result.scalars().first()

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заявка не найдена"
        )

    # Проверяем права доступа
    can_view = False

    if current_user.role == UserRole.CUSTOMER:
        # Заказчик может видеть отклики только на свои заявки
        result = await db.execute(
            select(CustomerProfile).where(CustomerProfile.user_id == current_user.id)
        )
        customer_profile = result.scalars().first()

        if customer_profile and request.customer_id == customer_profile.id:
            can_view = True

    elif current_user.role in [UserRole.SERVICE_ENGINEER, UserRole.ADMIN]:
        # Сервисные инженеры и админы могут видеть все отклики
        can_view = True

    if not can_view:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )

    result = await db.execute(
        select(ContractorResponse).where(ContractorResponse.request_id == request_id)
    )
    responses = result.scalars().all()

    return responses


@router.put("/responses/{response_id}", response_model=ContractorResponseSchema)
async def update_contractor_response(
    response_id: int,
    response_update: ContractorResponseUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновить статус отклика (для сервисных инженеров)"""

    if current_user.role not in [UserRole.SERVICE_ENGINEER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )

    result = await db.execute(select(ContractorResponse).where(ContractorResponse.id == response_id))
    response = result.scalars().first()

    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отклик не найден"
        )

    # Обновляем поля
    for field, value in response_update.dict(exclude_unset=True).items():
        if hasattr(response, field):
            setattr(response, field, value)

    # Устанавливаем время рассмотрения
    if response.status in [ResponseStatus.ACCEPTED, ResponseStatus.REJECTED] and not response.reviewed_at:
        response.reviewed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(response)

    return response
