from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional
from datetime import datetime
from sqlalchemy import func
import pandas as pd
from io import BytesIO
from pydantic import BaseModel
import asyncio
from asyncio import TimeoutError

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


class NomenclatureImportItem(BaseModel):
    code_1c: str
    name: str
    article: str
    matrix: str
    drilling_depth: Optional[str] = None
    height: Optional[str] = None
    thread: Optional[str] = None


class NomenclatureImportResult(BaseModel):
    success: bool
    message: str
    imported_count: int
    skipped_count: int
    errors: List[str] = []


async def retry_operation(operation, max_retries=3, delay=1.0, timeout=30.0):
    """Функция для повторных попыток выполнения операции с таймаутом"""
    for attempt in range(max_retries):
        try:
            return await asyncio.wait_for(operation(), timeout=timeout)
        except (TimeoutError, Exception) as e:
            if attempt == max_retries - 1:
                raise e
            print(f"Попытка {attempt + 1} не удалась: {e}. Повтор через {delay} сек.")
            await asyncio.sleep(delay)
            delay *= 2  # Экспоненциальная задержка


async def safe_db_operation(db_operation, max_retries=3):
    """Безопасное выполнение операции с базой данных"""
    return await retry_operation(db_operation, max_retries=max_retries)


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
    BATCH_SIZE = 20  # Уменьшаем размер батча для меньшей нагрузки
    MAX_TOTAL_ITEMS = 100  # Уменьшаем максимум для стабильности
    MAX_ITEMS_TYPES = 25  # Уменьшаем максимум типов позиций

    try:
        # Проверяем размер пакета
        total_items = sum(item.get('quantity', 1) for item in bulk_data.items)
        if total_items > MAX_TOTAL_ITEMS:
            raise HTTPException(
                status_code=400,
                detail=f"Слишком много паспортов для создания за раз. Максимум: {MAX_TOTAL_ITEMS}, запрошено: {total_items}"
            )

        # Проверяем, что общее количество не превышает разумные пределы
        if len(bulk_data.items) > MAX_ITEMS_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Слишком много разных позиций. Максимум: {MAX_ITEMS_TYPES}, запрошено: {len(bulk_data.items)}"
            )

        # Предварительная проверка всех позиций
        valid_items = []
        for item in bulk_data.items:
            code_1c = item.get('code_1c')
            quantity = item.get('quantity', 1)

            if not code_1c:
                errors.append(f"Отсутствует код 1С для позиции: {item}")
                continue

            if quantity > BATCH_SIZE:
                errors.append(f"Слишком большое количество для позиции {code_1c}: {quantity}. Максимум: {BATCH_SIZE}")
                continue

            valid_items.append((code_1c, quantity))

        if not valid_items:
            return PassportGenerationResult(
                success=False,
                message="Нет допустимых позиций для создания паспортов",
                errors=errors
            )

        # Обрабатываем позиции пакетами
        current_batch = []
        batch_count = 0
        total_processed = 0
        total_to_process = sum(quantity for _, quantity in valid_items)

        print(f"🚀 Начало создания {total_to_process} паспортов...")

        for idx, (code_1c, quantity) in enumerate(valid_items):
            try:
                # Получаем номенклатуру по коду 1С
                result = await db.execute(
                    select(VEDNomenclature).where(VEDNomenclature.code_1c == code_1c)
                )
                nomenclature = result.scalar_one_or_none()

                if not nomenclature:
                    errors.append(f"Номенклатура с кодом 1С {code_1c} не найдена")
                    continue

                # Создаем паспорт для каждого количества
                for i in range(quantity):
                    try:
                        # Генерируем номер паспорта с повторными попытками
                        async def generate_number():
                            return await VedPassport.generate_passport_number(
                                db=db,
                                matrix=nomenclature.matrix,
                                drilling_depth=nomenclature.drilling_depth
                            )

                        passport_number = await safe_db_operation(generate_number)

                        # Проверяем уникальность номера (дополнительная проверка)
                        async def check_unique():
                            result = await db.execute(
                                select(VedPassport).where(VedPassport.passport_number == passport_number)
                            )
                            return result.scalar_one_or_none() is None

                        if not await safe_db_operation(check_unique):
                            errors.append(f"Номер паспорта {passport_number} уже существует, генерируем новый")
                            continue

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

                        current_batch.append(new_passport)
                        batch_count += 1
                        total_processed += 1

                        # Коммитим пакетами для избежания перегрузки памяти
                        if batch_count >= BATCH_SIZE:
                            async def flush_batch():
                                for passport in current_batch:
                                    db.add(passport)
                                await db.flush()

                            await safe_db_operation(flush_batch)
                            created_passports.extend(current_batch)
                            current_batch = []
                            batch_count = 0

                            # Показываем прогресс
                            progress = (total_processed / total_to_process) * 100
                            print(".1f")

                    except Exception as e:
                        errors.append(f"Ошибка при создании паспорта {i+1} для {code_1c}: {str(e)}")
                        continue

            except Exception as e:
                errors.append(f"Ошибка при обработке позиции {code_1c}: {str(e)}")
                continue

        # Обрабатываем оставшиеся паспорта в батче
        if current_batch:
            async def flush_remaining_batch():
                for passport in current_batch:
                    db.add(passport)
                await db.flush()

            await safe_db_operation(flush_remaining_batch)
            created_passports.extend(current_batch)

        if created_passports:
            async def final_commit():
                await db.commit()

            await safe_db_operation(final_commit)

            # Получаем полные данные созданных паспортов пакетами
            full_passports = []
            for i in range(0, len(created_passports), 50):  # Получаем по 50 паспортов
                batch_ids = [p.id for p in created_passports[i:i+50]]

                async def get_batch_passports():
                    result = await db.execute(
                        select(VedPassport)
                        .options(joinedload(VedPassport.nomenclature))
                        .where(VedPassport.id.in_(batch_ids))
                    )
                    return result.scalars().all()

                batch_passports = await safe_db_operation(get_batch_passports)
                full_passports.extend(batch_passports)

            print(f"✅ Успешно создано {len(created_passports)} паспортов из {total_to_process}")

            return PassportGenerationResult(
                success=True,
                message=f"Создано {len(created_passports)} паспортов",
                passports=full_passports,
                errors=errors
            )
        else:
            async def rollback_db():
                await db.rollback()

            await safe_db_operation(rollback_db)
            print(f"❌ Не удалось создать ни одного паспорта. Всего ошибок: {len(errors)}")

            return PassportGenerationResult(
                success=False,
                message="Не удалось создать ни одного паспорта",
                errors=errors
            )

    except HTTPException:
        raise
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


