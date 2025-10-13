#!/usr/bin/env python3
"""
Детальный тест ИИ сопоставления
"""

import requests
import json
import sys
import os

# Добавляем путь к проекту
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

def test_ai_search_detailed():
    """Детальный тест ИИ поиска"""
    print("🔍 Тестируем ИИ поиск...")
    
    # Тест 1: Поиск по артикулу
    print("\n1. Тест поиска по артикулу '1299650'")
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
            print(f"Тип поиска: {result.get('search_type', 'unknown')}")
            print(f"Найдено соответствий: {len(result.get('matches', []))}")
            for match in result.get('matches', []):
                print(f"  - {match.get('agb_article', '')} | {match.get('name', '')} | {match.get('confidence', 0)}%")
        else:
            print(f"Ошибка: {response.text}")
            
    except Exception as e:
        print(f"Ошибка при запросе: {e}")

def test_ai_processing():
    """Тест ИИ обработки файлов"""
    print("\n2. Тест ИИ обработки текста")
    url = "http://localhost:8000/api/v1/article-matching/ai-process/"
    
    # Тестовый текст
    test_text = """
    Заявка на поставку
    
    Артикул: 940002/1
    Описание: Болт М8х20
    Количество: 100 шт
    
    Артикул: 940003/1  
    Описание: Гайка М8
    Количество: 50 шт
    
    Артикул: 940004/1
    Описание: Шайба М8
    Количество: 200 шт
    """
    
    try:
        response = requests.post(url, data={"message": test_text})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Статус: {result.get('status', 'unknown')}")
            print(f"Найдено соответствий: {len(result.get('matching_results', []))}")
            for match in result.get('matching_results', []):
                print(f"  - {match.get('contractor_article', '')} | {match.get('description', '')} | {match.get('matched', False)}")
        else:
            print(f"Ошибка: {response.text}")
            
    except Exception as e:
        print(f"Ошибка при запросе: {e}")

def test_natural_language():
    """Тест обработки естественного языка"""
    print("\n3. Тест обработки естественного языка")
    url = "http://localhost:8000/api/v1/article-matching/ai-process/"
    
    test_queries = [
        "Найди болты М8",
        "Покажи все гайки",
        "Ищу шпиндель керноприемника",
        "Нужны переходные муфты"
    ]
    
    for query in test_queries:
        print(f"\nЗапрос: '{query}'")
        try:
            response = requests.post(url, data={"message": query})
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"Статус: {result.get('status', 'unknown')}")
                print(f"Сообщение: {result.get('message', '')}")
                print(f"Найдено соответствий: {len(result.get('matching_results', []))}")
            else:
                print(f"Ошибка: {response.text}")
                
        except Exception as e:
            print(f"Ошибка при запросе: {e}")

if __name__ == "__main__":
    test_ai_search_detailed()
    test_ai_processing()
    test_natural_language()
