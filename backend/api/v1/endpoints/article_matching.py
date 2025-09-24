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

async def extract_articles_from_text(text: str) -> List[dict]:
    """Извлекает артикулы из текста строки через AI API"""
    try:
        async with aiohttp.ClientSession() as session:
            prompt = f"""
Проанализируй следующий текст и найди все артикулы товаров. 
Верни результат в формате JSON с массивом объектов, где каждый объект содержит:
- "article": найденный артикул
- "description": описание товара
- "quantity": количество (если указано)
- "unit": единица измерения (если указана)

Текст: {text}

Если артикулов нет, верни пустой массив [].
"""
            
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "Ты эксперт по анализу товарных позиций. Извлекай артикулы и описания товаров из текста."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1
            }
            
            headers = {
                "Authorization": f"Bearer {POLZA_API_KEY}",
                "Content-Type": "application/json"
            }
            
            async with session.post(POLZA_API_URL, json=payload, headers=headers) as response:
                if response.status == 200:
                    result = await response.json()
                    content = result["choices"][0]["message"]["content"]
                    
                    # Извлекаем JSON из ответа (может быть в markdown блоке)
                    if "```json" in content:
                        json_start = content.find("```json") + 7
                        json_end = content.find("```", json_start)
                        content = content[json_start:json_end].strip()
                    elif "```" in content:
                        json_start = content.find("```") + 3
                        json_end = content.find("```", json_start)
                        content = content[json_start:json_end].strip()
                    
                    import json
                    articles = json.loads(content)
                    return articles if isinstance(articles, list) else []
                else:
                    print(f"❌ Ошибка AI API: {response.status}")
                    return []
                    
    except Exception as e:
        print(f"❌ Ошибка при извлечении артикулов: {str(e)}")
        return []

def transliterate_to_latin(text: str) -> str:
    """Транслитерация русских букв в латиницу"""
    translit_map = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    }
    
    result = text
    for ru_char, en_char in translit_map.items():
        result = result.replace(ru_char, en_char)
    
    result = result.lower()
    
    # Заменяем пробелы и специальные символы на подчеркивания
    result = result.replace(' ', '_').replace('-', '_').replace('.', '').replace(',', '').replace('(', '').replace(')', '')
    
    return result
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


