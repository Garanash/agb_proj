#!/bin/bash

echo "🔧 AGB Project - Полное исправление всех проблем"
echo "================================================"

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ОСТАНОВКА ВСЕХ КОНТЕЙНЕРОВ ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down
sleep 5

echo ""
echo "=== 2. ИСПРАВЛЕНИЕ BACKEND START.SH ==="
# Создаем правильный start.sh
cat > backend/start.sh << 'EOF'
#!/bin/bash
echo "⏳ Ожидание готовности базы данных..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ База данных готова"
echo "🚀 Запуск FastAPI приложения..."
exec /app/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
EOF

chmod +x backend/start.sh

echo ""
echo "=== 3. ИСПРАВЛЕНИЕ CORS В MAIN.PY ==="
# Обновляем CORS настройки
sed -i "s|allow_origins=\[.*\]|allow_origins=[\"http://localhost:3000\", \"http://localhost:3001\", \"http://$SERVER_IP\", \"http://$SERVER_IP:3000\", \"http://$SERVER_IP:80\"]|g" backend/main.py

echo ""
echo "=== 4. ОБНОВЛЕНИЕ PRODUCTION.ENV ==="
# Обновляем API URL
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP/api|g" config/env/production.env
sed -i "s|ADMIN_EMAIL=.*|ADMIN_EMAIL=admin@almazgeobur.ru|g" config/env/production.env

echo ""
echo "=== 5. ПЕРЕСБОРКА BACKEND ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build backend

echo ""
echo "=== 6. ЗАПУСК ВСЕХ СЕРВИСОВ ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d
sleep 30

echo ""
echo "=== 7. СОЗДАНИЕ ТАБЛИЦ И АДМИНА ==="
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
                # Создаем админа
                await conn.execute(text('''
                    INSERT INTO users (username, email, hashed_password, is_active, is_superuser, created_at)
                    VALUES (\\'admin\\', \\'admin@almazgeobur.ru\\', \\'\\$2b\\$12\\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J8K8K8K8K\\', true, true, NOW())
                '''))
                print('✅ Админ создан')
            else:
                print('✅ Админ уже существует')
    except Exception as e:
        print(f'❌ Ошибка создания админа: {e}')

asyncio.run(create_admin())
"

echo ""
echo "=== 8. ПРОВЕРКА РАБОТОСПОСОБНОСТИ ==="

# Проверяем порт backend
echo "Проверка порта backend:"
docker exec agb_backend_prod netstat -tlnp | grep 8000 || echo "❌ Порт 8000 не слушается"

# Проверяем health check
echo "Проверка health check:"
curl -s http://$SERVER_IP:8000/api/health | head -1 || echo "❌ Health check не работает"

# Тестируем вход
echo "Тест входа:"
curl -X POST http://$SERVER_IP:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://$SERVER_IP" \
  -d '{"username": "admin", "password": "admin123"}' \
  -s | head -1 || echo "❌ Вход не работает"

echo ""
echo "=== 9. СТАТУС ВСЕХ КОНТЕЙНЕРОВ ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

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
echo ""
echo "🛑 Остановить: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down"
