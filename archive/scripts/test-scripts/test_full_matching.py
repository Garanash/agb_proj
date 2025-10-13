#!/usr/bin/env python3
"""
Полный тест новой логики сопоставления артикулов
"""

import asyncio
import sys
from pathlib import Path

# Добавляем корневую директорию проекта в путь
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from database import get_db
from api.v1.endpoints.article_matching import step_upload_file, perform_matching
from models import ContractorRequest, ContractorRequestItem
from sqlalchemy import select

async def test_full_matching():
    """Полный тест загрузки и сопоставления"""
    
    print("🧪 Полный тест новой логики сопоставления артикулов\n")
    
    # Читаем тестовый файл
    test_file_path = Path("/Users/andreydolgov/Desktop/programming/agb_proj/test_articles_new.txt")
    if not test_file_path.exists():
        print("❌ Тестовый файл не найден")
        return
    
    with open(test_file_path, 'r', encoding='utf-8') as f:
        test_content = f.read()
    
    print("📄 Содержимое тестового файла:")
    print(test_content)
    print()
    
    async for db in get_db():
        try:
            # Создаем тестовую заявку
            from datetime import datetime
            from models import User
            
            # Получаем первого пользователя для тестирования
            result = await db.execute(select(User).limit(1))
            user = result.scalar_one_or_none()
            if not user:
                print("❌ Нет пользователей в базе данных")
                return
            
            # Создаем заявку
            request = ContractorRequest(
                request_number="TEST_001_20241201",
                contractor_name="Тестовый контрагент",
                request_date=datetime.now(),
                total_items=0,
                status='new',
                created_by=user.id
            )
            
            db.add(request)
            await db.flush()
            
            print(f"✅ Создана тестовая заявка: {request.request_number}")
            
            # Парсим строки и создаем элементы заявки
            from api.v1.endpoints.article_matching import parse_item_string
            
            lines = [line.strip() for line in test_content.strip().split('\n') if line.strip()]
            items = []
            
            for i, line in enumerate(lines, 1):
                if len(line) > 4:
                    parsed = parse_item_string(line)
                    
                    item = ContractorRequestItem(
                        request_id=request.id,
                        line_number=i,
                        contractor_article=parsed['article'],
                        description=parsed['description'],
                        quantity=parsed['quantity'],
                        unit=parsed['unit'],
                        category="Тест"
                    )
                    db.add(item)
                    items.append(item)
                    
                    print(f"📝 Строка {i}: артикул='{parsed['article']}', описание='{parsed['description']}', кол-во={parsed['quantity']} {parsed['unit']}")
            
            # Обновляем количество элементов
            request.total_items = len(items)
            await db.commit()
            
            print(f"\n✅ Создано {len(items)} элементов заявки")
            
            # Выполняем сопоставление
            print("\n🔍 Выполняем сопоставление...")
            matching_results = await perform_matching(request.id, db)
            
            print(f"\n📊 Результаты сопоставления:")
            print(f"  Всего элементов: {matching_results.get('total_items', 0)}")
            print(f"  Сопоставлено: {matching_results.get('matched_items', 0)}")
            print(f"  Не найдено: {matching_results.get('unmatched_items', 0)}")
            
            # Показываем детали сопоставления
            if matching_results.get('results'):
                print(f"\n📋 Детали сопоставления:")
                for result in matching_results['results'][:5]:  # Показываем первые 5
                    print(f"  • {result.get('contractor_article', 'N/A')} -> {result.get('agb_article', 'N/A')} ({result.get('match_confidence', 0)}%)")
            
            # Проверяем созданные сопоставления в базе данных
            from models import ArticleMapping
            result = await db.execute(select(ArticleMapping))
            mappings = result.scalars().all()
            
            print(f"\n💾 Создано сопоставлений в базе: {len(mappings)}")
            for mapping in mappings[:3]:  # Показываем первые 3
                print(f"  • {mapping.contractor_article} -> {mapping.agb_article} ({mapping.match_confidence}%)")
            
        except Exception as e:
            print(f"❌ Ошибка при тестировании: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await db.close()
        break

if __name__ == "__main__":
    asyncio.run(test_full_matching())