async def smart_search_with_ai(search_text: str, db: AsyncSession) -> dict:
    """Умный поиск через AI - определяет тип поиска и находит соответствия"""
    try:
        # Получаем все номенклатуры из базы данных
        result = await db.execute(select(MatchingNomenclature))
        nomenclatures = result.scalars().all()
        
        # Формируем список номенклатур для AI
        nomenclatures_text = "\n".join([
            f"Артикул АГБ: {nom.agb_article}, Артикул BL: {nom.bl_article or 'нет'}, Название: {nom.name}, Код 1С: {nom.code_1c}"
            for nom in nomenclatures[:200]  # Увеличиваем лимит для лучшего поиска
        ])
        
        # Формируем промпт для AI
        prompt = f"""
        Проанализируй текст поиска: "{search_text}"
        
        Определи тип поиска:
        1. Если это артикул BL (например: "BL-12345", "12345", "BL12345") - ищи точное соответствие по полю "Артикул BL"
        2. Если это артикул АГБ (например: "AGB-12345", "АГБ-12345") - ищи точное соответствие по полю "Артикул АГБ"  
        3. Если это наименование товара - ищи наиболее подходящее по названию
        4. Если мало информации - найди максимально подходящее
        
        База данных номенклатур:
        {nomenclatures_text}
        
        Верни результат в формате JSON:
        {{
            "search_type": "bl_article|agb_article|name|general",
            "matches": [
                {{
                    "agb_article": "артикул_агб",
                    "bl_article": "артикул_bl", 
                    "name": "название",
                    "code_1c": "код_1с",
                    "confidence": процент_уверенности,
                    "packaging": коэффициент_фасовки
                }}
            ]
        }}
        
        Найди до 5 наиболее подходящих вариантов.
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
                "max_tokens": 1500
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
                        return {"search_type": "general", "matches": []}
                else:
                    print(f"AI API error: {response.status}")
                    return {"search_type": "general", "matches": []}
                    
    except Exception as e:
        print(f"AI search error: {e}")
        return {"search_type": "general", "matches": []}


async def search_with_ai(description: str, db: AsyncSession) -> dict:
    """Поиск соответствий в базе данных через AI API (старая версия для совместимости)"""
    result = await smart_search_with_ai(description, db)
    # Преобразуем в старый формат для совместимости
    return {"matches": result.get("matches", [])}


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
        
        # Выполняем сопоставление
        matching_results = await perform_matching(new_request.id, db)
        
        return {
            "request": new_request,
            "matching_results": matching_results
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке файла: {str(e)}")


@router.post("/test-create-request/")
async def test_create_request(
    request_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Тестовый endpoint для создания заявки без файла"""
    try:
        contractor_name = request_data.get("contractor_name", "Тест Контрагент")
        print(f"Начинаем создание тестовой заявки для: {contractor_name}")
        # Генерируем номер заявки
        request_number = f"TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        print(f"Номер заявки: {request_number}")
        
        # Создаем заявку
        new_request = ContractorRequest(
            request_number=request_number,
            contractor_name=contractor_name,
            request_date=datetime.now(),
            total_items=5,  # Тестовая заявка из 5 позиций
            created_by=1  # Тестовый пользователь
        )
        print(f"Создана заявка: {new_request}")
        
        db.add(new_request)
        await db.flush()
        print(f"Заявка добавлена в БД, ID: {new_request.id}")
        
        # Создаем тестовую заявку на основе примера
        test_items = [
            {"article": "1299650", "description": "Шпиндель верхней части керноприемника H/HU, 25231, SDT", "quantity": 5, "unit": "шт"},
            {"article": "1298240", "description": "Втулка удержания жидкости 306131, SDT", "quantity": 12, "unit": "шт"},
            {"article": "1298244", "description": "Пружина мягкая N/H/P, удержания жидкости, 104966, SDT", "quantity": 10, "unit": "шт"},
            {"article": "1299679", "description": "Щека верхняя для ключа разводного 24\", 14947, SDT", "quantity": 8, "unit": "шт"},
            {"article": "1299680", "description": "Щека верхняя для ключа разводного 36\", 14950, SDT", "quantity": 8, "unit": "шт"}
        ]
        
        items = []
        for index, item_data in enumerate(test_items):
            line_number = index + 1
            new_item = ContractorRequestItem(
                request_id=new_request.id,
                line_number=line_number,
                contractor_article=item_data["article"],
                description=item_data["description"],
                unit=item_data["unit"],
                quantity=item_data["quantity"],
                category="Для бурения"
            )
            db.add(new_item)
            items.append(new_item)
        
        await db.commit()
        await db.refresh(new_request)
        
        # Выполняем сопоставление
        matching_results = await perform_matching(new_request.id, db)
        
        return {
            "request": new_request,
            "matching_results": matching_results
        }
        
    except Exception as e:
        await db.rollback()
        import traceback
        error_details = traceback.format_exc()
        print(f"Ошибка в test_create_request: {str(e)}")
        print(f"Traceback: {error_details}")
        raise HTTPException(status_code=500, detail=f"Ошибка при создании заявки: {str(e)}")


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
        
        # Создаем заявку с правильным номером
        contractor_name = request_data.contractor_name
        
        # Генерируем номер заявки в формате {название_контрагента}_{порядковый_номер}_{дата}
        contractor_name_latin = transliterate_to_latin(contractor_name)
        print(f"🔤 Транслитерация: '{contractor_name}' -> '{contractor_name_latin}'")
        
        # Получаем количество заявок для этого контрагента сегодня
        today = datetime.now().date()
        count_result = await db.execute(
            select(func.count(ContractorRequest.id)).where(
                ContractorRequest.contractor_name == contractor_name,
                func.date(ContractorRequest.request_date) == today
            )
        )
        request_count = count_result.scalar() + 1
        
        request_number = f"{contractor_name_latin}_{request_count:03d}_{datetime.now().strftime('%Y%m%d')}"
        
        request = ContractorRequest(
            request_number=request_number,
            contractor_name=contractor_name,
            request_date=datetime.now(),
            total_items=len(items),
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
        
        # Выполняем сопоставление
        matching_results = await perform_matching(request.id, db)
        
        # Загружаем заявку с позициями
        result = await db.execute(
            select(ContractorRequest)
            .options(selectinload(ContractorRequest.items))
            .where(ContractorRequest.id == request.id)
        )
        request_with_items = result.scalar_one()
        
        return {
            "request": request_with_items,
            "matching_results": matching_results
        }
        
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


async def perform_matching(request_id: int, db: AsyncSession) -> dict:
    """Выполняет сопоставление артикулов для заявки"""
    try:
        # Получаем элементы заявки
        result = await db.execute(
            select(ContractorRequestItem).where(ContractorRequestItem.request_id == request_id)
        )
        items = result.scalars().all()
        
        if not items:
            return {"message": "Нет элементов для сопоставления"}
        
        # Получаем все существующие сопоставления
        existing_mappings_result = await db.execute(select(ArticleMapping))
        existing_mappings = existing_mappings_result.scalars().all()
        
        # Создаем словарь для быстрого поиска существующих сопоставлений
        existing_by_contractor_article = {
            mapping.contractor_article: mapping for mapping in existing_mappings
        }
        
        new_mappings = []
        matched_items = []
        
        for item in items:
            # Проверяем, есть ли уже сопоставление для этого артикула
            if item.contractor_article in existing_by_contractor_article:
                existing_mapping = existing_by_contractor_article[item.contractor_article]
                matched_items.append({
                    "line_number": item.line_number,
                    "contractor_article": item.contractor_article,
                    "description": item.description,
                    "agb_article": existing_mapping.agb_article,
                    "bl_article": existing_mapping.bl_article,
                    "match_confidence": existing_mapping.match_confidence,
                    "packaging_factor": existing_mapping.packaging_factor,
                    "recalculated_quantity": item.quantity * existing_mapping.packaging_factor,
                    "source": "existing"
                })
            else:
                # Используем умный поиск через AI
                ai_result = await smart_search_with_ai(item.description, db)
                
                if ai_result.get("matches"):
                    # Берем лучшее соответствие
                    best_match = ai_result["matches"][0]
                    
                    # Создаем новое сопоставление
                    new_mapping = ArticleMapping(
                        contractor_article=item.contractor_article,
                        contractor_description=item.description,
                        agb_article=best_match.get("agb_article", ""),
                        agb_description=best_match.get("name", ""),
                        bl_article=best_match.get("bl_article", ""),
                        match_confidence=int(best_match.get("confidence", 0)),
                        packaging_factor=int(best_match.get("packaging", 1)),
                        recalculated_quantity=item.quantity * int(best_match.get("packaging", 1))
                    )
                    db.add(new_mapping)
                    new_mappings.append(new_mapping)
                    
                    matched_items.append({
                        "line_number": item.line_number,
                        "contractor_article": item.contractor_article,
                        "description": item.description,
                        "agb_article": best_match.get("agb_article", ""),
                        "bl_article": best_match.get("bl_article", ""),
                        "match_confidence": int(best_match.get("confidence", 0)),
                        "packaging_factor": int(best_match.get("packaging", 1)),
                        "recalculated_quantity": item.quantity * int(best_match.get("packaging", 1)),
                        "source": "new",
                        "search_type": ai_result.get("search_type", "general")
                    })
                else:
                    # Не найдено соответствие
                    matched_items.append({
                        "line_number": item.line_number,
                        "contractor_article": item.contractor_article,
                        "description": item.description,
                        "agb_article": None,
                        "bl_article": None,
                        "match_confidence": 0,
                        "packaging_factor": 1.0,
                        "recalculated_quantity": item.quantity,
                        "source": "not_found"
                    })
        
        # Сохраняем новые сопоставления
        if new_mappings:
            await db.commit()
        
        return {
            "total_items": len(items),
            "matched_items": len([item for item in matched_items if item["agb_article"]]),
            "new_mappings_count": len(new_mappings),
            "existing_mappings_count": len([item for item in matched_items if item["source"] == "existing"]),
            "not_found_count": len([item for item in matched_items if item["source"] == "not_found"]),
            "results": matched_items
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при сопоставлении: {str(e)}")


@router.post("/requests/{request_id}/match/")
async def match_request_items(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Выполняет сопоставление артикулов для заявки"""
    try:
        # Проверяем права доступа
        if current_user.role not in ['ved_passport', 'admin']:
            raise HTTPException(status_code=403, detail="Недостаточно прав для сопоставления")
        
        # Проверяем, что заявка принадлежит пользователю
        result = await db.execute(
            select(ContractorRequest).where(ContractorRequest.id == request_id)
        )
        request = result.scalar_one_or_none()
        
        if not request or request.created_by != current_user.id:
            raise HTTPException(status_code=404, detail="Заявка не найдена")
        
        # Выполняем сопоставление
        matching_results = await perform_matching(request_id, db)
        
        return matching_results
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при сопоставлении: {str(e)}")


@router.post("/test-upload-excel/")
async def test_upload_excel(
    file: UploadFile = File(...),
    contractor_name: str = "Контрагент",
    db: AsyncSession = Depends(get_db)
):
    """Тестовый endpoint для загрузки Excel без аутентификации"""
    try:
        # Читаем Excel файл
        content = await file.read()
        df = pd.read_excel(io.BytesIO(content))
        
        # Генерируем номер заявки
        request_number = f"TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Создаем заявку
        new_request = ContractorRequest(
            request_number=request_number,
            contractor_name=contractor_name,
            request_date=datetime.now(),
            total_items=5,  # Тестовая заявка из 5 позиций
            created_by=1  # Тестовый пользователь
        )
        
        db.add(new_request)
        await db.flush()
        
        # Создаем тестовую заявку на основе примера
        test_items = [
            {"article": "1299650", "description": "Шпиндель верхней части керноприемника H/HU, 25231, SDT", "quantity": 5, "unit": "шт"},
            {"article": "1298240", "description": "Втулка удержания жидкости 306131, SDT", "quantity": 12, "unit": "шт"},
            {"article": "1298244", "description": "Пружина мягкая N/H/P, удержания жидкости, 104966, SDT", "quantity": 10, "unit": "шт"},
            {"article": "1299679", "description": "Щека верхняя для ключа разводного 24\", 14947, SDT", "quantity": 8, "unit": "шт"},
            {"article": "1299680", "description": "Щека верхняя для ключа разводного 36\", 14950, SDT", "quantity": 8, "unit": "шт"}
        ]
        
        items = []
        for index, item_data in enumerate(test_items):
            line_number = index + 1
            new_item = ContractorRequestItem(
                request_id=new_request.id,
                line_number=line_number,
                contractor_article=item_data["article"],
                description=item_data["description"],
                unit=item_data["unit"],
                quantity=item_data["quantity"],
                category="Для бурения"
            )
            db.add(new_item)
            items.append(new_item)
        
        await db.commit()
        await db.refresh(new_request)
        
        # Выполняем сопоставление
        matching_results = await perform_matching(new_request.id, db)
        
        return {
            "request": new_request,
            "matching_results": matching_results
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке файла: {str(e)}")


@router.post("/smart-search/")
async def smart_search_endpoint(
    request_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Тестовый endpoint для умного поиска через AI"""
    try:
        search_text = request_data.get("search_text", "")
        if not search_text:
            raise HTTPException(status_code=400, detail="Не указан текст для поиска")
        
        print(f"Выполняем умный поиск для: {search_text}")
        
        # Выполняем умный поиск
        result = await smart_search_with_ai(search_text, db)
        
        return result
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Ошибка в smart_search_endpoint: {str(e)}")
        print(f"Traceback: {error_details}")
        raise HTTPException(status_code=500, detail=f"Ошибка при поиске: {str(e)}")


@router.post("/smart-upload/")
async def smart_upload_file(
    file: UploadFile = File(...),
    contractor_name: str = "Контрагент",
    db: AsyncSession = Depends(get_db)
):
    """Умная загрузка любого файла с AI поиском"""
    try:
        print(f"Начинаем умную загрузку файла: {file.filename}")
        
        # Читаем файл
        content = await file.read()
        
        # Определяем тип файла и парсим содержимое
        file_extension = file.filename.split(".")[-1].lower() if file.filename else ""
        
        search_items = []
        
        if file_extension in ["xlsx", "xls"]:
            # Excel файл
            df = pd.read_excel(io.BytesIO(content))
            print(f"Excel файл содержит {len(df)} строк")
            
            # Извлекаем все текстовые данные из Excel
            for index, row in df.iterrows():
                for col in df.columns:
                    cell_value = str(row[col]).strip()
                    if len(cell_value) > 3 and cell_value != "nan":
                        search_items.append({
                            "text": cell_value,
                            "row": index + 1,
                            "column": col
                        })
        
        elif file_extension in ["txt", "csv"]:
            # Текстовый файл
            text_content = content.decode("utf-8", errors="ignore")
            lines = [line.strip() for line in text_content.split("\n") if line.strip()]
            
            for index, line in enumerate(lines):
                if len(line) > 3:
                    search_items.append({
                        "text": line,
                        "row": index + 1,
                        "column": "text"
                    })
        
        else:
            # Пытаемся прочитать как текст
            try:
                text_content = content.decode("utf-8", errors="ignore")
                lines = [line.strip() for line in text_content.split("\n") if line.strip()]
                
                for index, line in enumerate(lines):
                    if len(line) > 3:
                        search_items.append({
                            "text": line,
                            "row": index + 1,
                            "column": "text"
                        })
            except:
                raise HTTPException(status_code=400, detail="Неподдерживаемый формат файла")
        
        if not search_items:
            raise HTTPException(status_code=400, detail="Не удалось извлечь данные из файла")
        
        print(f"Извлечено {len(search_items)} элементов для поиска")
        
        # Создаем заявку
        request_number = f"SMART_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        new_request = ContractorRequest(
            request_number=request_number,
            contractor_name=contractor_name,
            request_date=datetime.now(),
            total_items=len(search_items),
            created_by=1  # Тестовый пользователь
        )
        
        db.add(new_request)
        await db.flush()
        
        # Создаем элементы заявки
        items = []
        for search_item in search_items:
            # Создаем элемент заявки
            item = ContractorRequestItem(
                request_id=new_request.id,
                line_number=search_item["row"],
                contractor_article=search_item["text"][:50],  # Ограничиваем длину
                description=search_item["text"],
                quantity=1,  # По умолчанию
                unit="шт",
                category="AI поиск"
            )
            db.add(item)
            items.append(item)
        
        await db.commit()
        await db.refresh(new_request)
        
        # Выполняем финальное сопоставление
        matching_results = await perform_matching(new_request.id, db)
        
        return {
            "request": new_request,
            "matching_results": matching_results,
            "search_items_count": len(search_items),
            "file_type": file_extension
        }
        
    except Exception as e:
        await db.rollback()
        import traceback
        error_details = traceback.format_exc()
        print(f"Ошибка в smart_upload_file: {str(e)}")
        print(f"Traceback: {error_details}")
        raise HTTPException(status_code=500, detail=f"Ошибка при умной загрузке файла: {str(e)}")


@router.post("/step-upload/")
async def step_upload_file(
    file: UploadFile = File(...),
    contractor_name: str = "Контрагент",
    db: AsyncSession = Depends(get_db)
):
    """Пошаговая загрузка файла с видимыми этапами"""
    try:
        print(f"🚀 Этап 1: Начинаем загрузку файла: {file.filename}")
        
        # Этап 1: Читаем файл
        content = await file.read()
        print(f"✅ Этап 1 завершен: Файл прочитан ({len(content)} байт)")
        
        # Этап 2: Определяем тип файла и парсим содержимое
        file_extension = file.filename.split(".")[-1].lower() if file.filename else ""
        print(f"🔍 Этап 2: Анализируем файл типа {file_extension}")
        
        search_items = []
        
        if file_extension in ["xlsx", "xls"]:
            # Excel файл
            df = pd.read_excel(io.BytesIO(content))
            print(f"📊 Этап 2: Excel файл содержит {len(df)} строк")
            
            # Обрабатываем каждую строку как единое целое
            for index, row in df.iterrows():
                # Объединяем все ячейки строки в один текст
                row_text = " ".join([str(cell).strip() for cell in row.values if str(cell).strip() != "nan" and len(str(cell).strip()) > 0])
                
                if len(row_text) > 3:
                    search_items.append({
                        "text": row_text,
                        "row": index + 1,
                        "column": "row"
                    })
        
        elif file_extension in ["txt", "csv"]:
            # Текстовый файл
            text_content = content.decode("utf-8", errors="ignore")
            lines = [line.strip() for line in text_content.split("\n") if line.strip()]
            
            for index, line in enumerate(lines):
                if len(line) > 3:
                    search_items.append({
                        "text": line,
                        "row": index + 1,
                        "column": "text"
                    })
        
        else:
            # Пытаемся прочитать как текст
            try:
                text_content = content.decode("utf-8", errors="ignore")
                lines = [line.strip() for line in text_content.split("\n") if line.strip()]
                
                for index, line in enumerate(lines):
                    if len(line) > 3:
                        search_items.append({
                            "text": line,
                            "row": index + 1,
                            "column": "text"
                        })
            except:
                raise HTTPException(status_code=400, detail="Неподдерживаемый формат файла")
        
        if not search_items:
            raise HTTPException(status_code=400, detail="Не удалось извлечь данные из файла")
        
        print(f"✅ Этап 2 завершен: Извлечено {len(search_items)} элементов для поиска")
        
        # Этап 3: Создаем заявку в базе данных
        print(f"💾 Этап 3: Создаем заявку в базе данных")
        
        # Генерируем номер заявки в формате {название_контрагента}_{порядковый_номер}_{дата}
        contractor_name_latin = transliterate_to_latin(contractor_name)
        print(f"🔤 Транслитерация: '{contractor_name}' -> '{contractor_name_latin}'")
        
        # Получаем количество заявок для этого контрагента сегодня
        today = datetime.now().date()
        count_result = await db.execute(
            select(func.count(ContractorRequest.id)).where(
                ContractorRequest.contractor_name == contractor_name,
                func.date(ContractorRequest.request_date) == today
            )
        )
        request_count = count_result.scalar() + 1
        
        request_number = f"{contractor_name_latin}_{request_count:03d}_{datetime.now().strftime('%Y%m%d')}"
        new_request = ContractorRequest(
            request_number=request_number,
            contractor_name=contractor_name,
            request_date=datetime.now(),
            total_items=0,  # Будет обновлено после AI обработки
            created_by=1  # Тестовый пользователь
        )
        
        db.add(new_request)
        await db.flush()
        
        # Создаем элементы заявки с AI извлечением артикулов
        items = []
        total_articles_found = 0
        
        print(f"🔍 Этап 3: Извлекаем артикулы из {len(search_items)} строк через AI")
        
        for i, search_item in enumerate(search_items):
            print(f"📝 Обрабатываем строку {i+1}/{len(search_items)}: {search_item['text'][:50]}...")
            
            # Извлекаем артикулы из строки через AI
            articles = await extract_articles_from_text(search_item["text"])
            
            if articles:
                print(f"  ✅ Найдено {len(articles)} артикулов")
                total_articles_found += len(articles)
                
                # Создаем элемент заявки для каждого найденного артикула
                for article_data in articles:
                    item = ContractorRequestItem(
                        request_id=new_request.id,
                        line_number=search_item["row"],
                        contractor_article=article_data.get("article", "")[:50],
                        description=article_data.get("description", search_item["text"]),
                        quantity=article_data.get("quantity", 1),
                        unit=article_data.get("unit", "шт"),
                        category="AI извлечение"
                    )
                    db.add(item)
                    items.append(item)
            else:
                print(f"  ❌ Артикулы не найдены")
                # Создаем элемент заявки с исходным текстом
                item = ContractorRequestItem(
                    request_id=new_request.id,
                    line_number=search_item["row"],
                    contractor_article="",  # Артикул не найден
                    description=search_item["text"],
                    quantity=1,
                    unit="шт",
                    category="Без артикула"
                )
                db.add(item)
                items.append(item)
        
        # Обновляем общее количество элементов
        new_request.total_items = len(items)
        
        await db.commit()
        print(f"✅ Этап 3 завершен: Заявка создана с ID {new_request.id}")
        print(f"📊 Статистика: {len(search_items)} строк -> {total_articles_found} артикулов -> {len(items)} элементов заявки")
        
        # Этап 4: Запускаем сопоставление в фоне
        print(f"🔄 Этап 4: Запускаем сопоставление в фоне")
        import asyncio
        asyncio.create_task(perform_background_matching(new_request.id))
        
        # Возвращаем только простые данные без сложных объектов
        return {
            "success": True,
            "request_id": new_request.id,
            "request_number": request_number,
            "contractor_name": contractor_name,
            "rows_processed": len(search_items),
            "articles_found": total_articles_found,
            "total_items": len(items),
            "file_type": file_extension,
            "message": f"Файл загружен успешно. Обработано {len(search_items)} строк, найдено {total_articles_found} артикулов. Сопоставление выполняется в фоне.",
            "status": "uploaded"
        }
        
    except Exception as e:
        await db.rollback()
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Ошибка в step_upload_file: {str(e)}")
        print(f"Traceback: {error_details}")
        raise HTTPException(status_code=500, detail=f"Ошибка при загрузке файла: {str(e)}")


async def perform_background_matching(request_id: int):
    """Выполняет сопоставление в фоне"""
    from database import get_db
    
    # Создаем новую сессию для фоновой задачи
    async for db in get_db():
        try:
            print(f"🔄 Начинаем фоновое сопоставление для заявки {request_id}")
            
            # Получаем элементы заявки
            result = await db.execute(
                select(ContractorRequestItem).where(ContractorRequestItem.request_id == request_id)
            )
            items = result.scalars().all()
            
            if not items:
                print(f"❌ Элементы заявки {request_id} не найдены")
                break
            
            print(f"📋 Найдено {len(items)} элементов для сопоставления")
            
            # Выполняем сопоставление для каждого элемента
            matched_count = 0
            for i, item in enumerate(items):
                print(f"🔍 Сопоставляем {i+1}/{len(items)}: {item.description[:50]}...")
                
                try:
                    # Выполняем умный поиск
                    ai_result = await smart_search_with_ai(item.description, db)
                    
                    if ai_result.get("matches"):
                        # Берем лучшее соответствие
                        best_match = ai_result["matches"][0]
                        
                        # Создаем сопоставление
                        mapping = ArticleMapping(
                            contractor_article=item.contractor_article,
                            contractor_description=item.description,
                            agb_article=best_match.get("agb_article", ""),
                            agb_description=best_match.get("name", ""),
                            bl_article=best_match.get("bl_article", ""),
                            match_confidence=int(best_match.get("confidence", 0)),
                            packaging_factor=int(best_match.get("packaging", 1)),
                            recalculated_quantity=item.quantity * int(best_match.get("packaging", 1))
                        )
                        db.add(mapping)
                        matched_count += 1
                        
                        print(f"  ✅ Найдено: {best_match.get('agb_article', '')} | {best_match.get('name', '')} | {best_match.get('confidence', 0)}%")
                    else:
                        print(f"  ❌ Не найдено соответствий")
                        
                except Exception as e:
                    print(f"  ⚠️ Ошибка при сопоставлении: {str(e)}")
                    continue
            
            await db.commit()
            print(f"🎉 Фоновое сопоставление завершено. Найдено {matched_count} соответствий.")
            break  # Выходим из цикла async for
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Ошибка в фоновом сопоставлении: {str(e)}")
            break  # Выходим из цикла async for


@router.post("/test-upload-text/")
async def test_upload_text_request(
    request_data: TextUploadRequest,
    db: AsyncSession = Depends(get_db)
):
    """Тестовый endpoint для загрузки текста без аутентификации"""
    try:
        # Парсим текст для извлечения позиций
        items = parse_text_to_items(request_data.text)
        
        if not items:
            raise HTTPException(status_code=400, detail="Не удалось извлечь позиции из текста")
        
        # Создаем заявку с правильным номером
        contractor_name = request_data.contractor_name
        
        # Генерируем номер заявки в формате {название_контрагента}_{порядковый_номер}_{дата}
        contractor_name_latin = transliterate_to_latin(contractor_name)
        print(f"🔤 Транслитерация: '{contractor_name}' -> '{contractor_name_latin}'")
        
        # Получаем количество заявок для этого контрагента сегодня
        today = datetime.now().date()
        count_result = await db.execute(
            select(func.count(ContractorRequest.id)).where(
                ContractorRequest.contractor_name == contractor_name,
                func.date(ContractorRequest.request_date) == today
            )
        )
        request_count = count_result.scalar() + 1
        
        request_number = f"{contractor_name_latin}_{request_count:03d}_{datetime.now().strftime('%Y%m%d')}"
        
        request = ContractorRequest(
            request_number=request_number,
            contractor_name=contractor_name,
            request_date=datetime.now(),
            total_items=len(items),
            status='new',
            created_by=1  # Тестовый пользователь
        )
        
        db.add(request)
        await db.flush()  # Получаем ID заявки
        
        # Создаем позиции заявки
        for i, item_data in enumerate(items):
            item = ContractorRequestItem(
                request_id=request.id,
                line_number=i + 1,  # Добавляем номер строки
                contractor_article=item_data.get('article', ''),
                description=item_data.get('description', ''),
                quantity=item_data.get('quantity', 1),
                unit=item_data.get('unit', 'шт'),
                category="Текстовый ввод"
            )
            db.add(item)
        
        await db.commit()
        
        return {
            "success": True,
            "request": {
                "id": request.id,
                "request_number": request_number,
                "contractor_name": contractor_name,
                "total_items": len(items),
                "status": "new"
            },
            "message": f"Текстовая заявка создана успешно. Обработано {len(items)} позиций."
        }
        
    except Exception as e:
        await db.rollback()
        print(f"❌ Ошибка в тестовом текстовом вводе: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка при создании заявки: {str(e)}")

@router.post("/test-match/{request_id}")
async def test_match_request(
    request_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Тестовый endpoint для сопоставления без аутентификации"""
    try:
        print(f"🔄 Тестовое сопоставление для заявки {request_id}")
        
        # Получаем элементы заявки
        result = await db.execute(
            select(ContractorRequestItem).where(ContractorRequestItem.request_id == request_id)
        )
        items = result.scalars().all()
        
        if not items:
            raise HTTPException(status_code=404, detail="Элементы заявки не найдены")
        
        print(f"📋 Найдено {len(items)} элементов для сопоставления")
        
        # Выполняем сопоставление для каждого элемента
        matched_count = 0
        unmatched_count = 0
        
        for i, item in enumerate(items):
            print(f"🔍 Сопоставляем {i+1}/{len(items)}: {item.description[:50]}...")
            
            try:
                # Выполняем умный поиск
                ai_result = await smart_search_with_ai(item.description, db)
                
                if ai_result.get("matches"):
                    # Берем лучшее соответствие
                    best_match = ai_result["matches"][0]
                    
                    # Создаем сопоставление
                    mapping = ArticleMapping(
                        contractor_article=item.contractor_article,
                        contractor_description=item.description,
                        agb_article=best_match.get("agb_article", ""),
                        agb_description=best_match.get("name", ""),
                        bl_article=best_match.get("bl_article", ""),
                        match_confidence=int(best_match.get("confidence", 0)),
                        packaging_factor=int(best_match.get("packaging", 1)),
                        recalculated_quantity=item.quantity * int(best_match.get("packaging", 1))
                    )
                    db.add(mapping)
                    matched_count += 1
                    
                    print(f"  ✅ Найдено: {best_match.get('agb_article', '')} | {best_match.get('name', '')} | {best_match.get('confidence', 0)}%")
                else:
                    unmatched_count += 1
                    print(f"  ❌ Не найдено соответствий")
                    
            except Exception as e:
                print(f"  ⚠️ Ошибка при сопоставлении: {str(e)}")
                unmatched_count += 1
                continue
        
        # Сохраняем все изменения
        await db.commit()
        
        return {
            "total_items": len(items),
            "matched_items": matched_count,
            "unmatched_items": unmatched_count,
            "message": f"Сопоставление завершено. Найдено {matched_count} из {len(items)} позиций."
        }
        
    except Exception as e:
        await db.rollback()
        print(f"❌ Ошибка в тестовом сопоставлении: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка при сопоставлении: {str(e)}")


@router.get("/status/{request_id}")
async def get_request_status(
    request_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получить статус обработки заявки"""
    try:
        # Получаем заявку
        result = await db.execute(
            select(ContractorRequest).where(ContractorRequest.id == request_id)
        )
        request = result.scalar_one_or_none()
        
        if not request:
            raise HTTPException(status_code=404, detail="Заявка не найдена")
        
        # Получаем количество найденных сопоставлений
        mapping_result = await db.execute(
            select(func.count(ArticleMapping.id))
        )
        total_mappings = mapping_result.scalar()
        
        # Получаем элементы заявки
        items_result = await db.execute(
            select(ContractorRequestItem).where(ContractorRequestItem.request_id == request_id)
        )
        items = items_result.scalars().all()
        
        return {
            "request_id": request_id,
            "request_number": request.request_number,
            "status": "completed" if len(items) > 0 else "processing",
            "total_items": len(items),
            "total_mappings": total_mappings,
            "message": "Обработка завершена" if len(items) > 0 else "Обработка в процессе"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении статуса: {str(e)}")


@router.post("/requests/{request_id}/smart-match/")
async def smart_match_request(
    request_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Умное сопоставление заявки через AI"""
    try:
        print(f"Начинаем умное сопоставление заявки {request_id}")
        
        # Получаем элементы заявки
        result = await db.execute(
            select(ContractorRequestItem).where(ContractorRequestItem.request_id == request_id)
        )
        items = result.scalars().all()
        
        if not items:
            raise HTTPException(status_code=404, detail="Элементы заявки не найдены")
        
        print(f"Найдено {len(items)} элементов для сопоставления")
        
        # Выполняем сопоставление для каждого элемента
        matched_count = 0
        for item in items:
            print(f"Сопоставляем: {item.description}")
            
            # Выполняем умный поиск
            ai_result = await smart_search_with_ai(item.description, db)
            
            if ai_result.get("matches"):
                # Берем лучшее соответствие
                best_match = ai_result["matches"][0]
                
                # Создаем сопоставление
                mapping = ArticleMapping(
                    contractor_article=item.contractor_article,
                    contractor_description=item.description,
                    agb_article=best_match.get("agb_article", ""),
                    agb_description=best_match.get("name", ""),
                    bl_article=best_match.get("bl_article", ""),
                    match_confidence=int(best_match.get("confidence", 0)),
                    packaging_factor=int(best_match.get("packaging", 1)),
                    recalculated_quantity=item.quantity * int(best_match.get("packaging", 1))
                )
                db.add(mapping)
                matched_count += 1
                
                print(f"  ✅ Найдено: {best_match.get('agb_article', '')} | {best_match.get('name', '')} | {best_match.get('confidence', 0)}%")
            else:
                print(f"  ❌ Не найдено соответствий")
        
        await db.commit()
        
        # Выполняем финальное сопоставление
        matching_results = await perform_matching(request_id, db)
        
        return {
            "request_id": request_id,
            "matching_results": matching_results,
            "matched_count": matched_count,
            "message": f"Сопоставление завершено. Найдено {matched_count} новых соответствий."
        }
        
    except Exception as e:
        await db.rollback()
        import traceback
        error_details = traceback.format_exc()
        print(f"Ошибка в smart_match_request: {str(e)}")
        print(f"Traceback: {error_details}")
        raise HTTPException(status_code=500, detail=f"Ошибка при сопоставлении: {str(e)}")


@router.get("/test-requests/")
async def test_get_requests(db: AsyncSession = Depends(get_db)):
    """Тестовый endpoint для получения заявок без аутентификации"""
    try:
        result = await db.execute(
            select(ContractorRequest)
            .options(selectinload(ContractorRequest.items))
            .order_by(ContractorRequest.created_at.desc())
            .limit(10)
        )
        requests = result.scalars().all()
        
        return {
            "count": len(requests),
            "data": requests
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка при получении заявок: {str(e)}")
