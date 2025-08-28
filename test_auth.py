#!/usr/bin/env python3
"""
Скрипт для тестирования аутентификации
"""

import requests
import json

def test_auth():
    """Тестирование аутентификации"""
    
    # Базовый URL
    base_url = "http://127.0.0.1:8000"
    
    print("🔐 Тестирование аутентификации...")
    print(f"📍 Базовый URL: {base_url}")
    print("-" * 50)
    
    # Тест 1: Health check
    try:
        response = requests.get(f"{base_url}/api/health")
        print(f"✅ Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Health check: {e}")
    
    # Тест 2: Попытка входа с правильными данными
    login_data = {
        "username": "admin",
        "password": "neurofork1"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"✅ Login attempt: {response.status_code}")
        if response.status_code == 200:
            print(f"   Response: {response.json()}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Login attempt: {e}")
    
    # Тест 3: Попытка входа с неправильными данными
    wrong_login_data = {
        "username": "admin",
        "password": "wrong_password"
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/auth/login",
            data=wrong_login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"✅ Wrong password test: {response.status_code}")
        if response.status_code == 401:
            print(f"   Expected: Unauthorized")
        else:
            print(f"   Unexpected: {response.text}")
    except Exception as e:
        print(f"❌ Wrong password test: {e}")
    
    print("-" * 50)
    print("🎯 Тестирование завершено!")

if __name__ == "__main__":
    test_auth()
