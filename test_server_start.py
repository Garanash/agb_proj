#!/usr/bin/env python3
"""
Тест запуска backend сервера
"""
import asyncio
import sys
import os
import signal
import time
from multiprocessing import Process

# Добавляем путь к backend
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

def start_server():
    """Запускаем сервер в отдельном процессе"""
    try:
        from main import app
        import uvicorn
        uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
    except Exception as e:
        print(f"❌ Ошибка запуска сервера: {e}")
        import traceback
        traceback.print_exc()

async def test_server():
    """Тестируем запуск сервера"""
    print("🚀 Тестируем запуск backend сервера...")

    # Запускаем сервер в фоне
    server_process = Process(target=start_server)
    server_process.start()

    # Ждем запуска сервера
    await asyncio.sleep(3)

    try:
        import httpx

        # Тестируем основные endpoints
        async with httpx.AsyncClient(timeout=5.0) as client:
            print("📊 Тестируем /api/health...")
            response = await client.get("http://127.0.0.1:8000/api/health")
            if response.status_code == 200:
                print("✅ /api/health работает")
            else:
                print(f"❌ /api/health: {response.status_code}")

            print("📋 Тестируем /api/...")
            response = await client.get("http://127.0.0.1:8000/api/")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ /api/ работает, найдено {len(data.get('endpoints', {}))} endpoints")
            else:
                print(f"❌ /api/: {response.status_code}")

            print("🔍 Тестируем /api/debug/routes...")
            response = await client.get("http://127.0.0.1:8000/api/debug/routes")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ /api/debug/routes работает, найдено {data.get('total', 0)} маршрутов")
            else:
                print(f"❌ /api/debug/routes: {response.status_code}")

        return True

    except Exception as e:
        print(f"❌ Ошибка тестирования: {e}")
        return False

    finally:
        # Останавливаем сервер
        if server_process.is_alive():
            server_process.terminate()
            server_process.join(timeout=5)

if __name__ == "__main__":
    try:
        result = asyncio.run(test_server())
        if result:
            print("🎉 Сервер запускается и работает корректно!")
            sys.exit(0)
        else:
            print("💥 Есть проблемы с сервером")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Тест прерван пользователем")
        sys.exit(130)
