#!/usr/bin/env python3
"""
Тестовый скрипт для проверки загрузки Excel файла
"""

import requests
import json

def test_upload():
    url = "http://localhost:8000/api/v1/article-matching/test-upload-excel/"
    
    # Создаем тестовые данные
    test_data = {
        "contractor_name": "Тест Контрагент"
    }
    
    # Создаем тестовый Excel файл в памяти
    import pandas as pd
    import io
    
    # Создаем тестовую заявку
    test_items = [
        {"Артикул": "1299650", "Описание": "Шпиндель верхней части керноприемника H/HU, 25231, SDT", "Количество": 5, "Единица": "шт"},
        {"Артикул": "1298240", "Описание": "Втулка удержания жидкости 306131, SDT", "Количество": 12, "Единица": "шт"},
        {"Артикул": "1298244", "Описание": "Пружина мягкая N/H/P, удержания жидкости, 104966, SDT", "Количество": 10, "Единица": "шт"},
        {"Артикул": "1299679", "Описание": "Щека верхняя для ключа разводного 24\", 14947, SDT", "Количество": 8, "Единица": "шт"},
        {"Артикул": "1299680", "Описание": "Щека верхняя для ключа разводного 36\", 14950, SDT", "Количество": 8, "Единица": "шт"}
    ]
    
    df = pd.DataFrame(test_items)
    
    # Сохраняем в Excel в памяти
    excel_buffer = io.BytesIO()
    df.to_excel(excel_buffer, index=False)
    excel_buffer.seek(0)
    
    # Отправляем запрос
    files = {
        'file': ('test_request.xlsx', excel_buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
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
            print(f"\nУспешно! Создана заявка ID: {result['request']['id']}")
            print(f"Результаты сопоставления:")
            print(f"  Всего позиций: {result['matching_results']['total_items']}")
            print(f"  Найдено соответствий: {result['matching_results']['matched_items']}")
            print(f"  Новых сопоставлений: {result['matching_results']['new_mappings_count']}")
            print(f"  Существующих сопоставлений: {result['matching_results']['existing_mappings_count']}")
            print(f"  Не найдено: {result['matching_results']['not_found_count']}")
        else:
            print(f"Ошибка: {response.text}")
            
    except Exception as e:
        print(f"Ошибка при отправке запроса: {e}")

if __name__ == "__main__":
    test_upload()
