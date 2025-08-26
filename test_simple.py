#!/usr/bin/env python3
"""
Простой тест создания чата
"""

import requests
import json

def test_chat():
    # Базовый URL
    base_url = "http://localhost:8000"
    
    # Тестируем создание чата без авторизации (должно вернуть 401)
    print("🔍 Тестируем создание чата без авторизации...")
    response = requests.post(f"{base_url}/api/chat/rooms/", json={"name": "Тестовый чат"})
    print(f"Статус: {response.status_code}")
    print(f"Ответ: {response.text}")
    print()
    
    # Тестируем получение списка чатов без авторизации
    print("🔍 Тестируем получение списка чатов без авторизации...")
    response = requests.get(f"{base_url}/api/chat/rooms/")
    print(f"Статус: {response.status_code}")
    print(f"Ответ: {response.text}")
    print()
    
    # Тестируем health endpoint
    print("🔍 Тестируем health endpoint...")
    response = requests.get(f"{base_url}/api/health")
    print(f"Статус: {response.status_code}")
    print(f"Ответ: {response.text}")
    print()

if __name__ == "__main__":
    test_chat()
