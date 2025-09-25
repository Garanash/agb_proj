#!/usr/bin/env python3
import requests
import json

def test_api():
    """Тестируем API напрямую"""
    print("🔍 Тестируем API...")
    
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

if __name__ == "__main__":
    test_api()
