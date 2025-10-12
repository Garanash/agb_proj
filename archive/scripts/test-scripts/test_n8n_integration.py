#!/usr/bin/env python3
"""
Тестовый скрипт для проверки интеграции с n8n
"""

import requests
import json
import time

# Конфигурация
API_BASE_URL = "http://localhost:8000/api/v1"
N8N_URL = "http://localhost:5678"

def test_n8n_health():
    """Проверка здоровья n8n"""
    print("🔍 Проверка здоровья n8n...")
    try:
        response = requests.get(f"{N8N_URL}/healthz", timeout=10)
        if response.status_code == 200:
            print("✅ n8n доступен")
            return True
        else:
            print(f"❌ n8n недоступен: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка подключения к n8n: {e}")
        return False

def test_webhook_direct():
    """Прямой тест webhook n8n"""
    print("\n🔗 Тестирование webhook n8n...")
    try:
        test_data = {
            "event_type": "passport_created",
            "data": {
                "passport_number": "TEST-001",
                "order_number": "ORDER-001",
                "creator": {
                    "first_name": "Тест",
                    "last_name": "Пользователь"
                }
            },
            "timestamp": "2024-01-01T12:00:00Z",
            "source": "test_script"
        }
        
        response = requests.post(
            f"{N8N_URL}/webhook/agb-platform",
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Webhook n8n работает")
            print(f"Ответ: {response.json()}")
            return True
        else:
            print(f"❌ Webhook n8n не работает: {response.status_code}")
            print(f"Ответ: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Ошибка тестирования webhook: {e}")
        return False

def test_agb_api():
    """Тест API AGB Platform"""
    print("\n🔍 Проверка API AGB Platform...")
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=10)
        if response.status_code == 200:
            print("✅ API AGB Platform доступен")
            return True
        else:
            print(f"❌ API AGB Platform недоступен: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка подключения к API: {e}")
        return False

def test_n8n_workflows():
    """Проверка workflows в n8n"""
    print("\n📋 Проверка workflows в n8n...")
    try:
        # Попробуем получить workflows через API (без аутентификации)
        response = requests.get(f"{N8N_URL}/api/v1/workflows", timeout=10)
        if response.status_code == 200:
            workflows = response.json()
            print(f"✅ Найдено {len(workflows)} workflows")
            for workflow in workflows:
                print(f"  - {workflow.get('name', 'Без названия')} (ID: {workflow.get('id')})")
            return True
        else:
            print(f"❌ Не удалось получить workflows: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ошибка получения workflows: {e}")
        return False

def main():
    """Основная функция тестирования"""
    print("🚀 Тестирование интеграции AGB Platform + n8n")
    print("=" * 50)
    
    results = []
    
    # Тест 1: Здоровье n8n
    results.append(test_n8n_health())
    
    # Тест 2: API AGB Platform
    results.append(test_agb_api())
    
    # Тест 3: Webhook n8n
    results.append(test_webhook_direct())
    
    # Тест 4: Workflows n8n
    results.append(test_n8n_workflows())
    
    # Результаты
    print("\n" + "=" * 50)
    print("📊 Результаты тестирования:")
    print(f"✅ Успешных тестов: {sum(results)}")
    print(f"❌ Неудачных тестов: {len(results) - sum(results)}")
    
    if all(results):
        print("\n🎉 Все тесты прошли успешно! Интеграция работает.")
    else:
        print("\n⚠️  Некоторые тесты не прошли. Проверьте конфигурацию.")
    
    print("\n🌐 Полезные ссылки:")
    print(f"  - n8n: {N8N_URL}")
    print(f"  - AGB Platform API: {API_BASE_URL}")
    print(f"  - n8n Webhook: {N8N_URL}/webhook/agb-platform")

if __name__ == "__main__":
    main()
