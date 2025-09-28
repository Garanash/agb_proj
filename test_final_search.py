#!/usr/bin/env python3
"""
Финальный тест ИИ сопоставления
"""

import asyncio
import sys
import os
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

from database import get_db
from models import MatchingNomenclature
from sqlalchemy import select, or_
import re

async def final_search_test():
    """Финальный тест поиска"""
    print("🚀 ФИНАЛЬНЫЙ ТЕСТ ИИ СОПОСТАВЛЕНИЯ")
    print("=" * 60)
    
    test_queries = [
        "25241",
        "4535774", 
        "переходная муфта",
        "кольцо кернорвательное",
        "болт",
        "гайка",
        "BL-123456 болт М12",
        "АГБ-789012 гайка М10"
    ]
    
    async for db in get_db():
        for query in test_queries:
            print(f"\n🔍 Поиск: '{query}'")
            
            # Парсим запрос
            numbers = re.findall(r'\d{4,8}', query)
            words = re.findall(r'[а-яА-Яa-zA-Z]{3,}', query)
            
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
            conditions.append(MatchingNomenclature.name.ilike(f"%{query}%"))
            
            if not conditions:
                print("   ❌ Нет условий для поиска")
                continue
            
            # Выполняем поиск
            query_obj = select(MatchingNomenclature).where(
                MatchingNomenclature.is_active == True
            ).where(or_(*conditions)).limit(5)
            
            result = await db.execute(query_obj)
            items = result.scalars().all()
            
            print(f"   ✅ Найдено {len(items)} совпадений:")
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
                
                if confidence < 100 and words:
                    word_matches = 0
                    for word in words:
                        if word.lower() in item.name.lower():
                            word_matches += 1
                    
                    if word_matches > 0:
                        word_confidence = (word_matches / len(words)) * 80
                        confidence = max(confidence, word_confidence)
                        match_reason = f"Совпадение по {word_matches} словам"
                
                print(f"      - {item.agb_article} | {item.bl_article} | {item.name[:50]}... | {confidence}% | {match_reason}")
        
        break

if __name__ == "__main__":
    asyncio.run(final_search_test())
