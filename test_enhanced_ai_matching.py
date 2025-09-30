#!/usr/bin/env python3
"""
Тестовый скрипт для проверки нового функционала анализа наименований через ИИ
"""

import asyncio
import sys
import os

# Добавляем путь к backend для импорта
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.database import get_db
from backend.api.v1.endpoints.article_matching import smart_search_with_ai, analyze_item_with_ai

async def test_ai_analysis():
    """Тестирует анализ наименований через ИИ"""
    print("🧪 Тестирование анализа наименований через ИИ")
    print("=" * 50)
    
    # Тестовые наименования
    test_items = [
        "Болт М12х20 оцинкованный",
        "Смазка литиевая Литол-24",
        "Прокладка резиновая круглая",
        "Труба стальная 50мм",
        "Краска эмаль ПФ-115 белая",
        "Кабель ВВГ 3х2.5",
        "Светильник LED потолочный",
        "Кран шаровый 1/2 дюйма"
    ]
    
    async for db in get_db():
        for item in test_items:
            print(f"\n🔍 Тестируем: '{item}'")
            print("-" * 30)
            
            # Тестируем анализ ИИ
            try:
                analysis = await analyze_item_with_ai(item, db)
                print(f"📊 Категория: {analysis.get('category', 'Неизвестно')}")
                print(f"🔑 Ключевые слова: {', '.join(analysis.get('keywords', []))}")
                print(f"📝 Синонимы: {', '.join(analysis.get('synonyms', []))}")
                print(f"🔍 Улучшенные запросы: {analysis.get('enhanced_queries', [])}")
                print(f"📋 Анализ: {analysis.get('analysis', 'Нет анализа')}")
            except Exception as e:
                print(f"❌ Ошибка анализа: {e}")
            
            # Тестируем умный поиск
            try:
                search_result = await smart_search_with_ai(item, db)
                search_type = search_result.get("search_type", "unknown")
                matches = search_result.get("matches", [])
                
                print(f"🔍 Результат поиска: {search_type}")
                print(f"📊 Найдено совпадений: {len(matches)}")
                
                if matches:
                    for i, match in enumerate(matches[:3]):  # Показываем первые 3
                        print(f"  {i+1}. {match.get('name', 'Без названия')}")
                        print(f"     АГБ: {match.get('agb_article', 'Нет')}")
                        print(f"     BL: {match.get('bl_article', 'Нет')}")
                        print(f"     Уверенность: {match.get('confidence', 0)}%")
                        if match.get('enhanced_query'):
                            print(f"     Улучшенный запрос: {match.get('enhanced_query')}")
                else:
                    print("  ❌ Совпадений не найдено")
                    
            except Exception as e:
                print(f"❌ Ошибка поиска: {e}")
            
            print()
        
        break  # Выходим из цикла async for

async def test_enhanced_search():
    """Тестирует улучшенный поиск с повторными попытками"""
    print("\n🔄 Тестирование улучшенного поиска")
    print("=" * 50)
    
    # Тестовые наименования, которые могут не найтись с первого раза
    test_items = [
        "Крепежное изделие метрическое",
        "Смазывающий материал",
        "Уплотнительный элемент",
        "Электротехническое изделие"
    ]
    
    async for db in get_db():
        for item in test_items:
            print(f"\n🔍 Тестируем улучшенный поиск: '{item}'")
            print("-" * 40)
            
            try:
                result = await smart_search_with_ai(item, db)
                search_type = result.get("search_type", "unknown")
                matches = result.get("matches", [])
                ai_analysis = result.get("ai_analysis", {})
                
                print(f"🔍 Тип поиска: {search_type}")
                print(f"📊 Найдено совпадений: {len(matches)}")
                
                if search_type == "enhanced_ai_match":
                    print("✅ Использован улучшенный поиск с ИИ!")
                    print(f"📊 Анализ ИИ: {ai_analysis.get('analysis', 'Нет анализа')}")
                    print(f"🔑 Категория: {ai_analysis.get('category', 'Неизвестно')}")
                
                if matches:
                    for i, match in enumerate(matches[:2]):
                        print(f"  {i+1}. {match.get('name', 'Без названия')}")
                        print(f"     Уверенность: {match.get('confidence', 0)}%")
                        if match.get('enhanced_query'):
                            print(f"     Улучшенный запрос: {match.get('enhanced_query')}")
                else:
                    print("  ❌ Совпадений не найдено")
                    if ai_analysis:
                        print(f"  📊 Анализ ИИ: {ai_analysis.get('analysis', 'Нет анализа')}")
                        
            except Exception as e:
                print(f"❌ Ошибка: {e}")
            
            print()
        
        break  # Выходим из цикла async for

async def main():
    """Основная функция тестирования"""
    print("🚀 Запуск тестирования нового функционала сопоставления артикулов")
    print("=" * 70)
    
    try:
        await test_ai_analysis()
        await test_enhanced_search()
        print("\n✅ Тестирование завершено успешно!")
    except Exception as e:
        print(f"\n❌ Ошибка тестирования: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
