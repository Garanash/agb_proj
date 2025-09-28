"""
Простой API для тестирования поиска
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from models import MatchingNomenclature
from sqlalchemy import select, or_
import re

router = APIRouter()

@router.post("/search/")
async def simple_search_api(
    request_data: dict,
    db: AsyncSession = Depends(get_db)
):
    """Простой API для поиска товаров"""
    try:
        search_text = request_data.get("search_text", "")
        if not search_text:
            raise HTTPException(status_code=400, detail="Не указан текст для поиска")
        
        print(f"🔍 simple_search_api: '{search_text}'")
        
        # Парсим запрос
        numbers = re.findall(r'\d{4,8}', search_text)
        words = re.findall(r'[а-яА-Яa-zA-Z]{3,}', search_text)
        
        print(f"   Числа: {numbers}")
        print(f"   Слова: {words}")
        
        # Создаем условия поиска
        conditions = []
        
        # Поиск по числам
        for number in numbers:
            conditions.extend([
                MatchingNomenclature.agb_article.ilike(f"%{number}%"),
                MatchingNomenclature.bl_article.ilike(f"%{number}%"),
                MatchingNomenclature.code_1c.ilike(f"%{number}%")
            ])
        
        # Поиск по словам
        for word in words:
            conditions.append(MatchingNomenclature.name.ilike(f"%{word}%"))
        
        # Поиск по полному тексту
        conditions.append(MatchingNomenclature.name.ilike(f"%{search_text}%"))
        
        if not conditions:
            return {"search_type": "no_conditions", "matches": []}
        
        # Выполняем поиск
        query = select(MatchingNomenclature).where(
            MatchingNomenclature.is_active == True
        ).where(or_(*conditions)).limit(20)
        
        result = await db.execute(query)
        items = result.scalars().all()
        
        # Формируем результаты
        matches = []
        for item in items:
            confidence = 0
            match_reason = ""
            
            # Вычисляем уверенность
            for number in numbers:
                if item.agb_article and number in item.agb_article:
                    confidence = max(confidence, 100)
                    match_reason = "Точное совпадение по артикулу АГБ"
                elif item.bl_article and number in item.bl_article:
                    confidence = max(confidence, 95)
                    match_reason = "Точное совпадение по артикулу BL"
                elif item.code_1c and number in item.code_1c:
                    confidence = max(confidence, 90)
                    match_reason = "Точное совпадение по коду 1С"
            
            # Проверяем совпадения по словам
            if confidence < 100 and words:
                word_matches = 0
                for word in words:
                    if word.lower() in item.name.lower():
                        word_matches += 1
                
                if word_matches > 0:
                    word_confidence = (word_matches / len(words)) * 80
                    confidence = max(confidence, word_confidence)
                    match_reason = f"Совпадение по {word_matches} словам"
            
            if confidence > 0:
                matches.append({
                    "agb_article": item.agb_article,
                    "bl_article": item.bl_article,
                    "name": item.name,
                    "code_1c": item.code_1c,
                    "confidence": int(confidence),
                    "match_reason": match_reason,
                    "is_existing": False
                })
        
        # Сортируем по уверенности
        matches.sort(key=lambda x: x['confidence'], reverse=True)
        
        print(f"✅ Найдено {len(matches)} совпадений")
        return {
            "search_type": "simple_search",
            "matches": matches
        }
        
    except Exception as e:
        print(f"❌ Ошибка в simple_search_api: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Ошибка при поиске: {str(e)}")
