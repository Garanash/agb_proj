#!/usr/bin/env python3
"""Тестирование импорта роутеров"""

print("🔍 Тестирование импорта роутеров...")

try:
    print("1. Импорт auth...")
    from routers import auth
    print("   ✅ auth импортирован успешно")
except Exception as e:
    print(f"   ❌ Ошибка импорта auth: {e}")

try:
    print("2. Импорт users...")
    from routers import users
    print("   ✅ users импортирован успешно")
except Exception as e:
    print(f"   ❌ Ошибка импорта users: {e}")

try:
    print("3. Импорт news...")
    from routers import news
    print("   ✅ news импортирован успешно")
except Exception as e:
    print(f"   ❌ Ошибка импорта news: {e}")

try:
    print("4. Импорт events...")
    from routers import events
    print("   ✅ events импортирован успешно")
except Exception as e:
    print(f"   ❌ Ошибка импорта events: {e}")

try:
    print("5. Импорт departments...")
    from routers import departments
    print("   ✅ departments импортирован успешно")
except Exception as e:
    print(f"   ❌ Ошибка импорта departments: {e}")

try:
    print("6. Импорт company_employees...")
    from routers import company_employees
    print("   ✅ company_employees импортирован успешно")
except Exception as e:
    print(f"   ❌ Ошибка импорта company_employees: {e}")

print("🎯 Тестирование завершено!")
