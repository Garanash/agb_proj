#!/usr/bin/env python3
"""
Скрипт для создания workflow в n8n
"""

import requests
import json
import base64

# Конфигурация
N8N_URL = "http://localhost:5678"
N8N_USER = "admin"
N8N_PASSWORD = "admin123"

def get_auth_token():
    """Получение токена аутентификации"""
    print("🔐 Получение токена аутентификации...")
    
    # Создаем Basic Auth
    credentials = f"{N8N_USER}:{N8N_PASSWORD}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    
    headers = {
        "Authorization": f"Basic {encoded_credentials}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(f"{N8N_URL}/api/v1/login", headers=headers)
        if response.status_code == 200:
            print("✅ Аутентификация успешна")
            return headers
        else:
            print(f"❌ Ошибка аутентификации: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Ошибка подключения: {e}")
        return None

def create_workflow(headers):
    """Создание workflow"""
    print("\n📝 Создание workflow...")
    
    workflow_data = {
        "name": "AGB Platform Integration",
        "active": True,
        "nodes": [
            {
                "parameters": {
                    "httpMethod": "POST",
                    "path": "agb-platform",
                    "responseMode": "responseNode",
                    "options": {}
                },
                "id": "webhook-trigger",
                "name": "Webhook Trigger",
                "type": "n8n-nodes-base.webhook",
                "typeVersion": 1,
                "position": [240, 300],
                "webhookId": "agb-platform"
            },
            {
                "parameters": {
                    "respondWith": "json",
                    "responseBody": "={{ { \"success\": true, \"message\": \"Event processed successfully\", \"event_type\": $json.event_type, \"timestamp\": $json.timestamp } }}"
                },
                "id": "webhook-response",
                "name": "Webhook Response",
                "type": "n8n-nodes-base.respondToWebhook",
                "typeVersion": 1,
                "position": [460, 300]
            }
        ],
        "connections": {
            "Webhook Trigger": {
                "main": [
                    [
                        {
                            "node": "Webhook Response",
                            "type": "main",
                            "index": 0
                        }
                    ]
                ]
            }
        },
        "settings": {
            "executionOrder": "v1"
        }
    }
    
    try:
        response = requests.post(
            f"{N8N_URL}/api/v1/workflows",
            headers=headers,
            json=workflow_data
        )
        
        if response.status_code == 201:
            workflow = response.json()
            print(f"✅ Workflow создан: {workflow['name']} (ID: {workflow['id']})")
            return workflow
        else:
            print(f"❌ Ошибка создания workflow: {response.status_code}")
            print(f"Ответ: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Ошибка создания workflow: {e}")
        return None

def test_webhook(workflow_id):
    """Тестирование webhook"""
    print(f"\n🧪 Тестирование webhook для workflow {workflow_id}...")
    
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
    
    try:
        response = requests.post(
            f"{N8N_URL}/webhook/agb-platform",
            json=test_data,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Webhook работает!")
            print(f"Ответ: {response.json()}")
            return True
        else:
            print(f"❌ Webhook не работает: {response.status_code}")
            print(f"Ответ: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Ошибка тестирования webhook: {e}")
        return False

def main():
    """Основная функция"""
    print("🚀 Создание workflow в n8n")
    print("=" * 40)
    
    # Получаем токен аутентификации
    headers = get_auth_token()
    if not headers:
        return
    
    # Создаем workflow
    workflow = create_workflow(headers)
    if not workflow:
        return
    
    # Тестируем webhook
    test_webhook(workflow['id'])
    
    print("\n🎉 Workflow создан и готов к использованию!")
    print(f"🌐 n8n: {N8N_URL}")
    print(f"🔗 Webhook: {N8N_URL}/webhook/agb-platform")

if __name__ == "__main__":
    main()
