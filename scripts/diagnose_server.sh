#!/bin/bash

# Диагностический скрипт для проверки состояния сервера
# Использование: ./scripts/diagnose_server.sh

echo "=== ДИАГНОСТИКА СОСТОЯНИЯ СЕРВЕРА ==="
echo ""

echo "1. Проверка статуса контейнеров:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "2. Проверка логов backend:"
docker logs agb_backend_prod --tail 20

echo ""
echo "3. Проверка логов frontend:"
docker logs agb_frontend_prod --tail 20

echo ""
echo "4. Проверка логов nginx:"
docker logs agb_nginx_prod --tail 10

echo ""
echo "5. Проверка health endpoints:"
echo "Backend health:"
curl -s http://localhost:8000/api/health || echo "❌ Backend недоступен"

echo ""
echo "Frontend health:"
curl -s http://localhost:3000 | head -c 100 || echo "❌ Frontend недоступен"

echo ""
echo "6. Проверка API endpoints:"
echo "Тест логина admin:"
curl -s -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | head -c 200
echo ""

echo "Тест логина d.li:"
curl -s -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"d.li","password":"123456"}' | head -c 200
echo ""

echo "7. Проверка переменных окружения frontend:"
docker exec agb_frontend_prod env | grep -E "NEXT_PUBLIC|NODE_ENV" || echo "❌ Переменные окружения не найдены"

echo ""
echo "8. Проверка доступности через nginx:"
curl -s http://localhost/health || echo "❌ Nginx недоступен"

echo ""
echo "9. Проверка базы данных:"
docker exec agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "SELECT COUNT(*) FROM users;" || echo "❌ Ошибка подключения к БД"

echo ""
echo "=== ДИАГНОСТИКА ЗАВЕРШЕНА ==="
