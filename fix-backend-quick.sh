#!/bin/bash

echo "🔧 AGB Project - Быстрое исправление backend"
echo "============================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ОСТАНОВКА BACKEND ==="
docker stop agb_backend_prod
docker rm agb_backend_prod

echo ""
echo "=== 2. ИСПРАВЛЕНИЕ START.SH ==="
# Создаем правильный start.sh внутри контейнера
docker run --rm -v $(pwd)/backend:/app docker-backend bash -c "
echo '#!/bin/bash
echo \"⏳ Ожидание готовности базы данных...\"
while ! nc -z postgres 5432; do
  sleep 1
done
echo \"✅ База данных готова\"
echo \"🚀 Запуск FastAPI приложения...\"
exec /app/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload' > /app/start.sh && chmod +x /app/start.sh
"

echo ""
echo "=== 3. ПЕРЕСБОРКА BACKEND ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build backend

echo ""
echo "=== 4. ЗАПУСК BACKEND ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d backend
sleep 20

echo ""
echo "=== 5. СОЗДАНИЕ ТАБЛИЦ И АДМИНА ==="
# Создаем таблицы
docker exec agb_backend_prod python3 -c "
from database import async_engine, Base
from models import *
import asyncio

async def create_tables():
    try:
        print('Создание таблиц...')
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print('✅ Таблицы созданы')
    except Exception as e:
        print(f'❌ Ошибка: {e}')

asyncio.run(create_tables())
"

# Создаем админа
docker exec agb_backend_prod python3 -c "
from database import async_engine
from sqlalchemy import text
import asyncio

async def create_admin():
    try:
        async with async_engine.begin() as conn:
            # Проверяем, есть ли уже админ
            result = await conn.execute(text('SELECT COUNT(*) FROM users WHERE username = \\'admin\\''))
            count = result.scalar()
            
            if count == 0:
                # Создаем админа с паролем admin123
                await conn.execute(text('''
                    INSERT INTO users (username, email, hashed_password, is_active, created_at)
                    VALUES (\\'admin\\', \\'admin@almazgeobur.ru\\', 
                            \\'\\$2b\\$12\\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K\\', 
                            true, NOW())
                '''))
                print('✅ Админ создан с паролем admin123')
            else:
                print('✅ Админ уже существует')
    except Exception as e:
        print(f'❌ Ошибка создания админа: {e}')

asyncio.run(create_admin())
"

echo ""
echo "=== 6. ПРОВЕРКА РАБОТОСПОСОБНОСТИ ==="

# Проверяем порт backend
echo "Проверка порта backend:"
docker exec agb_backend_prod netstat -tlnp | grep 8000

# Проверяем процессы
echo "Проверка процессов uvicorn:"
docker exec agb_backend_prod ps aux | grep uvicorn

# Тестируем вход
echo "Тест входа:"
curl -X POST http://$SERVER_IP:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://$SERVER_IP" \
  -d '{"username": "admin", "password": "admin123"}'

echo ""
echo "=== 7. СТАТУС КОНТЕЙНЕРОВ ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

echo ""
echo "🎉 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo "========================="
echo "🌐 Frontend: http://$SERVER_IP"
echo "🔧 Backend API: http://$SERVER_IP:8000"
echo "👤 Логин: admin"
echo "🔑 Пароль: admin123"
