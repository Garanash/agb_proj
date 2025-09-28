#!/usr/bin/env python3
"""
Рабочий тест ИИ сопоставления
"""

import asyncio
import sys
import os
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

from database import get_db
from models import MatchingNomenclature
from sqlalchemy import select, or_
import re
import json

async def working_search(search_text: str):
    """Рабочий поиск товаров"""
    print(f"🔍 Поиск: '{search_text}'")
    
    # Парсим запрос
    numbers = re.findall(r'\d{4,8}', search_text)
    words = re.findall(r'[а-яА-Яa-zA-Z]{3,}', search_text)
    
    print(f"   Числа: {numbers}")
    print(f"   Слова: {words}")
    
    async for db in get_db():
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
        
        result = {
            "search_type": "working_search",
            "matches": matches
        }
        
        print(f"✅ Найдено {len(matches)} совпадений")
        print(f"Результат: {json.dumps(result, ensure_ascii=False, indent=2)}")
        
        return result

async def test_all_scenarios():
    """Тестируем все сценарии"""
    print("🚀 ТЕСТИРОВАНИЕ ИИ СОПОСТАВЛЕНИЯ")
    print("=" * 60)
    
    test_cases = [
        # Тест 1: Поиск по артикулу BL
        {
            "name": "Поиск по артикулу BL",
            "query": "25241",
            "expected": "Переходная муфта HQ"
        },
        
        # Тест 2: Поиск по артикулу АГБ
        {
            "name": "Поиск по артикулу АГБ", 
            "query": "4535774",
            "expected": "Кольцо кернорвательное HQ"
        },
        
        # Тест 3: Поиск по описанию
        {
            "name": "Поиск по описанию",
            "query": "переходная муфта",
            "expected": "Переходная муфта"
        },
        
        # Тест 4: Поиск по частичному описанию
        {
            "name": "Поиск по частичному описанию",
            "query": "кольцо кернорвательное",
            "expected": "Кольцо кернорвательное"
        },
        
        # Тест 5: Поиск по типу товара
        {
            "name": "Поиск по типу товара",
            "query": "болт",
            "expected": "болт"
        },
        
        # Тест 6: Поиск по типу товара
        {
            "name": "Поиск по типу товара",
            "query": "гайка",
            "expected": "гайка"
        },
        
        # Тест 7: Сложный запрос с артикулом и описанием
        {
            "name": "Сложный запрос с артикулом и описанием",
            "query": "BL-123456 болт М12",
            "expected": "болт"
        },
        
        # Тест 8: Сложный запрос с артикулом и описанием
        {
            "name": "Сложный запрос с артикулом и описанием",
            "query": "АГБ-789012 гайка М10",
            "expected": "гайка"
        }
    ]
    
    results = []
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n{'='*60}")
        print(f"ТЕСТ {i}: {test_case['name']}")
        print(f"Запрос: '{test_case['query']}'")
        print(f"Ожидаемый результат: '{test_case['expected']}'")
        
        try:
            result = await working_search(test_case['query'])
            
            # Проверяем результат
            success = False
            if result['matches']:
                for match in result['matches']:
                    if test_case['expected'].lower() in match['name'].lower():
                        success = True
                        break
            
            test_result = {
                "test_name": test_case['name'],
                "query": test_case['query'],
                "expected": test_case['expected'],
                "success": success,
                "matches_count": len(result['matches']),
                "top_match": result['matches'][0]['name'] if result['matches'] else None
            }
            
            results.append(test_result)
            
            if success:
                print(f"✅ ТЕСТ ПРОЙДЕН")
            else:
                print(f"❌ ТЕСТ НЕ ПРОЙДЕН")
                
        except Exception as e:
            print(f"❌ ОШИБКА В ТЕСТЕ: {e}")
            results.append({
                "test_name": test_case['name'],
                "query": test_case['query'],
                "expected": test_case['expected'],
                "success": False,
                "error": str(e)
            })
    
    # Итоговый отчет
    print(f"\n{'='*60}")
    print("ИТОГОВЫЙ ОТЧЕТ")
    print(f"{'='*60}")
    
    passed = sum(1 for r in results if r.get('success', False))
    total = len(results)
    
    print(f"Пройдено тестов: {passed}/{total}")
    print(f"Процент успеха: {(passed/total)*100:.1f}%")
    
    for result in results:
        status = "✅" if result.get('success', False) else "❌"
        print(f"{status} {result['test_name']}: {result.get('top_match', 'Нет совпадений')}")
    
    return results

if __name__ == "__main__":
    asyncio.run(test_all_scenarios())
