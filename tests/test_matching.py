#!/usr/bin/env python3
import asyncio
import sys
import os

# Добавляем путь к проекту
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

from database import get_db
from models import MatchingNomenclature
from sqlalchemy import select
from difflib import SequenceMatcher
import pymorphy2
import re
from functools import lru_cache

# Инициализируем морфологический анализатор
morph = pymorphy2.MorphAnalyzer()

def normalize_russian_text(text: str) -> str:
    """
    Приводит русский текст к нормальной форме (именительный падеж, единственное число).
    Также извлекает числа и специальные символы.
    """
    if not text:
        return ""
    
    # Сохраняем числа и специальные символы
    numbers_and_special = re.findall(r'\d+|[^\w\s]', text)
    
    # Разбиваем текст на слова
    words = re.findall(r'\b[а-яА-Я]+\b', text)
    
    # Нормализуем каждое слово
    normalized_words = []
    for word in words:
        # Получаем все возможные разборы слова
        parsed = morph.parse(word)
        if parsed:
            # Берем наиболее вероятный разбор
            normal_form = parsed[0].normal_form
            normalized_words.append(normal_form)
    
    # Собираем текст обратно, включая числа и специальные символы
    result = ' '.join(normalized_words + numbers_and_special)
    return result.strip()

@lru_cache(maxsize=1000)
def get_normalized_text(text: str) -> str:
    """
    Кэширующая обертка для normalize_russian_text
    """
    return normalize_russian_text(text)

async def test_matching():
    """Тестируем алгоритм поиска"""
    async for db in get_db():
        # Получаем данные из базы
        name_query = select(MatchingNomenclature).where(
            MatchingNomenclature.is_active == True
        )
        name_results = await db.execute(name_query)
        name_items = name_results.scalars().all()
        
        print(f"Загружено {len(name_items)} элементов из базы данных")
        
        # Тестируем поиск
        search_text = "Болт"
        normalized_search = get_normalized_text(search_text.lower())
        print(f"Поиск по '{search_text}' -> нормализовано: '{normalized_search}'")
        
        matches = []
        for item in name_items:
            normalized_item = get_normalized_text(item.name.lower())
            similarity = SequenceMatcher(None, normalized_search, normalized_item).ratio()
            
            if similarity >= 0.1:  # Низкий порог для отладки
                print(f"Найдено совпадение: '{item.name}' -> '{normalized_item}' (схожесть: {similarity:.2f})")
                matches.append({
                    'item': item,
                    'similarity': similarity,
                    'confidence': int(similarity * 100)
                })
        
        print(f"Найдено {len(matches)} совпадений")
        
        # Сортируем по убыванию схожести
        matches.sort(key=lambda x: x['similarity'], reverse=True)
        
        # Показываем топ-5 результатов
        for i, match in enumerate(matches[:5]):
            print(f"{i+1}. {match['item'].name} (схожесть: {match['similarity']:.2f})")
        
        break

if __name__ == "__main__":
    asyncio.run(test_matching())
