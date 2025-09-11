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
from utils.pdf_generator import generate_passport_pdf, generate_bulk_passports_pdf


class BulkExportRequest(BaseModel):
    passport_ids: List[int]
import xlsxwriter
import io
from PIL import Image as PILImage

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
            drilling_depth=nomenclature.drilling_depth,
            product_type=nomenclature.product_type
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
    BATCH_SIZE = 100  # Размер пакета для обработки
    MAX_TOTAL_ITEMS = 1000  # Максимальное количество паспортов
    MAX_ITEMS_TYPES = 200  # Максимальное количество типов позиций

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
        print(f"📋 Валидные позиции: {len(valid_items)}")

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
                                drilling_depth=nomenclature.drilling_depth,
                                product_type=nomenclature.product_type
                            )

                        # Генерируем номер паспорта с новым алгоритмом
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

                        print(f"📄 Создан паспорт {passport_number} для {code_1c} (батч: {batch_count}/{BATCH_SIZE})")

                        # Коммитим пакетами для избежания перегрузки памяти
                        if batch_count >= BATCH_SIZE:
                            async def flush_batch():
                                for passport in current_batch:
                                    db.add(passport)
                                await db.flush()
                                print(f"💾 Сохранен батч из {len(current_batch)} паспортов")

                            await safe_db_operation(flush_batch)
                            created_passports.extend(current_batch)
                            current_batch = []
                            batch_count = 0

                            # Показываем прогресс
                            progress = (total_processed / total_to_process) * 100
                            print(f"📊 Прогресс: {progress:.1f}% ({total_processed}/{total_to_process})")

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
                print(f"💾 Сохранен последний батч из {len(current_batch)} паспортов")

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
            print(f"📊 Финальный результат: {len(full_passports)} паспортов в ответе")

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
        
        # Поиск по тексту (точное совпадение)
        if search:
            search_term = search.strip()
            search_filter = (
                (VedPassport.passport_number == search_term) |
                (VedPassport.order_number == search_term) |
                (VEDNomenclature.code_1c == search_term) |
                (VEDNomenclature.article == search_term) |
                (VEDNomenclature.name == search_term) |
                (VEDNomenclature.matrix == search_term)
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
            filters.append(VedPassport.order_number == order_number.strip())

        # Фильтр по коду 1С
        if code_1c:
            filters.append(VEDNomenclature.code_1c == code_1c.strip())
        
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


def create_logo_image():
    """Создает изображение логотипа из SVG"""
    # SVG логотип ООО "Алмазгеобур"
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 250 73">
  <path d="M71.47 28.055C69.795 28.415 68.085 27.455 67.545 25.79C67.005 24.125 67.82 22.345 69.385 21.655C67.595 17.525 65.03 13.73 61.75 10.45C61.21 9.91 60.66 9.395 60.095 8.895C58.95 10.155 57.015 10.38 55.605 9.35499C54.19 8.325 53.805 6.405 54.665 4.92C50.11 2.2 45.005 0.524995 39.65 0.0149951C39.485 1.73 38.04 3.075 36.28 3.075C34.515 3.075 33.065 1.725 32.91 -0.00500488C27.545 0.474995 22.425 2.12499 17.845 4.825C18.78 6.31999 18.415 8.29999 16.965 9.35499C15.515 10.41 13.51 10.14 12.38 8.77999C11.77 9.31499 11.175 9.87 10.595 10.45C7.34 13.705 4.78 17.475 2.995 21.575C4.685 22.205 5.59 24.06 5.025 25.79C4.46 27.525 2.63 28.49 0.89 28C0.3 30.605 0 33.295 0 36.03C0 38.71 0.29 41.35 0.855 43.905C2.605 43.39 4.455 44.36 5.025 46.105C5.595 47.855 4.66 49.73 2.93 50.34C4.72 54.495 7.3 58.315 10.59 61.61C11.145 62.165 11.715 62.695 12.3 63.21C13.415 61.77 15.48 61.465 16.96 62.54C18.445 63.62 18.79 65.68 17.76 67.185C22.355 69.91 27.505 71.575 32.9 72.055C32.975 70.255 34.46 68.815 36.28 68.815C38.095 68.815 39.575 70.24 39.66 72.035C45.04 71.525 50.165 69.835 54.74 67.09C53.785 65.595 54.15 63.595 55.605 62.54C57.05 61.49 59.04 61.75 60.175 63.095C60.715 62.615 61.24 62.125 61.755 61.61C65.07 58.295 67.66 54.45 69.45 50.27C67.845 49.595 67 47.795 67.55 46.11C68.095 44.435 69.825 43.475 71.51 43.855C72.065 41.315 72.355 38.695 72.355 36.035C72.35 33.31 72.05 30.64 71.47 28.055ZM36.175 4.67C50.315 4.67 62.3 14.08 66.2 26.97C63.36 23.305 60.325 19.315 56.945 14.795C56.445 14.13 55.88 13.865 54.925 13.865C54.915 13.865 54.91 13.865 54.9 13.865C50.255 13.885 45.535 13.885 40.965 13.88C39.38 13.88 37.795 13.88 36.205 13.88C36.175 13.88 36.145 13.88 36.115 13.875C34.545 13.875 32.97 13.875 31.4 13.88C26.85 13.885 22.14 13.89 17.51 13.86C17.495 13.86 17.485 13.86 17.47 13.86C16.435 13.86 15.855 14.125 15.33 14.83C12.64 18.435 9.46 22.67 6.17 26.905C10.095 14.045 22.06 4.67 36.175 4.67ZM36.3 59.245C36.255 59.245 36.21 59.24 36.16 59.23L35.83 59.16C35.575 59.11 35.37 58.915 35.305 58.665L27.76 30.675C27.705 30.47 27.75 30.245 27.88 30.075C28.01 29.905 28.21 29.805 28.425 29.805H43.845C44.06 29.805 44.26 29.905 44.39 30.075C44.52 30.245 44.565 30.465 44.51 30.675L36.965 58.735C36.88 59.04 36.605 59.245 36.3 59.245ZM52.83 17.155L46.405 25.97C46.275 26.15 46.07 26.255 45.85 26.255C45.63 26.255 45.425 26.15 45.295 25.975L38.845 17.155C38.69 16.945 38.67 16.67 38.785 16.435C38.9 16.205 39.14 16.06 39.4 16.06H52.27C52.53 16.06 52.765 16.205 52.885 16.435C53.005 16.67 52.98 16.945 52.83 17.155ZM55.18 17.56C55.31 17.385 55.515 17.275 55.735 17.275C55.955 17.275 56.16 17.38 56.29 17.555L62.78 26.4C62.935 26.61 62.955 26.885 62.84 27.12C62.725 27.35 62.485 27.495 62.225 27.495H49.29C49.03 27.495 48.795 27.35 48.675 27.12C48.555 26.89 48.58 26.61 48.73 26.4L55.18 17.56ZM42.9 26.325C43.055 26.535 43.075 26.81 42.96 27.045C42.845 27.275 42.605 27.42 42.345 27.42H29.515C29.255 27.42 29.02 27.275 28.9 27.045C28.785 26.815 28.805 26.535 28.96 26.325L35.385 17.555C35.515 17.38 35.72 17.275 35.94 17.275C36.155 17.28 36.365 17.38 36.495 17.555L42.9 26.325ZM33.015 17.155L26.81 25.66C26.68 25.835 26.475 25.94 26.255 25.945C26.035 25.945 25.83 25.84 25.7 25.665L19.475 17.155C19.32 16.945 19.3 16.67 19.415 16.435C19.53 16.205 19.77 16.06 20.03 16.06H32.46C32.72 16.06 32.955 16.205 33.075 16.435C33.19 16.665 33.17 16.945 33.015 17.155ZM23.605 26.415C23.76 26.625 23.78 26.9 23.665 27.135C23.55 27.365 23.31 27.51 23.05 27.51H10.1C9.84 27.51 9.605 27.365 9.485 27.135C9.365 26.905 9.39 26.625 9.54 26.415L16 17.555C16.13 17.375 16.335 17.27 16.555 17.27C16.775 17.27 16.98 17.375 17.11 17.55L23.605 26.415ZM9.875 29.655C10.94 29.655 11.98 29.655 13.005 29.65C16.805 29.645 20.395 29.64 23.985 29.71C24.84 29.725 25.575 30.855 25.745 31.48C27.325 37.195 28.885 43.015 30.395 48.645C30.76 50.005 31.125 51.365 31.49 52.725C31.995 54.595 32.515 56.53 32.76 58.6C32.795 58.905 32.625 59.2 32.34 59.32C32.255 59.355 32.165 59.37 32.075 59.37C31.87 59.37 31.665 59.275 31.535 59.105L9.335 30.77C9.17 30.56 9.145 30.28 9.26 30.045C9.37 29.805 9.615 29.655 9.875 29.655ZM39.26 58.35L40.79 52.68C42.08 47.885 43.375 43.09 44.665 38.295C44.845 37.62 45.025 36.94 45.205 36.265C45.64 34.615 46.085 32.91 46.59 31.245C46.775 30.625 47.56 29.715 48.355 29.705C51.94 29.645 55.525 29.65 59.32 29.655C60.34 29.655 61.38 29.655 62.44 29.655C62.705 29.655 62.945 29.805 63.06 30.04C63.175 30.275 63.145 30.56 62.985 30.765L40.77 59.125C40.635 59.295 40.435 59.39 40.225 59.39C40.105 59.39 39.98 59.355 39.87 59.29L39.575 59.11C39.305 58.96 39.18 58.65 39.26 58.35ZM4.815 36.03C4.815 33.735 5.065 31.495 5.535 29.34C5.635 29.53 5.77 29.725 5.945 29.94C8.405 33.015 10.865 36.17 13.245 39.22C14.22 40.47 15.195 41.715 16.17 42.965L20.115 48.005C24.9 54.11 29.845 60.425 34.72 66.63C34.965 66.945 35.195 67.195 35.405 67.385C18.465 66.965 4.815 53.06 4.815 36.03ZM36.96 67.375C37.09 67.25 37.22 67.1 37.365 66.915C40.095 63.43 42.825 59.945 45.55 56.46C52.41 47.7 59.5 38.64 66.495 29.745C66.62 29.585 66.72 29.44 66.8 29.3C67.275 31.47 67.53 33.72 67.53 36.03C67.535 53.055 53.89 66.96 36.96 67.375Z" fill="#424242"/>
  <path d="M83.94 23.17L78.31 48.88H81.985L83.205 43.375H87.9L89.12 48.88H92.78L87.17 23.17H83.94ZM83.56 40.115L85.48 30.345L87.45 40.115H83.56ZM121.02 37.355H120.875L115.82 23.175H112.145V48.885H115.82V32.8H116L119.855 44.4H121.81L125.665 32.8H125.845V48.88H129.52V23.17H125.845L121.02 37.355ZM137.695 23.17L132.065 48.88H135.74L136.96 43.375H141.655L142.875 48.88H146.535L140.925 23.17H137.695ZM137.315 40.115L139.235 30.345L141.205 40.115H137.315ZM157.47 23.98C156.43 23.205 155.02 22.815 153.24 22.815C151.59 22.815 150.235 23.235 149.17 24.07C147.865 25.075 147.215 26.445 147.215 28.175V30.49H150.89V28.95C150.89 28.135 151.125 27.51 151.59 27.065C152.02 26.635 152.58 26.42 153.275 26.42C154.03 26.42 154.63 26.6 155.085 26.96C155.575 27.38 155.82 28.065 155.82 29.02V30.67C155.82 31.675 155.585 32.435 155.120 32.945C154.57 33.53 153.785 33.825 152.77 33.825H151.765V37.14H152.875C153.745 37.14 154.395 37.32 154.81 37.68C155.48 38.22 155.815 39.2 155.815 40.62V42.895C155.815 43.255 155.81 43.525 155.795 43.71C155.785 43.895 155.725 44.125 155.615 44.4C155.505 44.675 155.350 44.91 155.15 45.1C154.78 45.47 154.195 45.655 153.395 45.655C152.52 45.655 151.885 45.435 151.475 44.99C151.295 44.785 151.15 44.515 151.045 44.175C150.94 43.835 150.885 43.52 150.885 43.235V41.765H147.21V44.15C147.21 44.81 147.335 45.44 147.585 46.04C147.835 46.645 148.06 47.06 148.255 47.295C148.45 47.53 148.635 47.715 148.8 47.86C149.805 48.78 151.255 49.24 153.155 49.24C155.21 49.24 156.775 48.745 157.85 47.75C158.495 47.15 158.925 46.505 159.14 45.805C159.355 45.105 159.465 44.32 159.465 43.445V40.435C159.465 39.025 159.225 37.925 158.75 37.135C158.415 36.525 157.8 35.99 156.905 35.52C157.42 35.235 157.91 34.84 158.375 34.335C158.83 33.785 159.125 33.195 159.265 32.57C159.4 31.940 159.47 31.2 159.47 30.34V28.17C159.475 26.36 158.805 24.96 157.47 23.98ZM163.51 48.88H167.185V26.67H174.66V23.175H163.51V48.88ZM180.365 37.535H186.75V34.235H180.365V26.67H187.59V23.175H176.69V48.885H187.7V45.39H180.365V37.535ZM201.755 24.465C200.585 23.365 199.075 22.815 197.235 22.815C195.395 22.815 193.89 23.365 192.715 24.465C192.165 24.98 191.74 25.56 191.44 26.215C191.14 26.865 190.96 27.455 190.895 27.98C190.83 28.505 190.795 29.155 190.795 29.935V42.125C190.795 42.9 190.83 43.555 190.895 44.08C190.96 44.605 191.145 45.195 191.44 45.845C191.74 46.495 192.165 47.08 192.715 47.595C193.885 48.695 195.39 49.245 197.235 49.245C199.075 49.245 200.58 48.695 201.755 47.595C202.545 46.855 203.06 46.06 203.295 45.21C203.535 44.36 203.655 43.335 203.655 42.125V29.93C203.655 28.725 203.535 27.695 203.295 26.845C203.055 26 202.54 25.205 201.755 24.465ZM199.98 42.68C199.98 43.66 199.725 44.405 199.21 44.92C198.72 45.41 198.065 45.655 197.24 45.655C196.405 45.655 195.74 45.41 195.25 44.92C194.735 44.405 194.48 43.66 194.48 42.68V29.395C194.48 28.415 194.735 27.67 195.25 27.155C195.74 26.665 196.405 26.42 197.24 26.42C198.065 26.42 198.72 26.665 199.21 27.155C199.725 27.67 199.98 28.415 199.98 29.395V42.68ZM219.37 36.62C219.115 36.01 218.745 35.485 218.265 35.04C217.88 34.68 217.475 34.39 217.035 34.17C216.6 33.95 216.11 33.8 215.565 33.72C215.02 33.64 214.625 33.6 214.38 33.585C214.135 33.575 213.725 33.565 213.15 33.565H211.355V26.67H218.83V23.175H207.68V48.885H213.255C215.825 48.885 217.66 48.08 218.76 46.465C219.475 45.4 219.835 44.015 219.835 42.305V39.295C219.835 38.805 219.82 38.39 219.79 38.05C219.77 37.705 219.625 37.23 219.37 36.62ZM216.17 41.765C216.17 42.935 215.95 43.825 215.505 44.435C214.945 45.2 214.115 45.58 213.015 45.58H211.365V36.87H213.23C213.995 36.87 214.645 37.09 215.185 37.535C215.565 37.87 215.825 38.255 215.965 38.69C216.1 39.125 216.17 39.685 216.17 40.365V41.765ZM230.19 30.525C229.805 32.295 229.485 34.045 229.22 35.78H229.11L225.595 23.175H221.4L227.175 41.07L226.69 43.24C226.63 43.49 226.53 43.775 226.385 44.09C226.24 44.405 226.1 44.635 225.955 44.78C225.585 45.185 225.025 45.39 224.27 45.39H223.355V48.885H224.665C226.015 48.885 227.075 48.65 227.84 48.185C228.14 48.005 228.415 47.785 228.665 47.52C228.915 47.255 229.14 46.95 229.335 46.605C229.53 46.26 229.705 45.925 229.845 45.61C229.99 45.295 230.13 44.9 230.265 44.425C230.4 43.955 230.515 43.56 230.595 43.24C230.68 42.925 230.785 42.495 230.91 41.95C231.035 41.405 231.135 40.995 231.205 40.72L235.58 23.17H231.795L230.19 30.525ZM249.63 27.485C249.385 26.525 248.885 25.655 248.135 24.875C247.635 24.375 247.055 23.985 246.395 23.72C245.735 23.45 245.175 23.295 244.71 23.245C244.245 23.195 243.67 23.175 242.99 23.175H237.52V48.885H241.195V38.715H243.365C245.55 38.715 247.24 38.04 248.42 36.69C249.47 35.485 250 33.745 250 31.475V30.74C250 29.53 249.875 28.445 249.63 27.485ZM246.325 32.425C246.325 32.46 246.32 32.555 246.315 32.71C246.31 32.865 246.3 32.97 246.29 33.025C246.28 33.08 246.26 33.17 246.235 33.305C246.21 33.435 246.18 33.54 246.145 33.61C246.11 33.68 246.065 33.77 246.02 33.88C245.97 33.99 245.915 34.085 245.85 34.175C245.785 34.265 245.71 34.355 245.625 34.455C245.05 35.09 244.23 35.405 243.17 35.405H241.2V26.49H242.475C242.965 26.49 243.315 26.495 243.525 26.51C243.735 26.52 244.025 26.58 244.395 26.68C244.765 26.78 245.08 26.94 245.345 27.155C245.585 27.36 245.78 27.58 245.93 27.82C246.08 28.06 246.18 28.335 246.225 28.655C246.275 28.97 246.305 29.21 246.315 29.37C246.325 29.53 246.335 29.78 246.335 30.115V32.425H246.325ZM97.355 30.075C97.33 31.93 97.245 34.24 97.105 37.015C96.925 40.265 96.68 42.375 96.37 43.345C96.155 44.085 95.725 44.65 95.08 45.03C94.85 45.165 94.595 45.26 94.32 45.315V48.875C95.1 48.855 95.805 48.745 96.425 48.535C97.105 48.300 97.76 47.845 98.38 47.165C99.265 46.185 99.855 44.95 100.155 43.455C100.395 42.295 100.58 40.705 100.71 38.685C100.77 37.87 100.875 35.005 101.035 30.08L101.14 26.495H104.08V48.89H107.755V23.17H97.465L97.355 30.075Z" fill="#424242"/>
</svg>'''

    # Конвертируем SVG в PNG для использования в PDF
    from cairosvg import svg2png
    png_data = svg2png(bytestring=svg_content, output_width=200, output_height=50)
    return ImageReader(io.BytesIO(png_data))


@router.get("/{passport_id}/export/pdf")
async def export_passport_pdf(
    passport_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Экспорт паспорта ВЭД в PDF"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    try:
        # Получаем паспорт с номенклатурой
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

        # Генерируем PDF с новым макетом
        pdf_content = generate_passport_pdf(passport)

        # Возвращаем файл
        return Response(
            content=pdf_content,
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename=passport_{passport.passport_number}.pdf'
            }
        )

    except Exception as e:
        print(f"Ошибка при экспорте паспорта в PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при экспорте: {str(e)}")


@router.get("/{passport_id}/export/xlsx")
async def export_passport_xlsx(
    passport_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Экспорт паспорта ВЭД в XLSX"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    try:
        # Получаем паспорт с номенклатурой
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

        # Используем ту же функцию, что и для массового экспорта
        return await export_all_passports_xlsx_internal([passport], current_user)

    except Exception as e:
        print(f"Ошибка при экспорте паспорта в XLSX: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при экспорте: {str(e)}")


@router.get("/export/all/pdf")
async def export_all_passports_pdf(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Экспорт всех паспортов ВЭД в PDF (по 3 паспорта на страницу)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    try:
        # Получаем все паспорта пользователя
        result = await db.execute(
            select(VedPassport)
            .options(joinedload(VedPassport.nomenclature))
            .where(VedPassport.created_by == current_user.id)
        )
        passports = result.scalars().all()

        if not passports:
            raise HTTPException(status_code=404, detail="Паспорта не найдены")

        if len(passports) > 10000:  # Увеличиваем лимит для больших экспортов
            raise HTTPException(status_code=400, detail="Слишком много паспортов для экспорта (максимум 10000)")

        # Генерируем PDF с новым макетом
        pdf_content = generate_bulk_passports_pdf(passports)

        # Возвращаем файл
        return Response(
            content=pdf_content,
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename=bulk_passports_{len(passports)}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при массовом экспорте паспортов в PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при экспорте: {str(e)}")


@router.post("/export/bulk/pdf")
async def export_bulk_passports_pdf(
    request: BulkExportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Экспорт выбранных паспортов ВЭД в PDF (по 3 паспорта на страницу)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    try:
        if not request.passport_ids:
            raise HTTPException(status_code=400, detail="Не выбраны паспорта для экспорта")

        # Получаем выбранные паспорта пользователя с сортировкой по ID
        result = await db.execute(
            select(VedPassport)
            .options(joinedload(VedPassport.nomenclature))
            .where(
                VedPassport.id.in_(request.passport_ids),
                VedPassport.created_by == current_user.id
            )
            .order_by(VedPassport.id)  # Сохраняем порядок выбора
        )
        passports = result.scalars().all()

        if not passports:
            raise HTTPException(status_code=404, detail="Выбранные паспорта не найдены")

        if len(passports) > 10000:  # Увеличиваем лимит для больших экспортов
            raise HTTPException(status_code=400, detail="Слишком много паспортов для экспорта (максимум 10000)")

        # Проверяем, что все выбранные паспорта найдены
        found_ids = {p.id for p in passports}
        missing_ids = set(request.passport_ids) - found_ids
        if missing_ids:
            raise HTTPException(
                status_code=404,
                detail=f"Не найдены паспорта с ID: {', '.join(map(str, missing_ids))}"
            )

        # Сортируем паспорта в том же порядке, что и в запросе
        id_to_passport = {p.id: p for p in passports}
        sorted_passports = [id_to_passport[pid] for pid in request.passport_ids]

        # Генерируем PDF с новым макетом
        pdf_content = generate_bulk_passports_pdf(sorted_passports)

        # Возвращаем файл
        return Response(
            content=pdf_content,
            media_type='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename=bulk_passports_{len(passports)}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при массовом экспорте выбранных паспортов в PDF: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при экспорте: {str(e)}")


async def export_all_passports_xlsx_internal(passports: List[VedPassport], current_user: User):
    """Внутренняя функция для экспорта паспортов в XLSX"""
    try:
        if not passports:
            raise HTTPException(status_code=404, detail="Паспорта не найдены")

        if len(passports) > 2000:  # Ограничение для предотвращения перегрузки
            raise HTTPException(status_code=400, detail="Слишком много паспортов для экспорта (максимум 2000)")

        print(f"DEBUG: Найдено {len(passports)} паспортов для экспорта")
        for i, passport in enumerate(passports):
            print(f"DEBUG: Паспорт {i+1}: {passport.passport_number}, nomenclature: {passport.nomenclature}")

        # Создаем XLSX в памяти
        buffer = BytesIO()
        workbook = xlsxwriter.Workbook(buffer)

        # Создаем лист со сводной таблицей
        summary_sheet = workbook.add_worksheet('Сводка паспортов')

        # Форматы
        header_format = workbook.add_format({
            'bold': True,
            'bg_color': '#4472C4',
            'font_color': 'white',
            'border': 1,
            'align': 'center'
        })

        cell_format = workbook.add_format({
            'border': 1,
            'align': 'left'
        })

        # Заголовки
        headers = ['Номер паспорта', 'Номер заказа', 'Код 1С', 'Наименование', 'Артикул', 'Матрица',
                  'Глубина бурения', 'Высота', 'Резьба', 'Тип продукта',
                  'Количество', 'Дата создания']

        for col, header in enumerate(headers):
            summary_sheet.write(0, col, header, header_format)

        # Данные
        for row, passport in enumerate(passports, 1):
            try:
                print(f"DEBUG: Обрабатываем паспорт {row}: {passport.passport_number}")
                
                # Безопасное получение данных nomenclature
                nomenclature = passport.nomenclature if passport.nomenclature else None
                
                summary_sheet.write(row, 0, passport.passport_number or '', cell_format)
                summary_sheet.write(row, 1, passport.order_number or '', cell_format)
                summary_sheet.write(row, 2, nomenclature.code_1c if nomenclature else '', cell_format)
                summary_sheet.write(row, 3, nomenclature.name if nomenclature else '', cell_format)
                summary_sheet.write(row, 4, nomenclature.article if nomenclature else '', cell_format)
                summary_sheet.write(row, 5, nomenclature.matrix if nomenclature else '', cell_format)
                summary_sheet.write(row, 6, nomenclature.drilling_depth if nomenclature else '', cell_format)
                summary_sheet.write(row, 7, nomenclature.height if nomenclature else '', cell_format)
                summary_sheet.write(row, 8, nomenclature.thread if nomenclature else '', cell_format)
                summary_sheet.write(row, 9, nomenclature.product_type if nomenclature else '', cell_format)
                summary_sheet.write(row, 10, passport.quantity or 0, cell_format)
                summary_sheet.write(row, 11, passport.created_at.strftime("%d.%m.%Y %H:%M") if passport.created_at else '', cell_format)
                
                print(f"DEBUG: Паспорт {row} обработан успешно")
            except Exception as e:
                print(f"ERROR: Ошибка при обработке паспорта {row}: {e}")
                # Записываем пустую строку в случае ошибки
                for col in range(12):
                    summary_sheet.write(row, col, '', cell_format)

        # Устанавливаем ширину колонок
        summary_sheet.set_column('A:A', 20)  # Номер паспорта
        summary_sheet.set_column('B:B', 15)  # Номер заказа
        summary_sheet.set_column('C:C', 15)  # Код 1С
        summary_sheet.set_column('D:D', 30)  # Наименование
        summary_sheet.set_column('E:E', 15)  # Артикул
        summary_sheet.set_column('F:F', 15)  # Матрица
        summary_sheet.set_column('G:G', 15)  # Глубина бурения
        summary_sheet.set_column('H:H', 10)  # Высота
        summary_sheet.set_column('I:I', 10)  # Резьба
        summary_sheet.set_column('J:J', 20)  # Тип продукта
        summary_sheet.set_column('K:K', 12)  # Количество
        summary_sheet.set_column('L:L', 18)  # Дата создания

        workbook.close()
        buffer.seek(0)

        # Возвращаем файл
        return Response(
            content=buffer.getvalue(),
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': f'attachment; filename=bulk_passports_{len(passports)}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при экспорте паспортов в XLSX: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при экспорте: {str(e)}")


@router.get("/export/all/xlsx")
async def export_all_passports_xlsx(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Экспорт всех паспортов ВЭД в XLSX"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    try:
        # Получаем все паспорта пользователя
        result = await db.execute(
            select(VedPassport)
            .options(joinedload(VedPassport.nomenclature))
            .where(VedPassport.created_by == current_user.id)
        )
        passports = result.scalars().all()

        # Используем внутреннюю функцию
        return await export_all_passports_xlsx_internal(passports, current_user)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при массовом экспорте паспортов в XLSX: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при экспорте: {str(e)}")


@router.post("/export/bulk/xlsx")
async def export_bulk_passports_xlsx(
    request: BulkExportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Экспорт выбранных паспортов ВЭД в XLSX"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    try:
        # Получаем выбранные паспорта пользователя
        result = await db.execute(
            select(VedPassport)
            .options(joinedload(VedPassport.nomenclature))
            .where(
                VedPassport.id.in_(request.passport_ids),
                VedPassport.created_by == current_user.id
            )
        )
        passports = result.scalars().all()

        # Используем внутреннюю функцию
        return await export_all_passports_xlsx_internal(passports, current_user)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при массовом экспорте выбранных паспортов в XLSX: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при экспорте: {str(e)}")