@router.delete("/nomenclature/{nomenclature_id}")
async def delete_nomenclature(
    nomenclature_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление номенклатуры ВЭД"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    try:
        # Получаем номенклатуру
        result = await db.execute(
            select(VEDNomenclature).where(VEDNomenclature.id == nomenclature_id)
        )
        nomenclature = result.scalar_one_or_none()

        if not nomenclature:
            raise HTTPException(status_code=404, detail="Номенклатура не найдена")

        # Проверяем, есть ли связанные паспорта
        passports_result = await db.execute(
            select(VedPassport).where(VedPassport.nomenclature_id == nomenclature_id)
        )
        related_passports = passports_result.scalars().all()

        # Удаляем связанные паспорта
        for passport in related_passports:
            await db.delete(passport)

        # Удаляем номенклатуру
        await db.delete(nomenclature)

        # Сохраняем изменения
        await db.commit()

        return {
            "message": f"Номенклатура {nomenclature.code_1c} и {len(related_passports)} связанных паспортов удалены",
            "deleted_passports": len(related_passports)
        }

    except Exception as e:
        await db.rollback()
        print(f"Ошибка при удалении номенклатуры: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении: {str(e)}")


@router.post("/nomenclature/import/", response_model=NomenclatureImportResult)
async def import_nomenclature(
    items: List[NomenclatureImportItem],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Импорт номенклатуры ВЭД из списка"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    imported_count = 0
    skipped_count = 0
    errors = []

    try:
        for item in items:
            try:
                # Проверяем, существует ли уже такая номенклатура
                existing = await db.execute(
                    select(VEDNomenclature).where(VEDNomenclature.code_1c == item.code_1c)
                )
                existing_item = existing.scalar_one_or_none()

                if existing_item:
                    # Обновляем существующую номенклатуру
                    existing_item.name = item.name
                    existing_item.article = item.article
                    existing_item.matrix = item.matrix
                    existing_item.drilling_depth = item.drilling_depth
                    existing_item.height = item.height
                    existing_item.thread = item.thread
                    existing_item.is_active = True
                    skipped_count += 1
                else:
                    # Определяем тип продукта на основе наименования
                    product_type = "коронка"  # по умолчанию
                    if "расширитель" in item.name.lower():
                        product_type = "расширитель"
                    elif "башмак" in item.name.lower():
                        product_type = "башмак"

                    # Создаем новую номенклатуру
                    new_item = VEDNomenclature(
                        code_1c=item.code_1c,
                        name=item.name,
                        article=item.article,
                        matrix=item.matrix,
                        drilling_depth=item.drilling_depth,
                        height=item.height,
                        thread=item.thread,
                        product_type=product_type,
                        is_active=True
                    )
                    db.add(new_item)
                    imported_count += 1

            except Exception as e:
                errors.append(f"Ошибка при импорте {item.code_1c}: {str(e)}")
                continue

        if imported_count > 0 or skipped_count > 0:
            await db.commit()

            message = f"Импорт завершен: добавлено {imported_count}, обновлено {skipped_count}"
            if errors:
                message += f", ошибок: {len(errors)}"

            return NomenclatureImportResult(
                success=True,
                message=message,
                imported_count=imported_count,
                skipped_count=skipped_count,
                errors=errors
            )
        else:
            return NomenclatureImportResult(
                success=False,
                message="Не удалось импортировать ни одной позиции",
                imported_count=0,
                skipped_count=0,
                errors=errors
            )

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при импорте: {str(e)}")


@router.get("/export/excel")
async def export_passports_to_excel(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    matrix: Optional[str] = None,
    drilling_depth: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Экспорт паспортов ВЭД в Excel"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    try:
        # Формируем запрос с фильтрами
        query = select(VedPassport).options(
            joinedload(VedPassport.nomenclature),
            joinedload(VedPassport.creator)
        )

        if start_date:
            query = query.where(VedPassport.created_at >= start_date)
        if end_date:
            query = query.where(VedPassport.created_at <= end_date)
        if matrix:
            query = query.where(VEDNomenclature.matrix == matrix)
        if drilling_depth:
            query = query.where(VEDNomenclature.drilling_depth == drilling_depth)

        result = await db.execute(query)
        passports = result.scalars().all()

        # Создаем DataFrame для экспорта
        data = []
        for passport in passports:
            data.append({
                'Номер паспорта': passport.passport_number,
                'Заголовок': passport.title,
                'Номер заказа': passport.order_number or '',
                'Матрица': passport.nomenclature.matrix if passport.nomenclature else '',
                'Глубина бурения': passport.nomenclature.drilling_depth if passport.nomenclature else '',
                'Название': passport.nomenclature.name if passport.nomenclature else '',
                'Количество': passport.quantity,
                'Статус': passport.status,
                'Дата создания': passport.created_at.strftime('%d.%m.%Y %H:%M') if passport.created_at else '',
                'Создал': f"{passport.creator.last_name} {passport.creator.first_name}" if passport.creator else ''
            })

        df = pd.DataFrame(data)

        # Создаем Excel файл в памяти
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Паспорта ВЭД', index=False)

            # Настраиваем ширину колонок
            worksheet = writer.sheets['Паспорта ВЭД']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = (max_length + 2)
                worksheet.column_dimensions[column_letter].width = min(adjusted_width, 50)

        output.seek(0)

        # Возвращаем файл
        return Response(
            content=output.getvalue(),
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': f'attachment; filename=ved_passports_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
            }
        )

    except Exception as e:
        print(f"Ошибка при экспорте в Excel: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при экспорте: {str(e)}")


@router.get("/nomenclature/export/excel")
async def export_nomenclature_to_excel(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Экспорт номенклатуры ВЭД в Excel"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    try:
        # Получаем всю активную номенклатуру
        result = await db.execute(
            select(VEDNomenclature).where(VEDNomenclature.is_active == True)
        )
        nomenclature = result.scalars().all()

        # Создаем DataFrame для экспорта
        data = []
        for item in nomenclature:
            data.append({
                'Код 1С': item.code_1c,
                'Название': item.name,
                'Матрица': item.matrix,
                'Глубина бурения': item.drilling_depth or '',
                'Диаметр': item.diameter or '',
                'Длина': item.length or '',
                'Описание': item.description or '',
                'Активен': 'Да' if item.is_active else 'Нет',
                'Дата создания': item.created_at.strftime('%d.%m.%Y %H:%M') if item.created_at else ''
            })

        df = pd.DataFrame(data)

        # Создаем Excel файл в памяти
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Номенклатура ВЭД', index=False)

            # Настраиваем ширину колонок
            worksheet = writer.sheets['Номенклатура ВЭД']
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = (max_length + 2)
                worksheet.column_dimensions[column_letter].width = min(adjusted_width, 50)

        output.seek(0)

        # Возвращаем файл
        return Response(
            content=output.getvalue(),
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': f'attachment; filename=ved_nomenclature_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
            }
        )

    except Exception as e:
        print(f"Ошибка при экспорте номенклатуры в Excel: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при экспорте: {str(e)}")
