#!/bin/bash

echo "🚀 AGB Project - Быстрое исправление uvicorn"
echo "============================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ОСТАНОВКА BACKEND ==="
docker stop agb_backend_prod
docker rm agb_backend_prod

echo ""
echo "=== 2. СОЗДАНИЕ ПРОСТОГО START.SH ==="
cat > backend/start.sh << 'EOF'
#!/bin/bash
echo "⏳ Ожидание готовности базы данных..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ База данных готова"

echo "🚀 Запуск FastAPI приложения..."
# Используем python -m uvicorn вместо прямого вызова
exec python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
EOF

chmod +x backend/start.sh

echo ""
echo "=== 3. ПЕРЕСБОРКА И ЗАПУСК ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build backend
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d backend
sleep 20

echo ""
echo "=== 4. ПРОВЕРКА ==="
echo "Статус backend:"
docker ps | grep backend

echo ""
echo "Логи backend:"
docker logs agb_backend_prod --tail 10

echo ""
echo "Проверка порта:"
docker exec agb_backend_prod netstat -tlnp | grep 8000

echo ""
echo "=== 5. ЗАПУСК ОСТАЛЬНЫХ СЕРВИСОВ ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d frontend nginx
sleep 10

echo ""
echo "=== 6. СОЗДАНИЕ ТАБЛИЦ И АДМИНА ==="
docker exec agb_backend_prod python3 -c "
from database import async_engine, Base
from models import *
import asyncio

async def setup_db():
    try:
        print('Создание таблиц...')
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            print('✅ Таблицы созданы')
        
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
echo "=== 7. ФИНАЛЬНАЯ ПРОВЕРКА ==="
echo "Статус всех контейнеров:"
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

echo ""
echo "Тест входа:"
curl -X POST http://$SERVER_IP:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://$SERVER_IP" \
  -d '{"username": "admin", "password": "admin123"}' \
  -s | head -1

echo ""
echo "🎉 ГОТОВО!"
echo "==========="
echo "🌐 Frontend: http://$SERVER_IP"
echo "🔧 Backend API: http://$SERVER_IP:8000"
echo "👤 Логин: admin"
echo "🔑 Пароль: admin123"
