#!/usr/bin/env python3
import requests
import json

def test_http_api():
    """Тестируем HTTP API"""
    print("🔍 Тестируем HTTP API...")
    
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
    
    # Тестируем AI обработку
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    data = {
        "message": "ОХКУ-000184 УБР - Кундуми Смазка антивибрационная GRIZZLY (ведро 17 кг.) 10 шт"
    }
    
    response = requests.post("http://localhost:8000/api/v1/article-matching/ai-process/", 
                           headers=headers, 
                           data=data)
    
    print(f"📊 Статус ответа: {response.status_code}")
    print(f"📊 Ответ: {response.text}")
    
    # Парсим JSON ответ
    try:
        result = response.json()
        print(f"📊 Результаты сопоставления: {result['matching_results']}")
        for match in result['matching_results']:
            print(f"   • {match['contractor_article']} -> {match['agb_article']} (matched: {match['matched']})")
    except Exception as e:
        print(f"❌ Ошибка парсинга JSON: {e}")

if __name__ == "__main__":
    test_http_api()
