"""
Простой и быстрый поиск без ИИ
"""

from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from models import MatchingNomenclature
import re

def parse_simple_search(search_text: str) -> dict:
    """Простой парсинг поискового запроса"""
    search_text = search_text.strip()
    
    # Извлекаем числа (потенциальные артикулы)
    numbers = re.findall(r'\d{4,8}', search_text)
    
    # Извлекаем слова (потенциальные описания)
    words = re.findall(r'[а-яА-Яa-zA-Z]{3,}', search_text)
    
    return {
        'numbers': numbers,
        'words': words,
        'original': search_text
    }

async def simple_smart_search(search_text: str, db: AsyncSession) -> dict:
    """Простой умный поиск без ИИ"""
    try:
        print(f"🔍 simple_smart_search: '{search_text}'")
        
        # Парсим поисковый запрос
        parsed = parse_simple_search(search_text)
        print(f"   Числа: {parsed['numbers']}")
        print(f"   Слова: {parsed['words']}")
        
        # Создаем условия поиска
        conditions = []
        
        # Поиск по числам (артикулы)
        for number in parsed['numbers']:
            conditions.extend([
                MatchingNomenclature.agb_article.ilike(f"%{number}%"),
                MatchingNomenclature.bl_article.ilike(f"%{number}%"),
                MatchingNomenclature.code_1c.ilike(f"%{number}%")
            ])
        
        # Поиск по словам (названия)
        for word in parsed['words']:
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
            for number in parsed['numbers']:
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
            if confidence < 100 and parsed['words']:
                word_matches = 0
                for word in parsed['words']:
                    if word.lower() in item.name.lower():
                        word_matches += 1
                
                if word_matches > 0:
                    word_confidence = (word_matches / len(parsed['words'])) * 80
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
        print(f"❌ Ошибка в simple_smart_search: {e}")
        import traceback
        traceback.print_exc()
        return {"search_type": "error", "matches": []}
