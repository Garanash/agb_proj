#!/usr/bin/env python3
"""Тестирование каждого роутера отдельно"""

from fastapi import FastAPI, APIRouter
from fastapi.testclient import TestClient

print("🔍 Тестирование роутеров по отдельности...")

# Тест 1: Роутер users
try:
    print("\n1. Тестируем роутер users...")
    from routers.users import router as users_router
    
    test_app = FastAPI()
    test_app.include_router(users_router, prefix="/api/users")
    
    client = TestClient(test_app)
    response = client.get("/api/users/")
    print(f"   ✅ users работает: {response.status_code}")
    
except Exception as e:
    print(f"   ❌ users не работает: {e}")

# Тест 2: Роутер news
try:
    print("\n2. Тестируем роутер news...")
    from routers.news import router as news_router
    
    test_app = FastAPI()
    test_app.include_router(news_router, prefix="/api/news")
    
    client = TestClient(test_app)
    response = client.get("/api/news/")
    print(f"   ✅ news работает: {response.status_code}")
    
except Exception as e:
    print(f"   ❌ news не работает: {e}")

# Тест 3: Роутер departments
try:
    print("\n3. Тестируем роутер departments...")
    from routers.departments import router as departments_router
    
    test_app = FastAPI()
    test_app.include_router(departments_router, prefix="/api/departments")
    
    client = TestClient(test_app)
    response = client.get("/api/departments/")
    print(f"   ✅ departments работает: {response.status_code}")
    
except Exception as e:
    print(f"   ❌ departments не работает: {e}")

print("\n🎯 Тестирование завершено!")
