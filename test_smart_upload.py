#!/usr/bin/env python3
"""
Тест умной загрузки файла
"""

import requests
import json

def test_smart_upload():
    url = "http://localhost:8000/api/v1/article-matching/smart-upload/"
    
    # Создаем тестовый файл
    test_content = """25241
Переходная муфта HQ
4535774
Кольцо кернорвательное HQ
1299650
Шпиндель верхней части керноприемника"""
    
    files = {
        'file': ('test_search.txt', test_content, 'text/plain')
    }
    
    data = {
        'contractor_name': 'Тест Контрагент'
    }
    
    try:
        response = requests.post(url, files=files, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\nУспешно!")
            print(f"Тип файла: {result.get('file_type', 'unknown')}")
            print(f"Элементов для поиска: {result.get('search_items_count', 0)}")
            
            matching = result.get('matching_results', {})
            print(f"Результаты сопоставления:")
            print(f"  Всего позиций: {matching.get('total_items', 0)}")
            print(f"  Найдено соответствий: {matching.get('matched_items', 0)}")
            print(f"  Новых сопоставлений: {matching.get('new_mappings_count', 0)}")
            print(f"  Существующих сопоставлений: {matching.get('existing_mappings_count', 0)}")
            print(f"  Не найдено: {matching.get('not_found_count', 0)}")
        else:
            print(f"Ошибка: {response.text}")
            
    except Exception as e:
        print(f"Ошибка при запросе: {e}")

if __name__ == "__main__":
    test_smart_upload()
