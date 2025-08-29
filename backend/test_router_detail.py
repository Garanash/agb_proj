#!/usr/bin/env python3
"""Детальный тест роутера users"""

print("🔍 Детальное тестирование роутера users...")

try:
    print("1. Импортируем зависимости...")
    from database import get_db
    print("   ✅ database импортирован")
    
    from models import User
    print("   ✅ models импортирован")
    
    from schemas import User as UserSchema
    print("   ✅ schemas импортирован")
    
    print("\n2. Импортируем роутер users...")
    from routers.users import router
    print("   ✅ users роутер импортирован")
    
    print("\n3. Проверяем маршруты...")
    for route in router.routes:
        print(f"   📍 {route.path} - {route.methods}")
    
    print("\n4. Создаем тестовое приложение...")
    from fastapi import FastAPI
    test_app = FastAPI()
    test_app.include_router(router, prefix="/api/users")
    
    print("   ✅ Тестовое приложение создано")
    
    print("\n5. Проверяем зарегистрированные маршруты...")
    for route in test_app.routes:
        if hasattr(route, 'path') and '/api/users' in route.path:
            print(f"   📍 {route.path} - {route.methods}")
    
except Exception as e:
    print(f"   ❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()

print("\n🎯 Детальное тестирование завершено!")
