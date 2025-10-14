#!/bin/bash

echo "🔧 AGB Project - Исправление API URL в frontend"
echo "==============================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ПРОВЕРКА PRODUCTION.ENV ==="
echo "Текущий NEXT_PUBLIC_API_URL:"
grep "NEXT_PUBLIC_API_URL" config/env/production.env

echo ""
echo "=== 2. ОБНОВЛЕНИЕ PRODUCTION.ENV ==="
echo "Обновление NEXT_PUBLIC_API_URL на правильный IP..."
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP/api|g" config/env/production.env

echo "Проверка обновления:"
grep "NEXT_PUBLIC_API_URL" config/env/production.env

echo ""
echo "=== 3. ОСТАНОВКА FRONTEND ==="
echo "Остановка frontend контейнера..."
docker stop agb_frontend_prod
docker rm agb_frontend_prod

echo ""
echo "=== 4. ПЕРЕСБОРКА FRONTEND ==="
echo "Пересборка frontend с новым API URL..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build frontend

echo ""
echo "=== 5. ЗАПУСК FRONTEND ==="
echo "Запуск frontend..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d frontend
sleep 15

echo ""
echo "=== 6. ПРОВЕРКА FRONTEND ==="
echo "Статус frontend:"
docker ps | grep frontend

echo ""
echo "Логи frontend (последние 5 строк):"
docker logs agb_frontend_prod --tail 5

echo ""
echo "=== 7. ПРОВЕРКА NGINX ==="
echo "Перезапуск nginx для применения изменений..."
docker restart agb_nginx_prod
sleep 5

echo ""
echo "=== 8. ТЕСТ ПОДКЛЮЧЕНИЯ ==="
echo "Проверка frontend:"
curl -s http://$SERVER_IP | head -1

echo ""
echo "Проверка backend API:"
curl -s http://$SERVER_IP:8000/api/health | head -1

echo ""
echo "Тест входа:"
curl -X POST http://$SERVER_IP:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://$SERVER_IP" \
  -d '{"username": "admin", "password": "admin123"}' \
  -s | head -1

echo ""
echo "=== 9. СТАТУС ВСЕХ КОНТЕЙНЕРОВ ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

echo ""
echo "🎉 ИСПРАВЛЕНИЕ API URL ЗАВЕРШЕНО!"
echo "================================="
echo "🌐 Frontend: http://$SERVER_IP"
echo "🔧 Backend API: http://$SERVER_IP:8000"
echo "📚 Swagger UI: http://$SERVER_IP:8000/docs"
echo "❤️ Health Check: http://$SERVER_IP:8000/api/health"
echo ""
echo "👤 Логин: admin"
echo "🔑 Пароль: admin123"
echo ""
echo "Теперь попробуйте войти в приложение!"
