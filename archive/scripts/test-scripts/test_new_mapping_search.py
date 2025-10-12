#!/usr/bin/env python3
import requests
import json

def test_new_mapping_search():
    """Тест новой функциональности поиска по существующим сопоставлениям"""
    print("🔍 Тестируем новую функциональность поиска по существующим сопоставлениям...")
    
    # Логинимся
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post("http://localhost:8000/api/v1/auth/login", json=login_data)
    if response.status_code != 200:
        print(f"❌ Ошибка логина: {response.status_code} - {response.text}")
        return
    
    token = response.json()["access_token"]
    print(f"✅ Получен токен: {token[:20]}...")
    
    # Тестируем AI обработку с артикулом, который уже должен быть в сопоставлениях
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Сначала проверим, есть ли уже сопоставления
    print("\n🔍 Проверяем существующие сопоставления...")
    response = requests.get("http://localhost:8000/api/v1/article-matching/mappings/", headers=headers)
    if response.status_code == 200:
        mappings = response.json()
        print(f"📊 Найдено {len(mappings)} существующих сопоставлений")
        if mappings:
            print("📋 Примеры существующих сопоставлений:")
            for i, mapping in enumerate(mappings[:3]):
                print(f"   {i+1}. {mapping['contractor_article']} -> {mapping['agb_article']}")
    else:
        print(f"❌ Ошибка получения сопоставлений: {response.status_code}")
    
    # Тестируем поиск с артикулом, который может быть в сопоставлениях
    test_articles = [
        "ОХКУ-000184 УБР - Кундуми Смазка антивибрационная GRIZZLY (ведро 17 кг.) 10 шт",
        "940006/2 Смазка антивибрационная",
        "Тестовый артикул для поиска"
    ]
    
    for test_article in test_articles:
        print(f"\n🔍 Тестируем поиск: '{test_article}'")
        
        data = {
            "message": test_article
        }
        
        response = requests.post("http://localhost:8000/api/v1/article-matching/ai-process/", 
                               headers=headers, 
                               data=data)
        
        print(f"📊 Статус ответа: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"📊 Сообщение: {result.get('message', '')[:200]}...")
            print(f"📊 Результаты сопоставления: {len(result.get('matching_results', []))}")
            
            for i, match in enumerate(result.get('matching_results', [])):
                print(f"   {i+1}. {match.get('contractor_article')} -> {match.get('agb_article')} (matched: {match.get('matched')})")
                if hasattr(match, 'is_existing_mapping') and match.get('is_existing_mapping'):
                    print(f"      🔄 Найдено в существующих сопоставлениях!")
        else:
            print(f"❌ Ошибка: {response.text}")

if __name__ == "__main__":
    test_new_mapping_search()
