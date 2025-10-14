#!/bin/bash

echo "🚀 AGB Project - Одна команда для запуска всего"
echo "==============================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== ПОЛНАЯ ОЧИСТКА И ЗАПУСК ==="

# Останавливаем все
echo "1. Остановка всех контейнеров..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down
docker system prune -f

# Удаляем проблемные сети
echo "2. Очистка Docker сетей..."
docker network prune -f

# Создаем правильный start.sh
echo "3. Создание правильного start.sh..."
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

# Обновляем production.env
echo "4. Обновление конфигурации..."
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP/api|g" config/env/production.env
sed -i "s|ADMIN_EMAIL=.*|ADMIN_EMAIL=admin@almazgeobur.ru|g" config/env/production.env

# Запускаем все
echo "5. Запуск всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d --build
sleep 30

# Создаем таблицы и админа
echo "6. Создание таблиц и админа..."
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

# Проверяем результат
echo ""
echo "=== ПРОВЕРКА РЕЗУЛЬТАТА ==="
echo "Статус контейнеров:"
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

echo ""
echo "Проверка порта backend:"
docker exec agb_backend_prod netstat -tlnp | grep 8000

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
echo "📚 Swagger UI: http://$SERVER_IP:8000/docs"
echo "❤️ Health Check: http://$SERVER_IP:8000/api/health"
echo ""
echo "👤 Логин: admin"
echo "🔑 Пароль: admin123"
echo ""
echo "🛑 Остановить: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down"
