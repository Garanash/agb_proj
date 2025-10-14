#!/bin/bash

echo "🔍 AGB Project - Полная диагностика и исправление"
echo "================================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ДИАГНОСТИКА ТЕКУЩЕГО СОСТОЯНИЯ ==="
echo "Статус всех контейнеров:"
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

echo ""
echo "Проверка production.env:"
grep "NEXT_PUBLIC_API_URL" config/env/production.env

echo ""
echo "Проверка backend health:"
curl -s http://$SERVER_IP:8000/api/health | head -1

echo ""
echo "Проверка frontend:"
curl -s http://$SERVER_IP | head -1

echo ""
echo "=== 2. ИСПРАВЛЕНИЕ API URL ==="
echo "Обновление NEXT_PUBLIC_API_URL..."
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP/api|g" config/env/production.env

echo "Проверка обновления:"
grep "NEXT_PUBLIC_API_URL" config/env/production.env

echo ""
echo "=== 3. ПЕРЕСБОРКА FRONTEND ==="
echo "Остановка frontend..."
docker stop agb_frontend_prod
docker rm agb_frontend_prod

echo "Пересборка frontend..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build frontend

echo "Запуск frontend..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d frontend
sleep 15

echo ""
echo "=== 4. ПЕРЕЗАПУСК NGINX ==="
echo "Перезапуск nginx..."
docker restart agb_nginx_prod
sleep 5

echo ""
echo "=== 5. ФИНАЛЬНАЯ ПРОВЕРКА ==="
echo "Статус всех контейнеров:"
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

echo ""
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
echo "=== 6. ПРОВЕРКА CORS ==="
echo "Тест CORS preflight:"
curl -X OPTIONS http://$SERVER_IP:8000/api/v1/auth/login \
  -H "Origin: http://$SERVER_IP" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "(access-control|HTTP/)"

echo ""
echo "🎉 ДИАГНОСТИКА И ИСПРАВЛЕНИЕ ЗАВЕРШЕНЫ!"
echo "======================================="
echo "🌐 Frontend: http://$SERVER_IP"
echo "🔧 Backend API: http://$SERVER_IP:8000"
echo "📚 Swagger UI: http://$SERVER_IP:8000/docs"
echo "❤️ Health Check: http://$SERVER_IP:8000/api/health"
echo ""
echo "👤 Логин: admin"
echo "🔑 Пароль: admin123"
echo ""
echo "Теперь попробуйте войти в приложение!"
