#!/usr/bin/env python3
"""
Скрипт для полного тестирования маршрутизации
"""

import requests
import json
import sys

def test_routing():
    """Тестирование всей маршрутизации"""
    
    print("🌐 Тестирование маршрутизации...")
    print("=" * 60)
    
    # Тест 1: Frontend через nginx
    print("\n1️⃣ Тестирование Frontend через Nginx:")
    try:
        response = requests.get("http://localhost/")
        print(f"   ✅ Главная страница: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Главная страница: {e}")
    
    try:
        response = requests.get("http://localhost/login")
        print(f"   ✅ Страница входа: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Страница входа: {e}")
    
    # Тест 2: Backend API через nginx
    print("\n2️⃣ Тестирование Backend API через Nginx:")
    try:
        response = requests.get("http://localhost/api/health")
        print(f"   ✅ Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"   ❌ Health check: {e}")
    
    try:
        response = requests.get("http://localhost/api/")
        print(f"   ✅ Root API: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"   ❌ Root API: {e}")
    
    # Тест 3: Аутентификация через nginx
    print("\n3️⃣ Тестирование Аутентификации через Nginx:")
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
    
    # Тест 4: CORS preflight
    print("\n4️⃣ Тестирование CORS Preflight:")
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
    
    # Тест 5: Backend напрямую (для сравнения)
    print("\n5️⃣ Тестирование Backend напрямую:")
    try:
        response = requests.get("http://127.0.0.1:8000/api/health")
        print(f"   ✅ Direct health check: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Direct health check: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 Тестирование маршрутизации завершено!")

if __name__ == "__main__":
    test_routing()
