#!/usr/bin/env python3
"""
Скрипт для проверки состояния системы чатов
"""

import asyncio
import sys
import os
import requests
from datetime import datetime

# Добавляем путь к backend в sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def check_database():
    """Проверяет состояние базы данных"""
    try:
        from database import get_db
        
        print("🗄️ Проверка базы данных...")
        
        async for db in get_db():
            try:
                # Проверяем таблицы чатов
                tables = [
                    'chat_rooms', 'chat_room_participants', 'chat_messages',
                    'chat_bots', 'chat_folders', 'chat_room_folders'
                ]
                
                for table in tables:
                    try:
                        result = await db.execute(f"SELECT COUNT(*) FROM {table}")
                        count = result.scalar()
                        print(f"  ✅ {table}: {count} записей")
                    except Exception as e:
                        print(f"  ❌ {table}: Ошибка - {e}")
                
                await db.close()
                break
                
            except Exception as e:
                print(f"  ❌ Ошибка при проверке БД: {e}")
                return False
        
        return True
        
    except Exception as e:
        print(f"  ❌ Не удалось подключиться к БД: {e}")
        return False

def check_backend():
    """Проверяет состояние backend API"""
    try:
        print("🔧 Проверка backend API...")
        
        # Проверяем доступность backend
        response = requests.get('http://localhost:8000/docs', timeout=5)
        if response.status_code == 200:
            print("  ✅ Backend доступен")
            return True
        else:
            print(f"  ❌ Backend недоступен: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Backend недоступен: {e}")
        return False

def check_frontend():
    """Проверяет состояние frontend"""
    try:
        print("🎨 Проверка frontend...")
        
        # Проверяем доступность frontend
        response = requests.get('http://localhost:3000', timeout=5)
        if response.status_code == 200:
            print("  ✅ Frontend доступен")
            return True
        else:
            print(f"  ❌ Frontend недоступен: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"  ❌ Frontend недоступен: {e}")
        return False

def check_api_endpoints():
    """Проверяет основные API endpoints"""
    try:
        print("🔌 Проверка API endpoints...")
        
        # Проверяем health check (если есть)
        try:
            response = requests.get('http://localhost:8000/health', timeout=5)
            if response.status_code == 200:
                print("  ✅ Health check: OK")
            else:
                print(f"  ⚠️ Health check: {response.status_code}")
        except:
            print("  ⚠️ Health check: недоступен")
        
        # Проверяем документацию API
        response = requests.get('http://localhost:8000/docs', timeout=5)
        if response.status_code == 200:
            print("  ✅ API документация: доступна")
        else:
            print(f"  ❌ API документация: недоступна")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Ошибка при проверке API: {e}")
        return False

def main():
    """Основная функция проверки"""
    print("🔍 Проверка состояния системы чатов")
    print("=" * 50)
    print(f"Время проверки: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Проверяем компоненты системы
    db_ok = asyncio.run(check_database())
    backend_ok = check_backend()
    frontend_ok = check_frontend()
    api_ok = check_api_endpoints()
    
    print()
    print("📊 Результаты проверки:")
    print("=" * 50)
    
    status = {
        "База данных": "✅ OK" if db_ok else "❌ ОШИБКА",
        "Backend API": "✅ OK" if backend_ok else "❌ ОШИБКА", 
        "Frontend": "✅ OK" if frontend_ok else "❌ ОШИБКА",
        "API endpoints": "✅ OK" if api_ok else "❌ ОШИБКА"
    }
    
    for component, status_text in status.items():
        print(f"{component:15} {status_text}")
    
    print()
    
    # Общий статус
    all_ok = all([db_ok, backend_ok, frontend_ok, api_ok])
    
    if all_ok:
        print("🎉 Система чатов полностью функциональна!")
        print("\n🚀 Следующие шаги:")
        print("1. Откройте http://localhost:3000/chat")
        print("2. Создайте тестовый чат")
        print("3. Протестируйте функциональность")
    else:
        print("⚠️ Обнаружены проблемы в системе")
        print("\n🔧 Рекомендации по исправлению:")
        
        if not db_ok:
            print("- Выполните SQL скрипт: backend/migrations/create_chat_tables.sql")
            print("- Или запустите: python backend/init_chat_db.py")
        
        if not backend_ok:
            print("- Запустите backend: cd backend && uvicorn main:app --reload")
            print("- Проверьте настройки базы данных в backend/database.py")
        
        if not frontend_ok:
            print("- Запустите frontend: cd frontend && npm run dev")
            print("- Проверьте, что Node.js установлен")
        
        print("\n📚 Подробная документация: SETUP_CHAT_SYSTEM.md")
    
    print()
    print("=" * 50)

if __name__ == "__main__":
    main()
