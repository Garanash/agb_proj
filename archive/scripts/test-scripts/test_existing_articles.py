#!/usr/bin/env python3
"""
Тест поиска по существующим артикулам
"""

import requests
import json

def test_existing_articles():
    """Тестируем поиск по существующим артикулам"""
    print("🔍 Тестируем поиск по существующим артикулам...")
    
    # Артикулы, которые точно есть в базе
    test_articles = [
        "25241",      # BL артикул
        "4535774",    # АГБ артикул
        "4509043",    # АГБ артикул
        "5010029"     # BL артикул
    ]
    
    url = "http://localhost:8000/api/v1/article-matching/smart-search/"
    
    for article in test_articles:
        print(f"\n🔍 Поиск артикула: '{article}'")
        
        test_data = {
            "search_text": article
        }
        
        try:
            response = requests.post(url, json=test_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Тип поиска: {result.get('search_type', 'unknown')}")
                print(f"Найдено соответствий: {len(result.get('matches', []))}")
                
                for match in result.get('matches', []):
                    print(f"  ✅ {match.get('agb_article', '')} | {match.get('bl_article', '')} | {match.get('name', '')} | {match.get('confidence', 0)}%")
            else:
                print(f"❌ Ошибка: {response.text}")
                
        except Exception as e:
            print(f"❌ Ошибка при запросе: {e}")

def test_search_by_description():
    """Тестируем поиск по описанию"""
    print("\n🔍 Тестируем поиск по описанию...")
    
    test_descriptions = [
        "переходная муфта",
        "кольцо кернорвательное",
        "болт",
        "гайка"
    ]
    
    url = "http://localhost:8000/api/v1/article-matching/smart-search/"
    
    for desc in test_descriptions:
        print(f"\n🔍 Поиск по описанию: '{desc}'")
        
        test_data = {
            "search_text": desc
        }
        
        try:
            response = requests.post(url, json=test_data)
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Тип поиска: {result.get('search_type', 'unknown')}")
                print(f"Найдено соответствий: {len(result.get('matches', []))}")
                
                for match in result.get('matches', []):
                    print(f"  ✅ {match.get('agb_article', '')} | {match.get('bl_article', '')} | {match.get('name', '')} | {match.get('confidence', 0)}%")
            else:
                print(f"❌ Ошибка: {response.text}")
                
        except Exception as e:
            print(f"❌ Ошибка при запросе: {e}")

if __name__ == "__main__":
    test_existing_articles()
    test_search_by_description()
