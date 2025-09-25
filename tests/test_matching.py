#!/usr/bin/env python3
"""
Тестовый скрипт для проверки новой логики сопоставления артикулов
"""

import asyncio
import sys
from pathlib import Path

# Добавляем корневую директорию проекта в путь
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from database import get_db
from api.v1.endpoints.article_matching import smart_search_with_ai, parse_item_string

async def test_matching():
    """Тестирует новую логику сопоставления"""
    
    test_strings = [
        "ОХКУ-000184 УБР - Кундуми Смазка антивибрационная GRIZZLY (ведро 17 кг.) 10 шт",
        "BL-123456 Смазка моторная 5л",
        "123456 Смазка универсальная",
        "Смазка антивибрационная 15 шт",
    ]
    
    print("🧪 Тестирование новой логики сопоставления артикулов\n")
    
    async for db in get_db():
        try:
            for i, test_string in enumerate(test_strings, 1):
                print(f"Тест {i}: {test_string}")
                
                # Сначала парсим строку
                parsed = parse_item_string(test_string)
                print(f"  Парсинг: артикул='{parsed['article']}', описание='{parsed['description']}', кол-во={parsed['quantity']} {parsed['unit']}")
                
                # Затем ищем в базе данных
                result = await smart_search_with_ai(test_string, db)
                print(f"  Результат поиска: {result.get('search_type', 'unknown')}")
                print(f"  Найдено совпадений: {len(result.get('matches', []))}")
                
                if result.get('matches'):
                    for j, match in enumerate(result['matches'][:3], 1):
                        print(f"    {j}. {match.get('agb_article', 'N/A')} | {match.get('name', 'N/A')} | {match.get('confidence', 0)}%")
                else:
                    print("    Совпадений не найдено")
                
                print()
                
        except Exception as e:
            print(f"❌ Ошибка при тестировании: {e}")
        finally:
            await db.close()
        break

if __name__ == "__main__":
    asyncio.run(test_matching())
