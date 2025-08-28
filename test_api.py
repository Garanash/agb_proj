#!/usr/bin/env python3
"""
Простой скрипт для тестирования API без curl
"""

import requests
import sys

def test_api():
    """Тестирование API endpoints"""
    
    # Базовый URL
    base_url = "http://127.0.0.1:8000"
    
    print("🧪 Тестирование API...")
    print(f"📍 Базовый URL: {base_url}")
    print("-" * 50)
    
    # Тест 1: Health check
    try:
        response = requests.get(f"{base_url}/api/health")
        print(f"✅ Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Health check: {e}")
    
    # Тест 2: Root endpoint
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Root endpoint: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ Root endpoint: {e}")
    
    # Тест 3: Auth endpoint
    try:
        response = requests.get(f"{base_url}/api/auth/login")
        print(f"✅ Auth endpoint: {response.status_code}")
    except Exception as e:
        print(f"❌ Auth endpoint: {e}")
    
    print("-" * 50)
    print("🎯 Тестирование завершено!")

if __name__ == "__main__":
    test_api()
