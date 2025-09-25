#!/usr/bin/env python3
"""
Скрипт для тестирования функционала сопоставления артикулов
"""

import asyncio
import sys
from pathlib import Path
import json
from datetime import datetime

# Добавляем путь к проекту
sys.path.append(str(Path(__file__).parent.parent))

from database import async_session
from models import ContractorRequest, ContractorRequestItem, ArticleMapping, VEDNomenclature
from sqlalchemy import select


async def create_test_request():
    """Создает тестовую заявку контрагента на основе примера"""
    
    print("🧪 Создаем тестовую заявку контрагента...")
    
    # Данные из примера заявки
    test_items = [
        {
            "line_number": 42,
            "contractor_article": "1299650",
            "description": "Шпиндель верхней части керноприемника H/HU, 25231, SDT",
            "unit": "шт",
            "quantity": 5,
            "category": "Для бурения"
        },
        {
            "line_number": 43,
            "contractor_article": "1298240",
            "description": "Втулка удержания жидкости 306131, SDT",
            "unit": "шт",
            "quantity": 12,
            "category": "Для бурения"
        },
        {
            "line_number": 44,
            "contractor_article": "1298244",
            "description": "Пружина мягкая N/H/P, удержания жидкости, 104966, SDT",
            "unit": "шт",
            "quantity": 10,
            "category": "Для бурения"
        },
        {
            "line_number": 45,
            "contractor_article": "1299679",
            "description": "Щека верхняя для ключа разводного 24\", 14947, SDT",
            "unit": "шт",
            "quantity": 8,
            "category": "Для бурения"
        },
        {
            "line_number": 46,
            "contractor_article": "1299680",
            "description": "Щека верхняя для ключа разводного 36\", 14950, SDT",
            "unit": "шт",
            "quantity": 8,
            "category": "Для бурения"
        },
        {
            "line_number": 47,
            "contractor_article": "1299682",
            "description": "Щека нижняя и штифт в сборе для ключа разводного 24\", 14946, SDT",
            "unit": "шт",
            "quantity": 8,
            "category": "Для бурения"
        }
    ]
    
    async with async_session() as db:
        try:
            # Создаем заявку
            request_number = f"TEST_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            test_request = ContractorRequest(
                request_number=request_number,
                contractor_name="Тестовый контрагент",
                request_date=datetime.now(),
                total_items=len(test_items),
                created_by=1  # Предполагаем, что пользователь с ID 1 существует
            )
            
            db.add(test_request)
            await db.flush()  # Получаем ID заявки
            
            # Создаем позиции заявки
            for item_data in test_items:
                test_item = ContractorRequestItem(
                    request_id=test_request.id,
                    line_number=item_data["line_number"],
                    contractor_article=item_data["contractor_article"],
                    description=item_data["description"],
                    unit=item_data["unit"],
                    quantity=item_data["quantity"],
                    category=item_data["category"]
                )
                db.add(test_item)
            
            await db.commit()
            
            print(f"✅ Тестовая заявка создана: {request_number}")
            print(f"📊 ID заявки: {test_request.id}")
            print(f"📋 Позиций: {len(test_items)}")
            
            return test_request.id
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Ошибка при создании тестовой заявки: {e}")
            raise


async def create_test_mappings():
    """Создает тестовые соответствия артикулов"""
    
    print("🔗 Создаем тестовые соответствия артикулов...")
    
    # Тестовые соответствия на основе примеров
    test_mappings = [
        {
            "contractor_article": "1299650",
            "contractor_description": "Шпиндель верхней части керноприемника H/HU, 25231, SDT",
            "agb_article": "AGB-SPINDLE-HU-25231",
            "agb_description": "Шпиндель верхней части керноприемника H/HU",
            "bl_article": "BL-SPINDLE-HU-25231",
            "bl_description": "Шпиндель верхней части керноприемника H/HU (BL)",
            "packaging_factor": 1,
            "unit": "шт"
        },
        {
            "contractor_article": "1298240",
            "contractor_description": "Втулка удержания жидкости 306131, SDT",
            "agb_article": "AGB-SLEEVE-306131",
            "agb_description": "Втулка удержания жидкости 306131",
            "bl_article": "BL-SLEEVE-306131",
            "bl_description": "Втулка удержания жидкости 306131 (BL)",
            "packaging_factor": 2,
            "unit": "шт"
        },
        {
            "contractor_article": "1298244",
            "contractor_description": "Пружина мягкая N/H/P, удержания жидкости, 104966, SDT",
            "agb_article": "AGB-SPRING-104966",
            "agb_description": "Пружина мягкая N/H/P, удержания жидкости, 104966",
            "bl_article": "BL-SPRING-104966",
            "bl_description": "Пружина мягкая N/H/P, удержания жидкости, 104966 (BL)",
            "packaging_factor": 5,
            "unit": "шт"
        }
    ]
    
    async with async_session() as db:
        try:
            loaded_count = 0
            
            for mapping_data in test_mappings:
                # Проверяем, не существует ли уже такое соответствие
                existing = await db.execute(
                    select(ArticleMapping).where(
                        ArticleMapping.contractor_article == mapping_data["contractor_article"],
                        ArticleMapping.agb_article == mapping_data["agb_article"]
                    )
                )
                if existing.scalar_one_or_none():
                    continue
                
                # Создаем новое соответствие
                new_mapping = ArticleMapping(
                    contractor_article=mapping_data["contractor_article"],
                    contractor_description=mapping_data["contractor_description"],
                    agb_article=mapping_data["agb_article"],
                    agb_description=mapping_data["agb_description"],
                    bl_article=mapping_data["bl_article"],
                    bl_description=mapping_data["bl_description"],
                    packaging_factor=mapping_data["packaging_factor"],
                    unit=mapping_data["unit"]
                )
                
                db.add(new_mapping)
                loaded_count += 1
            
            await db.commit()
            
            print(f"✅ Создано {loaded_count} тестовых соответствий")
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Ошибка при создании тестовых соответствий: {e}")
            raise


