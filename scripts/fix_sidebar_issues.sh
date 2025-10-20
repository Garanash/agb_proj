#!/bin/bash

# Скрипт для исправления проблем с боковым меню
# Использование: ./scripts/fix_sidebar_issues.sh

echo "=== ИСПРАВЛЕНИЕ ПРОБЛЕМ С БОКОВЫМ МЕНЮ ==="
echo ""

echo "1. Проверка переменных окружения frontend:"
docker exec agb_frontend_prod env | grep NEXT_PUBLIC_API_URL

echo ""
echo "2. Перезапуск frontend контейнера:"
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart frontend

echo ""
echo "3. Ожидание готовности frontend (30 секунд):"
sleep 30

echo ""
echo "4. Проверка доступности frontend:"
curl -s http://localhost:3000 | head -c 100 || echo "❌ Frontend недоступен"

echo ""
echo "5. Проверка через nginx:"
curl -s http://localhost | head -c 100 || echo "❌ Nginx недоступен"

echo ""
echo "6. Проверка API endpoints:"
echo "Тест логина admin:"
curl -s -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | head -c 200
echo ""

echo "7. Проверка логов frontend:"
docker logs agb_frontend_prod --tail 10

echo ""
echo "=== ИСПРАВЛЕНИЕ ЗАВЕРШЕНО ==="
echo ""
echo "Если проблемы остаются, проверьте:"
echo "1. Консоль браузера на наличие ошибок JavaScript"
echo "2. Переменную NEXT_PUBLIC_API_URL в production.env"
echo "3. Логи всех контейнеров"
