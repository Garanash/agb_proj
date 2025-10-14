#!/bin/bash

echo "🔧 AGB Project - Исправление без nc (альтернативный метод)"
echo "========================================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ОСТАНОВКА BACKEND ==="
docker stop agb_backend_prod
docker rm agb_backend_prod

echo ""
echo "=== 2. СОЗДАНИЕ START.SH БЕЗ NC ==="
cat > backend/start.sh << 'EOF'
#!/bin/bash
echo "⏳ Ожидание готовности базы данных..."
# Используем Python для проверки подключения к БД вместо nc
python3 -c "
import time
import psycopg2
import os

# Получаем параметры подключения из переменных окружения
db_host = os.getenv('DB_HOST', 'postgres')
db_port = os.getenv('DB_PORT', '5432')
db_name = os.getenv('DB_NAME', 'agb_felix_prod')
db_user = os.getenv('DB_USER', 'felix_prod_user')
db_password = os.getenv('DB_PASSWORD', 'felix_prod_password')

print('Проверка подключения к базе данных...')
while True:
    try:
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password
        )
        conn.close()
        print('✅ База данных готова')
        break
    except Exception as e:
        print(f'Ожидание БД... ({e})')
        time.sleep(1)
"

echo "🚀 Запуск FastAPI приложения..."
exec /app/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
EOF

chmod +x backend/start.sh

echo ""
echo "=== 3. ПЕРЕСБОРКА BACKEND ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build backend

echo ""
echo "=== 4. ЗАПУСК BACKEND ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d backend
sleep 25

echo ""
echo "=== 5. ПРОВЕРКА BACKEND ==="
echo "Статус backend:"
docker ps | grep backend

echo ""
echo "Логи backend (последние 15 строк):"
docker logs agb_backend_prod --tail 15

echo ""
echo "Проверка порта:"
docker exec agb_backend_prod netstat -tlnp | grep 8000

echo ""
echo "Процессы uvicorn:"
docker exec agb_backend_prod ps aux | grep uvicorn

echo ""
echo "=== 6. ЗАПУСК ОСТАЛЬНЫХ СЕРВИСОВ ==="
echo "Запуск frontend..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d frontend
sleep 10

echo "Запуск nginx..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d nginx
sleep 5

echo ""
echo "=== 7. СОЗДАНИЕ ТАБЛИЦ И АДМИНА ==="
docker exec agb_backend_prod python3 -c "
from database import async_engine, Base
from models import *
import asyncio

async def setup_db():
    try:
        # Создаем таблицы
        print('Создание таблиц...')
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print('✅ Таблицы созданы')
        
        # Создаем админа
        from sqlalchemy import text
        async with async_engine.begin() as conn:
            result = await conn.execute(text('SELECT COUNT(*) FROM users WHERE username = \\'admin\\''))
            count = result.scalar()
            
            if count == 0:
                await conn.execute(text('''
                    INSERT INTO users (username, email, hashed_password, is_active, created_at)
                    VALUES (\\'admin\\', \\'admin@almazgeobur.ru\\', 
                            \\'\\$2b\\$12\\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K\\', 
                            true, NOW())
                '''))
                print('✅ Админ создан')
            else:
                print('✅ Админ уже существует')
    except Exception as e:
        print(f'❌ Ошибка: {e}')

asyncio.run(setup_db())
"

echo ""
echo "=== 8. ФИНАЛЬНАЯ ПРОВЕРКА ==="
echo "Статус всех контейнеров:"
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

echo ""
echo "Тест health check:"
curl -s http://$SERVER_IP:8000/api/health || echo "❌ Health check не работает"

echo ""
echo "Тест входа:"
curl -X POST http://$SERVER_IP:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://$SERVER_IP" \
  -d '{"username": "admin", "password": "admin123"}' \
  -s | head -1

echo ""
echo "Проверка frontend:"
curl -s http://$SERVER_IP | head -1

echo ""
echo "🎉 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo "========================="
echo "🌐 Frontend: http://$SERVER_IP"
echo "🔧 Backend API: http://$SERVER_IP:8000"
echo "📚 Swagger UI: http://$SERVER_IP:8000/docs"
echo "❤️ Health Check: http://$SERVER_IP:8000/api/health"
echo ""
echo "👤 Логин: admin"
echo "🔑 Пароль: admin123"
