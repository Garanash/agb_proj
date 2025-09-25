#!/usr/bin/env python3
"""
Простой тест для проверки работы API
"""

import requests
import json

def test_simple():
    # Тестируем простой endpoint
    url = "http://localhost:8000/api/v1/article-matching/test-our-database/"
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Успешно! Получено {data.get('count', 0)} записей")
        else:
            print(f"Ошибка: {response.text}")
    except Exception as e:
        print(f"Ошибка при запросе: {e}")

if __name__ == "__main__":
    test_simple()
