#!/bin/bash

echo "🚀 AGB Project - Восстановление всех сервисов"
echo "============================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ДИАГНОСТИКА ПРОБЛЕМЫ ==="
echo "Статус всех контейнеров:"
docker ps -a

echo ""
echo "Логи frontend:"
docker logs agb_frontend_prod --tail 20 2>/dev/null || echo "Frontend контейнер не найден"

echo ""
echo "Логи nginx:"
docker logs agb_nginx_prod --tail 10 2>/dev/null || echo "Nginx контейнер не найден"

echo ""
echo "Логи backend:"
docker logs agb_backend_prod --tail 10 2>/dev/null || echo "Backend контейнер не найден"

echo ""
echo "=== 2. ПОЛНАЯ ОЧИСТКА ==="
echo "Остановка всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down

echo "Удаление всех контейнеров..."
docker rm -f agb_frontend_prod agb_backend_prod agb_nginx_prod agb_postgres_prod agb_redis_prod 2>/dev/null || echo "Контейнеры уже удалены"

echo "Удаление всех образов..."
docker rmi -f docker-frontend docker-backend docker-nginx 2>/dev/null || echo "Образы уже удалены"

echo "Очистка кэша Docker..."
docker system prune -f

echo ""
echo "=== 3. ПЕРЕСБОРКА ВСЕХ СЕРВИСОВ ==="
echo "Пересборка всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build --no-cache

echo ""
echo "=== 4. ЗАПУСК ВСЕХ СЕРВИСОВ ==="
echo "Запуск всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d

echo ""
echo "=== 5. ОЖИДАНИЕ ГОТОВНОСТИ ==="
echo "Ожидание готовности сервисов..."
sleep 30

echo ""
echo "=== 6. ПРОВЕРКА РЕЗУЛЬТАТА ==="
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
echo "🎉 ГОТОВО!"
echo "==========="
echo "🌐 Frontend: http://$SERVER_IP"
echo "🔧 Backend API: http://$SERVER_IP:8000"
echo "📚 Swagger UI: http://$SERVER_IP:8000/docs"
echo "❤️ Health Check: http://$SERVER_IP:8000/api/health"
echo ""
echo "👤 Логин: admin"
echo "🔑 Пароль: admin123"
