#!/usr/bin/env python3
"""
Отладка парсинга строк
"""

import sys
import os
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

from api.v1.endpoints.article_matching import parse_item_string, get_normalized_text

def test_parsing():
    """Тестируем парсинг различных строк"""
    
    test_strings = [
        "1299650",
        "1299650 Шпиндель верхней части керноприемника",
        "BL-123456 болт М12",
        "АГБ-789012 гайка М10",
        "10 шт гайка М10",
        "труба 100м",
        "Найди болты М8",
        "Покажи все гайки"
    ]
    
    print("🔍 Тестируем парсинг строк:")
    print("=" * 60)
    
    for test_str in test_strings:
        print(f"\nИсходная строка: '{test_str}'")
        
        # Нормализация
        normalized = get_normalized_text(test_str)
        print(f"Нормализованная: '{normalized}'")
        
        # Парсинг
        parsed = parse_item_string(normalized)
        print(f"Результат парсинга:")
        print(f"  - agb_article: '{parsed['agb_article']}'")
        print(f"  - description: '{parsed['description']}'")
        print(f"  - quantity: {parsed['quantity']}")
        print(f"  - unit: '{parsed['unit']}'")

if __name__ == "__main__":
    test_parsing()
