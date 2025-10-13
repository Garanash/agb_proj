#!/usr/bin/env python3
"""
Тест быстрой загрузки файла
"""

import requests
import json

def test_fast_upload():
    url = "http://localhost:8000/api/v1/article-matching/fast-upload/"
    
    # Создаем тестовый файл
    test_content = """25241
Переходная муфта HQ
4535774
Кольцо кернорвательное HQ
1299650
Шпиндель верхней части керноприемника"""
    
    files = {
        'file': ('test_fast.txt', test_content, 'text/plain')
    }
    
    data = {
        'contractor_name': 'Тест Контрагент'
    }
    
    try:
        print("Отправляем запрос на быструю загрузку...")
        response = requests.post(url, files=files, data=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Успешно!")
            print(f"Тип файла: {result.get('file_type', 'unknown')}")
            print(f"Элементов для поиска: {result.get('search_items_count', 0)}")
            print(f"Сообщение: {result.get('message', '')}")
        else:
            print(f"❌ Ошибка: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка при запросе: {e}")

if __name__ == "__main__":
    test_fast_upload()
