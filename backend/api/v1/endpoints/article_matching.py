from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime
import pandas as pd
import io
import re
import aiohttp
import asyncio
from difflib import SequenceMatcher

from database import get_db
from models import User, UserRole, ArticleMapping, ContractorRequest, ContractorRequestItem, MatchingNomenclature
from ..schemas import (
    ArticleMapping as ArticleMappingSchema,
    ArticleMappingCreate,
    ContractorRequest as ContractorRequestSchema,
    ContractorRequestCreate,
    ContractorRequestItem as ContractorRequestItemSchema,
    ContractorRequestItemCreate,
    ContractorRequestItemUpdate,
    MatchingResult,
    MatchingSummary,
    TextUploadRequest
)
from .auth import get_current_user

router = APIRouter()

# API ключ для Polza.ai
POLZA_API_KEY = "ak_FojEdiuKBZJwcAdyGQiPUIKt2DDFsTlawov98zr6Npg"
POLZA_API_URL = "https://api.polza.ai/v1/chat/completions"


async def search_with_ai(description: str, db: AsyncSession) -> dict:
    """Поиск соответствий в базе данных через AI API"""
    try:
        # Получаем все номенклатуры из базы данных
        result = await db.execute(select(MatchingNomenclature))
        nomenclatures = result.scalars().all()
        
        # Формируем список номенклатур для AI
        nomenclatures_text = "\n".join([
            f"Артикул: {nom.article}, Название: {nom.name}, Код 1С: {nom.code_1c}"
            for nom in nomenclatures[:100]  # Ограничиваем для экономии токенов
        ])
        
        # Формируем промпт для AI
        prompt = f"""
Найди наиболее подходящие соответствия для товара: "{description}"

Доступные номенклатуры:
{nomenclatures_text}

Верни только JSON в формате:
{{
    "matches": [
        {{
            "article": "артикул",
            "name": "название",
            "code_1c": "код_1с",
            "confidence": 0.95
        }}
    ]
}}

Найди до 3 наиболее подходящих соответствий, отсортированных по уверенности (confidence).
"""
        
        # Отправляем запрос к AI API
        async with aiohttp.ClientSession() as session:
            headers = {
                "Authorization": f"Bearer {POLZA_API_KEY}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 1000
            }
            
            async with session.post(POLZA_API_URL, headers=headers, json=data) as response:
                if response.status in [200, 201]:
                    result = await response.json()
                    ai_response = result["choices"][0]["message"]["content"]
                    
                    # Парсим JSON ответ
                    import json
                    try:
                        # Извлекаем JSON из markdown блока, если он есть
                        if "```json" in ai_response:
                            json_start = ai_response.find("```json") + 7
                            json_end = ai_response.find("```", json_start)
                            if json_end != -1:
                                ai_response = ai_response[json_start:json_end].strip()
                        elif "```" in ai_response:
                            json_start = ai_response.find("```") + 3
                            json_end = ai_response.find("```", json_start)
                            if json_end != -1:
                                ai_response = ai_response[json_start:json_end].strip()
                        
                        matches = json.loads(ai_response)
                        return matches
                    except json.JSONDecodeError as e:
                        print(f"Failed to parse AI response: {e}")
                        print(f"AI response: {ai_response}")
                        return {"matches": []}
                else:
                    print(f"AI API error: {response.status}")
                    return {"matches": []}
                    
    except Exception as e:
        print(f"AI search error: {e}")
        return {"matches": []}


def calculate_similarity(text1: str, text2: str) -> float:
    """Вычисляет схожесть между двумя текстами"""
    return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()


def find_best_match(description: str, nomenclature_list: List[MatchingNomenclature]) -> Optional[tuple]:
    """Находит лучшее соответствие для описания товара"""
    best_match = None
    best_score = 0.0
    
    for nomenclature in nomenclature_list:
        # Проверяем совпадение по названию
        name_score = calculate_similarity(description, nomenclature.name)
        
        # Проверяем совпадение по артикулу
        article_score = calculate_similarity(description, nomenclature.agb_article)
        
        # Комбинируем оценки
        combined_score = max(name_score, article_score * 0.8)  # Артикул менее важен
        
        if combined_score > best_score and combined_score > 0.3:  # Минимальный порог
            best_score = combined_score
            best_match = nomenclature
    
    if best_match:
        return best_match, int(best_score * 100)
    return None


