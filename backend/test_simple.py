#!/usr/bin/env python3
"""Простой тест импорта роутеров"""

print("🔍 Простое тестирование импорта роутеров...")

try:
    print("1. Импортируем users...")
    from routers.users import router
    print(f"   ✅ users импортирован, router: {router}")
    print(f"   📍 routes: {[route.path for route in router.routes]}")
    
except Exception as e:
    print(f"   ❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()

print("\n🎯 Тест завершен!")