async def test_matching_algorithm():
    """Тестирует алгоритм сопоставления"""
    
    print("🔍 Тестируем алгоритм сопоставления...")
    
    from difflib import SequenceMatcher
    
    def calculate_similarity(text1: str, text2: str) -> float:
        """Вычисляет схожесть между двумя текстами"""
        return SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
    
    # Тестовые данные
    test_descriptions = [
        "Шпиндель верхней части керноприемника H/HU, 25231, SDT",
        "Втулка удержания жидкости 306131, SDT",
        "Пружина мягкая N/H/P, удержания жидкости, 104966, SDT",
        "Щека верхняя для ключа разводного 24\", 14947, SDT",
        "Щека верхняя для ключа разводного 36\", 14950, SDT",
        "Щека нижняя и штифт в сборе для ключа разводного 24\", 14946, SDT"
    ]
    
    test_nomenclature = [
        {"name": "Шпиндель верхней части керноприемника H/HU", "article": "AGB-SPINDLE-HU-25231"},
        {"name": "Втулка удержания жидкости 306131", "article": "AGB-SLEEVE-306131"},
        {"name": "Пружина мягкая N/H/P, удержания жидкости, 104966", "article": "AGB-SPRING-104966"},
        {"name": "Ключ разводной 24\"", "article": "AGB-WRENCH-24"},
        {"name": "Ключ разводной 36\"", "article": "AGB-WRENCH-36"},
        {"name": "Щека для ключа разводного 24\"", "article": "AGB-WRENCH-CHEEK-24"}
    ]
    
    print("\n📊 Результаты сопоставления:")
    print("-" * 80)
    
    for desc in test_descriptions:
        best_match = None
        best_score = 0.0
        
        for nom in test_nomenclature:
            name_score = calculate_similarity(desc, nom["name"])
            article_score = calculate_similarity(desc, nom["article"])
            combined_score = max(name_score, article_score * 0.8)
            
            if combined_score > best_score:
                best_score = combined_score
                best_match = nom
        
        if best_match and best_score > 0.3:
            print(f"✅ {desc[:50]}...")
            print(f"   → {best_match['name']} ({best_match['article']})")
            print(f"   → Уверенность: {int(best_score * 100)}%")
        else:
            print(f"❌ {desc[:50]}...")
            print(f"   → Соответствие не найдено")
        print()


async def main():
    """Основная функция тестирования"""
    
    print("🚀 Начинаем тестирование функционала сопоставления артикулов")
    print("=" * 70)
    
    try:
        # 1. Создаем тестовые соответствия
        await create_test_mappings()
        
        # 2. Создаем тестовую заявку
        request_id = await create_test_request()
        
        # 3. Тестируем алгоритм сопоставления
        await test_matching_algorithm()
        
        print("=" * 70)
        print("🎉 Тестирование завершено успешно!")
        print(f"📝 ID тестовой заявки: {request_id}")
        print("💡 Теперь можно протестировать API endpoints:")
        print(f"   - GET /api/v1/article-matching/requests/{request_id}")
        print(f"   - POST /api/v1/article-matching/requests/{request_id}/match")
        print(f"   - GET /api/v1/article-matching/requests/{request_id}/export/excel")
        
    except Exception as e:
        print(f"❌ Ошибка при тестировании: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())



