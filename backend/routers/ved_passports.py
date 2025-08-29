from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func

from database import get_db
from models import User, UserRole, VEDNomenclature, VedPassport
from schemas import (
    VEDNomenclature as VEDNomenclatureSchema, 
    VedPassport as VedPassportSchema,
    VedPassportCreate,
    VedPassportUpdate,
    BulkPassportCreate,
    PassportGenerationResult
)
from routers.auth import get_current_user

router = APIRouter()


@router.get("/nomenclature/", response_model=List[VEDNomenclatureSchema])
async def get_ved_nomenclature(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка номенклатуры для паспортов ВЭД"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(
        select(VEDNomenclature).where(VEDNomenclature.is_active == True)
    )
    nomenclature = result.scalars().all()
    return nomenclature


@router.get("/nomenclature/{code_1c}", response_model=VEDNomenclatureSchema)
async def get_ved_nomenclature_by_code(
    code_1c: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение номенклатуры по коду 1С"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(
        select(VEDNomenclature).where(VEDNomenclature.code_1c == code_1c)
    )
    nomenclature = result.scalar_one_or_none()
    
    if not nomenclature:
        raise HTTPException(status_code=404, detail="Номенклатура не найдена")
    
    return nomenclature


@router.get("/", response_model=List[VedPassportSchema])
async def get_ved_passports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка паспортов ВЭД"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        result = await db.execute(
            select(VedPassport)
            .options(joinedload(VedPassport.nomenclature))
            .where(VedPassport.created_by == current_user.id)
            .order_by(VedPassport.created_at.desc())
        )
        passports = result.scalars().all()
        return passports
        
    except Exception as e:
        print(f"Ошибка при получении паспортов: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.post("/", response_model=VedPassportSchema)
async def create_ved_passport(
    passport_data: VedPassportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание нового паспорта ВЭД"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Получаем номенклатуру
        result = await db.execute(
            select(VEDNomenclature).where(VEDNomenclature.id == passport_data.nomenclature_id)
        )
        nomenclature = result.scalar_one_or_none()
        
        if not nomenclature:
            raise HTTPException(status_code=404, detail="Номенклатура не найдена")
        
        # Генерируем номер паспорта
        passport_number = await VedPassport.generate_passport_number(
            db=db,
            matrix=nomenclature.matrix,
            drilling_depth=nomenclature.drilling_depth
        )

        print(f"DEBUG: Created passport with number: {passport_number}")

        # Генерируем заголовок на основе номенклатуры, если не передан
        title = passport_data.title
        if not title:
            title = f"Паспорт ВЭД {nomenclature.name} {nomenclature.matrix}"
            if nomenclature.drilling_depth:
                title += f" {nomenclature.drilling_depth}"

        # Создаем паспорт
        new_passport = VedPassport(
            passport_number=passport_number,
            title=title,
            order_number=passport_data.order_number,
            nomenclature_id=passport_data.nomenclature_id,
            quantity=passport_data.quantity,
            created_by=current_user.id
        )
        
        db.add(new_passport)
        await db.commit()
        await db.refresh(new_passport)
        
        # Получаем полные данные паспорта с номенклатурой
        result = await db.execute(
            select(VedPassport)
            .options(joinedload(VedPassport.nomenclature))
            .where(VedPassport.id == new_passport.id)
        )
        full_passport = result.scalar_one_or_none()
        
        if not full_passport:
            raise HTTPException(status_code=500, detail="Ошибка при получении созданного паспорта")
        
        return full_passport
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Ошибка при создании паспорта: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.post("/bulk/", response_model=PassportGenerationResult)
async def create_bulk_passports(
    bulk_data: BulkPassportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание нескольких паспортов ВЭД из списка позиций"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    created_passports = []
    errors = []
    
    try:
        for item in bulk_data.items:
            try:
                code_1c = item.get('code_1c')
                quantity = item.get('quantity', 1)
                
                if not code_1c:
                    errors.append(f"Отсутствует код 1С для позиции: {item}")
                    continue
                
                # Получаем номенклатуру по коду 1С
                result = await db.execute(
                    select(VEDNomenclature).where(VEDNomenclature.code_1c == code_1c)
                )
                nomenclature = result.scalar_one_or_none()
                
                if not nomenclature:
                    errors.append(f"Номенклатура с кодом 1С {code_1c} не найдена")
                    continue
                
                # Создаем паспорт для каждого количества
                for _ in range(quantity):
                    passport_number = await VedPassport.generate_passport_number(
                        db=db,
                        matrix=nomenclature.matrix,
                        drilling_depth=nomenclature.drilling_depth
                    )

                    print(f"DEBUG: Created bulk passport with number: {passport_number}")

                    # Генерируем заголовок на основе номенклатуры, если не передан
                    title = bulk_data.title
                    if not title:
                        title = f"Паспорт ВЭД {nomenclature.name} {nomenclature.matrix}"
                        if nomenclature.drilling_depth:
                            title += f" {nomenclature.drilling_depth}"

                    new_passport = VedPassport(
                        passport_number=passport_number,
                        title=title,
                        order_number=bulk_data.order_number,
                        nomenclature_id=nomenclature.id,
                        quantity=1,
                        created_by=current_user.id
                    )
                    
                    db.add(new_passport)
                    created_passports.append(new_passport)
                
            except Exception as e:
                errors.append(f"Ошибка при создании паспорта для {item}: {str(e)}")
                continue
        
        if created_passports:
            await db.commit()
            
            # Получаем полные данные созданных паспортов
            passport_ids = [p.id for p in created_passports]
            result = await db.execute(
                select(VedPassport)
                .options(joinedload(VedPassport.nomenclature))
                .where(VedPassport.id.in_(passport_ids))
            )
            full_passports = result.scalars().all()
            
            return PassportGenerationResult(
                success=True,
                message=f"Создано {len(created_passports)} паспортов",
                passports=full_passports,
                errors=errors
            )
        else:
            return PassportGenerationResult(
                success=False,
                message="Не удалось создать ни одного паспорта",
                errors=errors
            )
            
    except Exception as e:
        await db.rollback()
        print(f"Ошибка при массовом создании паспортов: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.get("/{passport_id}", response_model=VedPassportSchema)
async def get_ved_passport(
    passport_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение конкретного паспорта ВЭД по ID"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        result = await db.execute(
            select(VedPassport)
            .options(joinedload(VedPassport.nomenclature))
            .where(VedPassport.id == passport_id)
        )
        passport = result.scalar_one_or_none()
        
        if not passport:
            raise HTTPException(status_code=404, detail="Паспорт не найден")
        
        if passport.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Доступ запрещен")
        
        return passport
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при получении паспорта: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.put("/{passport_id}", response_model=VedPassportSchema)
async def update_ved_passport(
    passport_id: int,
    passport_data: VedPassportUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление паспорта ВЭД"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        result = await db.execute(
            select(VedPassport).where(VedPassport.id == passport_id)
        )
        passport = result.scalar_one_or_none()
        
        if not passport:
            raise HTTPException(status_code=404, detail="Паспорт не найден")
        
        if passport.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Доступ запрещен")
        
        # Обновляем поля
        for field, value in passport_data.dict(exclude_unset=True).items():
            setattr(passport, field, value)
        
        passport.updated_at = datetime.now()
        
        await db.commit()
        await db.refresh(passport)
        
        # Получаем полные данные
        result = await db.execute(
            select(VedPassport)
            .options(joinedload(VedPassport.nomenclature))
            .where(VedPassport.id == passport_id)
        )
        full_passport = result.scalar_one_or_none()
        
        if not full_passport:
            raise HTTPException(status_code=500, detail="Ошибка при получении обновленного паспорта")
        
        return full_passport
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Ошибка при обновлении паспорта: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.delete("/{passport_id}", response_model=dict)
async def delete_ved_passport(
    passport_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление паспорта ВЭД"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        result = await db.execute(
            select(VedPassport).where(VedPassport.id == passport_id)
        )
        passport = result.scalar_one_or_none()
        
        if not passport:
            raise HTTPException(status_code=404, detail="Паспорт не найден")
        
        if passport.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Доступ запрещен")
        
        await db.delete(passport)
        await db.commit()
        
        return {
            "id": passport_id,
            "message": "Паспорт ВЭД успешно удален",
            "deletedBy": current_user.username,
            "deletedAt": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        print(f"Ошибка при удалении паспорта: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.get("/archive/", response_model=List[VedPassportSchema])
async def get_ved_passports_archive(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    search: Optional[str] = None,
    product_type: Optional[str] = None,
    matrix: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    order_number: Optional[str] = None,
    code_1c: Optional[str] = None
):
    """Получение архива паспортов ВЭД с расширенной фильтрацией"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Базовый запрос
        query = select(VedPassport).options(joinedload(VedPassport.nomenclature))
        
        # Фильтры
        filters = [VedPassport.created_by == current_user.id]
        
        # Поиск по тексту (номер паспорта, номер заказа)
        if search:
            search_filter = (
                VedPassport.passport_number.ilike(f"%{search}%") |
                VedPassport.order_number.ilike(f"%{search}%")
            )
            filters.append(search_filter)
        
        # Фильтр по типу продукта
        if product_type:
            filters.append(VEDNomenclature.product_type == product_type)
        
        # Фильтр по матрице
        if matrix:
            filters.append(VEDNomenclature.matrix == matrix)
        
        # Фильтр по статусу
        if status:
            filters.append(VedPassport.status == status)
        
        # Фильтр по дате создания (от)
        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                filters.append(VedPassport.created_at >= from_date)
            except ValueError:
                pass
        
        # Фильтр по дате создания (до)
        if date_to:
            try:
                to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                filters.append(VedPassport.created_at <= to_date)
            except ValueError:
                pass
        
        # Фильтр по номеру заказа
        if order_number:
            filters.append(VedPassport.order_number.ilike(f"%{order_number}%"))
        
        # Фильтр по коду 1С
        if code_1c:
            filters.append(VEDNomenclature.code_1c.ilike(f"%{code_1c}%"))
        
        # Применяем фильтры
        if len(filters) > 1:
            query = query.where(*filters)
        elif len(filters) == 1:
            query = query.where(filters[0])
        
        # Сортировка
        query = query.order_by(VedPassport.created_at.desc())
        
        result = await db.execute(query)
        passports = result.scalars().all()
        return passports
        
    except Exception as e:
        print(f"Ошибка при получении архива паспортов: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.get("/archive/stats", response_model=dict)
async def get_archive_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение статистики архива паспортов"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Общее количество паспортов
        total_result = await db.execute(
            select(VedPassport).where(VedPassport.created_by == current_user.id)
        )
        total_passports = len(total_result.scalars().all())
        
        # Количество по статусам
        status_result = await db.execute(
            select(VedPassport.status, func.count(VedPassport.id))
            .where(VedPassport.created_by == current_user.id)
            .group_by(VedPassport.status)
        )
        status_counts = dict(status_result.fetchall())
        
        # Количество по типам продуктов
        product_type_result = await db.execute(
            select(VEDNomenclature.product_type, func.count(VedPassport.id))
            .join(VedPassport, VedPassport.nomenclature_id == VEDNomenclature.id)
            .where(VedPassport.created_by == current_user.id)
            .group_by(VEDNomenclature.product_type)
        )
        product_type_counts = dict(product_type_result.fetchall())
        
        # Количество по матрицам
        matrix_result = await db.execute(
            select(VEDNomenclature.matrix, func.count(VedPassport.id))
            .join(VedPassport, VedPassport.nomenclature_id == VEDNomenclature.id)
            .where(VedPassport.created_by == current_user.id)
            .group_by(VEDNomenclature.matrix)
        )
        matrix_counts = dict(matrix_result.fetchall())
        
        # Последние созданные паспорты
        recent_result = await db.execute(
            select(VedPassport)
            .options(joinedload(VedPassport.nomenclature))
            .where(VedPassport.created_by == current_user.id)
            .order_by(VedPassport.created_at.desc())
            .limit(5)
        )
        recent_passports = recent_result.scalars().all()
        
        return {
            "total_passports": total_passports,
            "status_counts": status_counts,
            "product_type_counts": product_type_counts,
            "matrix_counts": matrix_counts,
            "recent_passports": [
                {
                    "id": p.id,
                    "passport_number": p.passport_number,
                    "order_number": p.order_number,
                    "created_at": p.created_at.isoformat(),
                    "nomenclature": {
                        "name": p.nomenclature.name,
                        "code_1c": p.nomenclature.code_1c
                    }
                }
                for p in recent_passports
            ]
        }
        
    except Exception as e:
        print(f"Ошибка при получении статистики: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.get("/archive/filters", response_model=dict)
async def get_archive_filters(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение доступных фильтров для архива"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Получаем уникальные типы продуктов
        product_types_result = await db.execute(
            select(VEDNomenclature.product_type)
            .distinct()
            .where(VEDNomenclature.is_active == True)
        )
        product_types = [row[0] for row in product_types_result.fetchall()]
        
        # Получаем уникальные матрицы
        matrices_result = await db.execute(
            select(VEDNomenclature.matrix)
            .distinct()
            .where(VEDNomenclature.is_active == True)
        )
        matrices = [row[0] for row in matrices_result.fetchall()]
        
        # Получаем уникальные статусы
        statuses_result = await db.execute(
            select(VedPassport.status)
            .distinct()
            .where(VedPassport.created_by == current_user.id)
        )
        statuses = [row[0] for row in statuses_result.fetchall()]
        
        return {
            "product_types": product_types,
            "matrices": matrices,
            "statuses": statuses
        }
        
    except Exception as e:
        print(f"Ошибка при получении фильтров: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")
