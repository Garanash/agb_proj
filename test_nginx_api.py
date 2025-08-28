#!/usr/bin/env python3
"""
Скрипт для тестирования API через nginx
"""

import requests
import json

def test_nginx_api():
    """Тестирование API через nginx"""
    
    print("🌐 Тестирование API через Nginx...")
    print("=" * 60)
    
    # Тест 1: Health check через nginx
    print("\n1️⃣ Health check через nginx:")
    try:
        response = requests.get("http://localhost/api/health")
        print(f"   ✅ Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"   ❌ Health check: {e}")
    
    # Тест 2: Root API через nginx
    print("\n2️⃣ Root API через nginx:")
    try:
        response = requests.get("http://localhost/api/")
        print(f"   ✅ Root API: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"   ❌ Root API: {e}")
    
    # Тест 3: Аутентификация через nginx
    print("\n3️⃣ Аутентификация через nginx:")
    login_data = {
        "username": "admin",
        "password": "neurofork1"
    }
    
    try:
        response = requests.post(
            "http://localhost/api/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"   ✅ Login attempt: {response.status_code}")
        if response.status_code == 200:
            print(f"      Response: {response.json()}")
        else:
            print(f"      Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Login attempt: {e}")
    
    # Тест 4: CORS preflight через nginx
    print("\n4️⃣ CORS preflight через nginx:")
    try:
        response = requests.options(
            "http://localhost/api/auth/login",
            headers={
                "Origin": "http://localhost",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            }
        )
        print(f"   ✅ CORS preflight: {response.status_code}")
        print(f"      CORS headers: {dict(response.headers)}")
    except Exception as e:
        print(f"   ❌ CORS preflight: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 Тестирование завершено!")

if __name__ == "__main__":
    test_nginx_api()
