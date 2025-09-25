#!/usr/bin/env python3
"""
Тестовый скрипт для проверки новой логики парсинга строк товаров
"""

import sys
from pathlib import Path

# Добавляем корневую директорию проекта в путь
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from api.v1.endpoints.article_matching import parse_item_string

def test_parsing():
    """Тестирует функцию парсинга строк товаров"""
    
    test_cases = [
        "ОХКУ-000184 УБР - Кундуми Смазка антивибрационная GRIZZLY (ведро 17 кг.) 10 шт",
        "BL-123456 Смазка моторная 5л",
        "123456 Смазка универсальная",
        "ОХКУ000184 Смазка специальная 2 кг",
        "Смазка антивибрационная 15 шт",
        "ОХКУ-184 Смазка (упаковка 1 кг) 20 шт",
        "BL123456 Смазка моторная 10л",
        "Смазка универсальная без артикула 5 шт",
    ]
    
    print("🧪 Тестирование функции парсинга строк товаров\n")
    
    for i, test_string in enumerate(test_cases, 1):
        print(f"Тест {i}: {test_string}")
        result = parse_item_string(test_string)
        print(f"  Артикул: '{result['article']}'")
        print(f"  Описание: '{result['description']}'")
        print(f"  Количество: {result['quantity']} {result['unit']}")
        print()

if __name__ == "__main__":
    test_parsing()
