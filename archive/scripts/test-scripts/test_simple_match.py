#!/usr/bin/env python3
"""
Простой тест сопоставления
"""

import requests
import json

def test_simple_match():
    # Сначала создаем заявку
    url = "http://localhost:8000/api/v1/article-matching/fast-upload/"
    
    test_content = "25241"
    
    files = {
        'file': ('test_simple.txt', test_content, 'text/plain')
    }
    
    data = {
        'contractor_name': 'Тест Контрагент'
    }
    
    try:
        print("1. Создаем заявку...")
        response = requests.post(url, files=files, data=data)
        
        if response.status_code == 200:
            result = response.json()
            request_id = result["request"]["id"]
            print(f"✅ Заявка создана, ID: {request_id}")
            
            # Теперь выполняем сопоставление
            print("2. Выполняем сопоставление...")
            match_url = f"http://localhost:8000/api/v1/article-matching/requests/{request_id}/smart-match/"
            match_response = requests.post(match_url)
            
            print(f"Status Code: {match_response.status_code}")
            print(f"Response: {match_response.text}")
            
            if match_response.status_code == 200:
                match_result = match_response.json()
                print(f"✅ Сопоставление завершено!")
                print(f"Найдено новых соответствий: {match_result.get('matched_count', 0)}")
            else:
                print(f"❌ Ошибка сопоставления: {match_response.text}")
        else:
            print(f"❌ Ошибка создания заявки: {response.text}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    test_simple_match()
