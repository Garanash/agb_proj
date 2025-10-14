#!/bin/bash

echo "🚀 AGB Project - Кардинальное исправление API URL"
echo "================================================"

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ДИАГНОСТИКА ПРОБЛЕМЫ ==="
echo "Проверка production.env:"
cat config/env/production.env | grep NEXT_PUBLIC_API_URL || echo "❌ NEXT_PUBLIC_API_URL не найден!"

echo ""
echo "Проверка переменных в контейнере:"
docker exec agb_frontend_prod env | grep NEXT_PUBLIC_API_URL || echo "❌ NEXT_PUBLIC_API_URL не найден в контейнере!"

echo ""
echo "=== 2. ИСПРАВЛЕНИЕ PRODUCTION.ENV ==="
echo "Удаление старой строки..."
sed -i '/NEXT_PUBLIC_API_URL/d' config/env/production.env

echo "Добавление правильной строки..."
echo "NEXT_PUBLIC_API_URL=http://$SERVER_IP:8000" >> config/env/production.env

echo "Проверка обновления:"
cat config/env/production.env | grep NEXT_PUBLIC_API_URL

echo ""
echo "=== 3. ПРОВЕРКА DOCKER-COMPOSE ==="
echo "Проверка env_file в docker-compose..."
grep -A 5 -B 5 "env_file" config/docker/docker-compose.prod.yml

echo ""
echo "=== 4. ПОЛНАЯ ПЕРЕСБОРКА FRONTEND ==="
echo "Остановка всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down

echo "Удаление всех образов frontend..."
docker rmi docker-frontend 2>/dev/null || echo "Образ уже удален"

echo "Очистка кэша Docker..."
docker system prune -f

echo "Пересборка frontend с правильными переменными..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build --no-cache frontend

echo "Запуск всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d

echo ""
echo "=== 5. ПРОВЕРКА ПЕРЕМЕННЫХ В КОНТЕЙНЕРЕ ==="
sleep 15
echo "Проверка переменных в новом контейнере:"
docker exec agb_frontend_prod env | grep NEXT_PUBLIC_API_URL || echo "❌ NEXT_PUBLIC_API_URL все еще не найден!"

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
