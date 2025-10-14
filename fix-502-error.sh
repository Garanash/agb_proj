#!/bin/bash

echo "🚀 AGB Project - Быстрое восстановление от 502 ошибки"
echo "===================================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ДИАГНОСТИКА ПРОБЛЕМЫ ==="
echo "Статус всех контейнеров:"
docker ps -a

echo ""
echo "Логи nginx:"
docker logs agb_nginx_prod --tail 10 2>/dev/null || echo "Nginx контейнер не найден"

echo ""
echo "Логи frontend:"
docker logs agb_frontend_prod --tail 10 2>/dev/null || echo "Frontend контейнер не найден"

echo ""
echo "=== 2. БЫСТРОЕ ВОССТАНОВЛЕНИЕ ==="
echo "Остановка всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down

echo "Удаление проблемных контейнеров..."
docker rm -f agb_frontend_prod agb_nginx_prod 2>/dev/null || echo "Контейнеры уже удалены"

echo "Удаление образов frontend и nginx..."
docker rmi docker-frontend docker-nginx 2>/dev/null || echo "Образы уже удалены"

echo "Очистка кэша Docker..."
docker system prune -f

echo ""
echo "=== 3. ПЕРЕСБОРКА И ЗАПУСК ==="
echo "Пересборка frontend и nginx..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build --no-cache frontend nginx

echo "Запуск всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d

echo ""
echo "=== 4. ОЖИДАНИЕ ГОТОВНОСТИ ==="
echo "Ожидание готовности сервисов..."
sleep 30

echo ""
echo "=== 5. ПРОВЕРКА РЕЗУЛЬТАТА ==="
echo "Статус всех контейнеров:"
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

echo ""
echo "Проверка frontend:"
curl -s http://$SERVER_IP | head -1

echo ""
echo "Проверка backend API:"
curl -s http://$SERVER_IP:8000/api/health | head -1

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
