#!/usr/bin/env python3
"""
Тест развертывания AGB проекта
Проверяет доступность всех сервисов после деплоя
"""

import requests
import time
import sys
import json
from urllib.parse import urljoin

# Конфигурация
BASE_URL = "http://localhost"
SERVICES = {
    "nginx": f"{BASE_URL}/health",
    "frontend": f"{BASE_URL}/",
    "backend": f"{BASE_URL}/api/health",
}

def test_service(name, url, timeout=30):
    """Тестирует доступность сервиса"""
    print(f"🔍 Тестируем {name}: {url}")
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {name}: OK ({response.status_code})")
                return True
        except requests.exceptions.RequestException as e:
            print(f"⏳ {name}: Ожидание... ({e})")
            time.sleep(2)
    
    print(f"❌ {name}: FAILED (timeout {timeout}s)")
    return False

def test_backend_endpoints():
    """Тестирует основные эндпоинты бекенда"""
    print("\n🔍 Тестируем эндпоинты бекенда...")
    
    endpoints = [
        "/api/health",
        "/api/v1/auth/login",
        "/api/v1/article-matching/test-requests/",
    ]
    
    for endpoint in endpoints:
        url = urljoin(BASE_URL, endpoint)
        try:
            response = requests.get(url, timeout=10)
            print(f"  {endpoint}: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"  {endpoint}: ERROR - {e}")

def test_frontend_pages():
    """Тестирует основные страницы фронтенда"""
    print("\n🔍 Тестируем страницы фронтенда...")
    
    pages = [
        "/",
        "/login",
        "/dashboard",
        "/article-matching",
    ]
    
    for page in pages:
        url = urljoin(BASE_URL, page)
        try:
            response = requests.get(url, timeout=10)
            print(f"  {page}: {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"  {page}: ERROR - {e}")

def main():
    """Основная функция тестирования"""
    print("🚀 Тестирование развертывания AGB проекта")
    print("=" * 50)
    
    # Ждем немного, чтобы сервисы успели запуститься
    print("⏳ Ожидание запуска сервисов (30 секунд)...")
    time.sleep(30)
    
    # Тестируем основные сервисы
    results = []
    for name, url in SERVICES.items():
        result = test_service(name, url)
        results.append(result)
    
    # Тестируем эндпоинты
    test_backend_endpoints()
    test_frontend_pages()
    
    # Результаты
    print("\n" + "=" * 50)
    print("📊 Результаты тестирования:")
    
    success_count = sum(results)
    total_count = len(results)
    
    for i, (name, url) in enumerate(SERVICES.items()):
        status = "✅ OK" if results[i] else "❌ FAILED"
        print(f"  {name}: {status}")
    
    print(f"\n🎯 Успешно: {success_count}/{total_count}")
    
    if success_count == total_count:
        print("🎉 Все сервисы работают корректно!")
        return 0
    else:
        print("⚠️ Некоторые сервисы недоступны")
        return 1

if __name__ == "__main__":
    sys.exit(main())
