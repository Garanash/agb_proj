#!/bin/bash

echo "🚀 AGB Project - Исправление API URL проблемы"
echo "============================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ПРОВЕРКА PRODUCTION.ENV ==="
echo "Текущий NEXT_PUBLIC_API_URL:"
grep "NEXT_PUBLIC_API_URL" config/env/production.env || echo "❌ NEXT_PUBLIC_API_URL не найден!"

echo ""
echo "=== 2. ИСПРАВЛЕНИЕ PRODUCTION.ENV ==="
echo "Установка правильного API URL..."

# Удаляем старую строку если есть
sed -i '/NEXT_PUBLIC_API_URL/d' config/env/production.env

# Добавляем правильную строку
echo "NEXT_PUBLIC_API_URL=http://$SERVER_IP:8000" >> config/env/production.env

echo "Проверка обновления:"
grep "NEXT_PUBLIC_API_URL" config/env/production.env

echo ""
echo "=== 3. ПЕРЕСБОРКА FRONTEND ==="
echo "Остановка frontend..."
docker stop agb_frontend_prod 2>/dev/null || echo "Frontend уже остановлен"

echo "Удаление старого образа..."
docker rmi docker-frontend 2>/dev/null || echo "Образ уже удален"

echo "Пересборка frontend с правильным API URL..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build --no-cache frontend

echo "Запуск frontend..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d frontend

echo ""
echo "=== 4. ПЕРЕЗАПУСК NGINX ==="
docker restart agb_nginx_prod
sleep 10

echo ""
echo "=== 5. ПРОВЕРКА РЕЗУЛЬТАТА ==="
echo "Статус frontend:"
docker ps | grep frontend

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
echo "=== 6. СТАТУС ВСЕХ КОНТЕЙНЕРОВ ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

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
echo "Теперь frontend должен использовать правильный API URL!"
