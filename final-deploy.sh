#!/bin/bash

echo "🚀 AGB Project - Финальный деплой с исправлениями"
echo "==============================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ОБНОВЛЕНИЕ КОДА ==="
echo "Получение последних изменений..."
git reset --hard HEAD
git clean -fd
git fetch origin
git reset --hard origin/master

echo ""
echo "=== 2. ПЕРЕСБОРКА ВСЕХ СЕРВИСОВ ==="
echo "Остановка всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down

echo "Удаление старых образов..."
docker rmi docker-frontend docker-backend docker-nginx 2>/dev/null || echo "Образы уже удалены"

echo "Очистка кэша Docker..."
docker system prune -f

echo "Пересборка всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build --no-cache

echo ""
echo "=== 3. ЗАПУСК ВСЕХ СЕРВИСОВ ==="
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
echo "Теперь frontend должен автоматически определять API URL!"
