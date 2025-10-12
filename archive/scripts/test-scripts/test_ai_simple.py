#!/usr/bin/env python3
"""
Простой тест AI поиска
"""

import requests
import json

def test_ai_search():
    url = "http://localhost:8000/api/v1/article-matching/smart-search/"
    
    test_data = {
        "search_text": "1299650"
    }
    
    try:
        response = requests.post(url, json=test_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\nУспешно! Тип поиска: {result.get('search_type', 'unknown')}")
            print(f"Найдено соответствий: {len(result.get('matches', []))}")
            for match in result.get('matches', []):
                print(f"  - {match.get('agb_article', '')} | {match.get('name', '')} | {match.get('confidence', 0)}%")
        else:
            print(f"Ошибка: {response.text}")
            
    except Exception as e:
        print(f"Ошибка при запросе: {e}")

if __name__ == "__main__":
    test_ai_search()