@router.get("/mappings/", response_model=List[ArticleMappingSchema])
async def get_article_mappings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка соответствий артикулов"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(
        select(ArticleMapping)
        .where(ArticleMapping.is_active == True)
        .order_by(ArticleMapping.created_at.desc())
    )
    mappings = result.scalars().all()
    return mappings


@router.post("/mappings/", response_model=ArticleMappingSchema)
async def create_article_mapping(
    mapping_data: ArticleMappingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание нового соответствия артикулов"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        new_mapping = ArticleMapping(
            contractor_article=mapping_data.contractor_article,
            contractor_description=mapping_data.contractor_description,
            agb_article=mapping_data.agb_article,
            agb_description=mapping_data.agb_description,
            bl_article=mapping_data.bl_article,
            bl_description=mapping_data.bl_description,
            packaging_factor=mapping_data.packaging_factor,
            unit=mapping_data.unit,
            nomenclature_id=mapping_data.nomenclature_id
        )
        
        db.add(new_mapping)
        await db.commit()
        await db.refresh(new_mapping)
        
        return new_mapping
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при создании соответствия: {str(e)}")


@router.post("/requests/", response_model=ContractorRequestSchema)
async def create_contractor_request(
    request_data: ContractorRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание новой заявки контрагента"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Проверяем уникальность номера заявки
        existing = await db.execute(
            select(ContractorRequest).where(ContractorRequest.request_number == request_data.request_number)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Заявка с таким номером уже существует")
        
        # Парсим дату
        request_date = datetime.fromisoformat(request_data.request_date.replace('Z', '+00:00'))
        
        # Создаем заявку
        new_request = ContractorRequest(
            request_number=request_data.request_number,
            contractor_name=request_data.contractor_name,
            request_date=request_date,
            total_items=len(request_data.items),
            created_by=current_user.id
        )
        
        db.add(new_request)
        await db.flush()  # Получаем ID заявки
        
        # Создаем позиции заявки
        for item_data in request_data.items:
            new_item = ContractorRequestItem(
                request_id=new_request.id,
                line_number=item_data.line_number,
                contractor_article=item_data.contractor_article,
                description=item_data.description,
                unit=item_data.unit,
                quantity=item_data.quantity,
                category=item_data.category
            )
            db.add(new_item)
        
        await db.commit()
        await db.refresh(new_request)
        
        return new_request
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при создании заявки: {str(e)}")


@router.get("/requests/", response_model=List[ContractorRequestSchema])
async def get_contractor_requests(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка заявок контрагентов"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(
        select(ContractorRequest)
        .where(ContractorRequest.created_by == current_user.id)
        .order_by(ContractorRequest.created_at.desc())
    )
    requests = result.scalars().all()
    return requests


@router.get("/requests/{request_id}", response_model=ContractorRequestSchema)
async def get_contractor_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение конкретной заявки контрагента"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(
        select(ContractorRequest)
        .where(ContractorRequest.id == request_id)
    )
    request = result.scalar_one_or_none()
    
    if not request:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    
    if request.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    return request


@router.post("/requests/{request_id}/match", response_model=MatchingSummary)
async def match_articles(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Сопоставление артикулов в заявке"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Получаем заявку
        result = await db.execute(
            select(ContractorRequest).where(ContractorRequest.id == request_id)
        )
        request = result.scalar_one_or_none()
        
        if not request:
            raise HTTPException(status_code=404, detail="Заявка не найдена")
        
        if request.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Доступ запрещен")
        
        # Получаем позиции заявки
        items_result = await db.execute(
            select(ContractorRequestItem)
            .where(ContractorRequestItem.request_id == request_id)
            .order_by(ContractorRequestItem.line_number)
        )
        items = items_result.scalars().all()
        
        # Получаем всю номенклатуру для сопоставления
        nomenclature_result = await db.execute(
            select(MatchingNomenclature).where(MatchingNomenclature.is_active == True)
        )
        nomenclature_list = nomenclature_result.scalars().all()
        
        # Сопоставляем каждую позицию
        results = []
        matched_count = 0
        high_confidence = 0
        medium_confidence = 0
        low_confidence = 0
        
        for item in items:
            match_result = find_best_match(item.description, nomenclature_list)
            
            if match_result:
                nomenclature, confidence = match_result
                
                # Обновляем позицию
                item.matched_nomenclature_id = nomenclature.id
                item.agb_article = nomenclature.agb_article
                item.packaging_factor = 1  # По умолчанию
                item.recalculated_quantity = item.quantity * item.packaging_factor
                item.match_confidence = confidence
                item.match_status = "matched"
                
                # Определяем уровень уверенности
                if confidence >= 80:
                    high_confidence += 1
                elif confidence >= 60:
                    medium_confidence += 1
                else:
                    low_confidence += 1
                
                matched_count += 1
                
                results.append(MatchingResult(
                    item_id=item.id,
                    contractor_article=item.contractor_article,
                    description=item.description,
                    matched=True,
                    agb_article=nomenclature.agb_article,
                    packaging_factor=item.packaging_factor,
                    recalculated_quantity=item.recalculated_quantity,
                    match_confidence=confidence,
                    nomenclature=nomenclature
                ))
            else:
                item.match_status = "unmatched"
                results.append(MatchingResult(
                    item_id=item.id,
                    contractor_article=item.contractor_article,
                    description=item.description,
                    matched=False
                ))
        
        # Обновляем статистику заявки
        request.matched_items = matched_count
        request.status = "processing"
        request.processed_by = current_user.id
        request.processed_at = datetime.now()
        
        await db.commit()
        
        return MatchingSummary(
            total_items=len(items),
            matched_items=matched_count,
            unmatched_items=len(items) - matched_count,
            high_confidence_items=high_confidence,
            medium_confidence_items=medium_confidence,
            low_confidence_items=low_confidence,
            results=results
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при сопоставлении: {str(e)}")


@router.put("/items/{item_id}", response_model=ContractorRequestItemSchema)
async def update_request_item(
    item_id: int,
    item_data: ContractorRequestItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление позиции заявки"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Получаем позицию
        result = await db.execute(
            select(ContractorRequestItem).where(ContractorRequestItem.id == item_id)
        )
        item = result.scalar_one_or_none()
        
        if not item:
            raise HTTPException(status_code=404, detail="Позиция не найдена")
        
        # Проверяем права доступа через заявку
        request_result = await db.execute(
            select(ContractorRequest).where(ContractorRequest.id == item.request_id)
        )
        request = request_result.scalar_one_or_none()
        
        if not request or request.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Доступ запрещен")
        
        # Обновляем поля
        update_data = item_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(item, field, value)
        
        # Пересчитываем количество если изменился коэффициент фасовки
        if item_data.packaging_factor is not None:
            item.recalculated_quantity = item.quantity * item.packaging_factor
        
        await db.commit()
        await db.refresh(item)
        
        return item
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении позиции: {str(e)}")


@router.post("/upload-excel/", response_model=ContractorRequestSchema)
async def upload_contractor_excel(
    file: UploadFile = File(...),
    contractor_name: str = "Контрагент",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Загрузка заявки контрагента из Excel файла"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Читаем Excel файл
        content = await file.read()
        df = pd.read_excel(io.BytesIO(content))
        
        # Генерируем номер заявки
        request_number = f"REQ_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Создаем заявку
        new_request = ContractorRequest(
            request_number=request_number,
            contractor_name=contractor_name,
            request_date=datetime.now(),
            total_items=len(df),
            created_by=current_user.id
        )
        
        db.add(new_request)
        await db.flush()
        
        # Обрабатываем строки Excel
        items = []
        for index, row in df.iterrows():
            # Извлекаем данные из строки (адаптируем под формат из примера)
            line_number = index + 1
            contractor_article = str(row.get('Артикул', row.get('№', ''))).strip()
            description = str(row.get('Описание', row.get('Наименование', ''))).strip()
            unit = str(row.get('Ед.', row.get('Единица', 'шт'))).strip()
            quantity = int(row.get('Количество', row.get('Кол-во', 1)))
            category = str(row.get('Категория', 'Для бурения')).strip()
            
            if contractor_article and description:
                new_item = ContractorRequestItem(
                    request_id=new_request.id,
                    line_number=line_number,
                    contractor_article=contractor_article,
                    description=description,
                    unit=unit,
                    quantity=quantity,
                    category=category
                )
                db.add(new_item)
                items.append(new_item)
        
        await db.commit()
        await db.refresh(new_request)
        
        return new_request
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке файла: {str(e)}")


@router.get("/requests/{request_id}/export/excel")
async def export_matching_results(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Экспорт результатов сопоставления в Excel"""
    if current_user.role not in [UserRole.ADMIN, UserRole.VED_PASSPORT]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Получаем заявку
        result = await db.execute(
            select(ContractorRequest).where(ContractorRequest.id == request_id)
        )
        request = result.scalar_one_or_none()
        
        if not request or request.created_by != current_user.id:
            raise HTTPException(status_code=403, detail="Доступ запрещен")
        
        # Получаем позиции с номенклатурой
        items_result = await db.execute(
            select(ContractorRequestItem)
            .options(selectinload(ContractorRequestItem.matched_nomenclature))
            .where(ContractorRequestItem.request_id == request_id)
            .order_by(ContractorRequestItem.line_number)
        )
        items = items_result.scalars().all()
        
        # Создаем DataFrame
        data = []
        for item in items:
            data.append({
                'Номер строки': item.line_number,
                'Артикул контрагента': item.contractor_article,
                'Описание контрагента': item.description,
                'Количество': item.quantity,
                'Единица': item.unit,
                'Статус сопоставления': item.match_status,
                'Уверенность (%)': item.match_confidence,
                'Артикул АГБ': item.agb_article or '',
                'Артикул BL': item.bl_article or '',
                'Коэффициент фасовки': item.packaging_factor,
                'Пересчитанное количество': item.recalculated_quantity or item.quantity,
                'Номенклатура АГБ': item.matched_nomenclature.name if item.matched_nomenclature else '',
                'Код 1С': item.matched_nomenclature.code_1c if item.matched_nomenclature else ''
            })
        
        df = pd.DataFrame(data)
        
        # Создаем Excel файл в памяти
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Результаты сопоставления', index=False)
            
            # Настраиваем ширину колонок
            worksheet = writer.sheets['Результаты сопоставления']
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
        from fastapi import Response
        return Response(
            content=output.getvalue(),
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': f'attachment; filename=matching_results_{request.request_number}.xlsx'
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при экспорте: {str(e)}")


@router.post("/upload-text/")
async def upload_text_request(
    request_data: TextUploadRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Загрузка заявки из текста с AI поиском"""
    try:
        # Парсим текст для извлечения позиций
        items = parse_text_to_items(request_data.text)
        
        if not items:
            raise HTTPException(status_code=400, detail="Не удалось извлечь позиции из текста")
        
        # Создаем заявку
        request = ContractorRequest(
            request_number=f"TEXT_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            contractor_name=request_data.contractor_name,
            status='new',
            created_by=current_user.id
        )
        
        db.add(request)
        await db.flush()  # Получаем ID заявки
        
        # Создаем позиции заявки с AI поиском
        for item_data in items:
            description = item_data.get('description', '')
            print(f"Searching AI matches for: {description}")
            
            # Ищем соответствия через AI
            ai_matches = await search_with_ai(description, db)
            
            # Создаем позицию заявки
            item = ContractorRequestItem(
                request_id=request.id,
                contractor_article=item_data.get('article', ''),
                description=description,
                quantity=item_data.get('quantity', 1),
                unit=item_data.get('unit', 'шт')
            )
            db.add(item)
            await db.flush()  # Получаем ID позиции
            
            # Если AI нашел соответствия, создаем записи сопоставления
            if ai_matches.get('matches'):
                for match in ai_matches['matches']:
                    # Ищем номенклатуру в базе по артикулу
                    nom_result = await db.execute(
                        select(MatchingNomenclature).where(MatchingNomenclature.agb_article == match['article'])
                    )
                    nomenclature = nom_result.scalar_one_or_none()
                    
                    if nomenclature:
                        # Создаем запись сопоставления
                        mapping = ArticleMapping(
                            contractor_request_item_id=item.id,
                            agb_article=match['article'],
                            bl_article=match.get('code_1c', ''),
                            match_confidence=match.get('confidence', 0.0),
                            packaging_factor=1.0,
                            recalculated_quantity=item_data.get('quantity', 1),
                            nomenclature_id=nomenclature.id
                        )
                        db.add(mapping)
                        print(f"Created mapping: {match['article']} -> {match.get('code_1c', '')}")
        
        await db.commit()
        await db.refresh(request)
        
        # Загружаем заявку с позициями
        result = await db.execute(
            select(ContractorRequest)
            .options(selectinload(ContractorRequest.items))
            .where(ContractorRequest.id == request.id)
        )
        request_with_items = result.scalar_one()
        
        return request_with_items
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при обработке текста: {str(e)}")


def parse_text_to_items(text: str) -> List[dict]:
    """Парсит текст и извлекает позиции заявки - ищет строки длиннее 4 символов"""
    items = []
    lines = [line.strip() for line in text.strip().split('\n') if line.strip()]
    
    print(f"Parsing text with {len(lines)} lines:")
    for idx, line in enumerate(lines):
        print(f"  {idx}: '{line}' (length: {len(line)})")
    
    # Ищем строки длиннее 4 символов, которые могут быть описаниями товаров
    for line in lines:
        if len(line) > 4:
            # Пропускаем служебные строки
            if (line.startswith('Новая потребность') or 
                line.startswith('Для') or 
                line.lower() in ['шт', 'шт.', 'штук', 'штук.', 'pcs', 'pcs.', 'pieces', 'pieces.'] or
                re.match(r'^\d+$', line)):
                continue
            
            # Это потенциальное описание товара
            item = {
                'article': '',  # Будет заполнено AI поиском
                'description': line,
                'quantity': 1,  # По умолчанию
                'unit': 'шт'    # По умолчанию
            }
            print(f"Found potential item: {item}")
            items.append(item)
    
    return items


@router.get("/our-database/")
async def get_our_database(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение нашей базы данных номенклатур"""
    try:
        result = await db.execute(select(MatchingNomenclature))
        nomenclatures = result.scalars().all()
        
        return [
            {
                "id": nom.id,
                "article": nom.article,
                "name": nom.name,
                "code_1c": nom.code_1c
            }
            for nom in nomenclatures
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении базы данных: {str(e)}")


@router.get("/test-our-database/")
async def test_our_database(db: AsyncSession = Depends(get_db)):
    """Тестовый endpoint для проверки базы данных без аутентификации"""
    try:
        result = await db.execute(select(MatchingNomenclature))
        nomenclatures = result.scalars().all()
        
        return {
            "count": len(nomenclatures),
            "data": [
                {
                    "id": nom.id,
                    "agb_article": nom.agb_article,
                    "name": nom.name,
                    "code_1c": nom.code_1c,
                    "bl_article": nom.bl_article,
                    "packaging": nom.packaging,
                    "unit": nom.unit,
                    "is_active": nom.is_active
                }
                for nom in nomenclatures  # Все записи
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении базы данных: {str(e)}")


@router.get("/found-items/")
async def get_found_items(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение найденных элементов сопоставления"""
    try:
        # Получаем все записи сопоставления с номенклатурами
        result = await db.execute(
            select(ArticleMapping)
            .options(selectinload(ArticleMapping.nomenclature))
            .options(selectinload(ArticleMapping.contractor_request_item))
        )
        mappings = result.scalars().all()
        
        found_items = []
        for mapping in mappings:
            item = {
                "id": mapping.id,
                "bl_article": mapping.bl_article,
                "search_article": mapping.contractor_request_item.contractor_article if mapping.contractor_request_item else None,
                "our_article": mapping.agb_article,
                "ut_number": mapping.nomenclature.code_1c if mapping.nomenclature else None,
                "found_data": mapping.nomenclature.name if mapping.nomenclature else None,
                "match_confidence": mapping.match_confidence,
                "packaging_factor": mapping.packaging_factor,
                "recalculated_quantity": mapping.recalculated_quantity
            }
            found_items.append(item)
        
        return found_items
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении найденных элементов: {str(e)}")


@router.get("/test-found-items/")
async def test_found_items(db: AsyncSession = Depends(get_db)):
    """Тестовый endpoint для проверки найденных элементов без аутентификации"""
    try:
        # Используем SQLAlchemy ORM для получения данных
        result = await db.execute(select(ArticleMapping))
        mappings = result.scalars().all()
        
        print(f"Найдено {len(mappings)} записей в article_mappings")
        
        found_items = []
        for mapping in mappings:
            item = {
                "id": mapping.id,
                "bl_article": mapping.bl_article,
                "search_article": mapping.contractor_article,
                "our_article": mapping.agb_article,
                "ut_number": mapping.agb_description,
                "found_data": mapping.contractor_description,
                "match_confidence": 100.0,
                "packaging_factor": mapping.packaging_factor,
                "recalculated_quantity": 1
            }
            found_items.append(item)
            print(f"Обработана запись: {mapping.id} - {mapping.agb_article} -> {mapping.bl_article}")
        
        return {
            "count": len(mappings),
            "data": found_items
        }
    except Exception as e:
        print(f"Ошибка в test_found_items: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка при получении найденных элементов: {str(e)}")


@router.put("/nomenclature/{nomenclature_id}/")
async def update_nomenclature(
    nomenclature_id: int,
    nomenclature_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление номенклатуры"""
    try:
        # Проверяем права доступа
        if current_user.role not in ['ved_passport', 'admin']:
            raise HTTPException(status_code=403, detail="Недостаточно прав для редактирования номенклатуры")
        
        # Находим номенклатуру
        result = await db.execute(
            select(MatchingNomenclature).where(MatchingNomenclature.id == nomenclature_id)
        )
        nomenclature = result.scalar_one_or_none()
        
        if not nomenclature:
            raise HTTPException(status_code=404, detail="Номенклатура не найдена")
        
        # Обновляем поля
        nomenclature.agb_article = nomenclature_data.get('agb_article', nomenclature.agb_article)
        nomenclature.name = nomenclature_data.get('name', nomenclature.name)
        nomenclature.code_1c = nomenclature_data.get('code_1c', nomenclature.code_1c)
        nomenclature.bl_article = nomenclature_data.get('bl_article', nomenclature.bl_article)
        nomenclature.packaging = nomenclature_data.get('packaging', nomenclature.packaging)
        nomenclature.unit = nomenclature_data.get('unit', nomenclature.unit)
        nomenclature.is_active = nomenclature_data.get('is_active', nomenclature.is_active)
        
        await db.commit()
        
        return {
            "id": nomenclature.id,
            "agb_article": nomenclature.agb_article,
            "name": nomenclature.name,
            "code_1c": nomenclature.code_1c,
            "bl_article": nomenclature.bl_article,
            "packaging": nomenclature.packaging,
            "unit": nomenclature.unit,
            "is_active": nomenclature.is_active
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении номенклатуры: {str(e)}")


@router.put("/mapping/{mapping_id}/")
async def update_mapping(
    mapping_id: int,
    mapping_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление сопоставления артикулов"""
    try:
        # Проверяем права доступа
        if current_user.role not in ['ved_passport', 'admin']:
            raise HTTPException(status_code=403, detail="Недостаточно прав для редактирования сопоставлений")
        
        # Находим сопоставление
        result = await db.execute(
            select(ArticleMapping).where(ArticleMapping.id == mapping_id)
        )
        mapping = result.scalar_one_or_none()
        
        if not mapping:
            raise HTTPException(status_code=404, detail="Сопоставление не найдено")
        
        # Обновляем поля
        mapping.bl_article = mapping_data.get('bl_article', mapping.bl_article)
        mapping.contractor_article = mapping_data.get('search_article', mapping.contractor_article)
        mapping.agb_article = mapping_data.get('our_article', mapping.agb_article)
        mapping.agb_description = mapping_data.get('ut_number', mapping.agb_description)
        mapping.contractor_description = mapping_data.get('found_data', mapping.contractor_description)
        mapping.match_confidence = mapping_data.get('match_confidence', mapping.match_confidence)
        mapping.packaging_factor = mapping_data.get('packaging_factor', mapping.packaging_factor)
        mapping.recalculated_quantity = mapping_data.get('recalculated_quantity', mapping.recalculated_quantity)
        
        await db.commit()
        
        return {
            "id": mapping.id,
            "bl_article": mapping.bl_article,
            "search_article": mapping.contractor_article,
            "our_article": mapping.agb_article,
            "ut_number": mapping.agb_description,
            "found_data": mapping.contractor_description,
            "match_confidence": mapping.match_confidence,
            "packaging_factor": mapping.packaging_factor,
            "recalculated_quantity": mapping.recalculated_quantity
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении сопоставления: {str(e)}")
