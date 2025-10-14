#!/bin/bash

# 🔍 AGB Project - Полная диагностика всех проблем
# Автор: AI Assistant
# Версия: 1.0

set -e

echo "🔍 AGB Project - Полная диагностика всех проблем"
echo "================================================"

# Получаем IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. СТАТУС ВСЕХ КОНТЕЙНЕРОВ ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

echo ""
echo "=== 2. ПРОВЕРКА ПОРТОВ НА СЕРВЕРЕ ==="
echo "Порт 80 (Nginx):"
ss -tlnp | grep :80 || echo "❌ Порт 80 не слушается"
echo "Порт 8000 (Backend):"
ss -tlnp | grep :8000 || echo "❌ Порт 8000 не слушается"

echo ""
echo "=== 3. ПРОВЕРКА BACKEND КОНТЕЙНЕРА ==="
echo "Статус backend контейнера:"
docker ps | grep backend || echo "❌ Backend контейнер не найден"

echo "Процессы uvicorn в backend:"
docker exec agb_backend_prod ps aux | grep uvicorn || echo "❌ Uvicorn не запущен"

echo "Порт 8000 внутри backend контейнера:"
docker exec agb_backend_prod netstat -tlnp | grep 8000 || echo "❌ Порт 8000 не слушается внутри контейнера"

echo "Логи backend (последние 10 строк):"
docker logs agb_backend_prod --tail 10

echo ""
echo "=== 4. ПРОВЕРКА FRONTEND КОНТЕЙНЕРА ==="
echo "Статус frontend контейнера:"
docker ps | grep frontend || echo "❌ Frontend контейнер не найден"

echo "Порт 3000 внутри frontend контейнера:"
docker exec agb_frontend_prod netstat -tlnp | grep 3000 || echo "❌ Порт 3000 не слушается внутри контейнера"

echo "Логи frontend (последние 5 строк):"
docker logs agb_frontend_prod --tail 5

echo ""
echo "=== 5. ПРОВЕРКА NGINX КОНТЕЙНЕРА ==="
echo "Статус nginx контейнера:"
docker ps | grep nginx || echo "❌ Nginx контейнер не найден"

echo "Логи nginx (последние 5 строк):"
docker logs agb_nginx_prod --tail 5

echo ""
echo "=== 6. ПРОВЕРКА БАЗЫ ДАННЫХ ==="
echo "Статус postgres контейнера:"
docker ps | grep postgres || echo "❌ Postgres контейнер не найден"

echo "Пользователи в БД:"
docker exec agb_postgres_prod psql -U felix_prod_user -d agb_felix_prod -c "SELECT id, username, email, is_active FROM users LIMIT 3;" || echo "❌ Не удалось подключиться к БД"

echo ""
echo "=== 7. ПРОВЕРКА КОНФИГУРАЦИИ ==="
echo "NEXT_PUBLIC_API_URL в production.env:"
grep NEXT_PUBLIC_API_URL config/env/production.env || echo "❌ NEXT_PUBLIC_API_URL не найден"

echo "ADMIN_PASSWORD в production.env:"
grep ADMIN_PASSWORD config/env/production.env || echo "❌ ADMIN_PASSWORD не найден"

echo ""
echo "=== 8. ТЕСТ ПОДКЛЮЧЕНИЙ ==="
echo "Тест backend health check:"
curl -f http://localhost:8000/api/health 2>/dev/null && echo "✅ Backend health check OK" || echo "❌ Backend health check FAILED"

echo "Тест backend health check снаружи:"
curl -f http://$SERVER_IP:8000/api/health 2>/dev/null && echo "✅ Backend доступен снаружи" || echo "❌ Backend недоступен снаружи"

echo "Тест frontend:"
curl -f http://localhost:3000 2>/dev/null && echo "✅ Frontend доступен" || echo "❌ Frontend недоступен"

echo "Тест nginx:"
curl -f http://localhost 2>/dev/null && echo "✅ Nginx доступен" || echo "❌ Nginx недоступен"

echo ""
echo "=== 9. ТЕСТ АВТОРИЗАЦИИ ==="
echo "Тест входа с паролем admin123:"
curl -X POST http://$SERVER_IP:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://$SERVER_IP" \
  -d '{"username": "admin", "password": "admin123"}' 2>/dev/null && echo "✅ Вход с admin123 OK" || echo "❌ Вход с admin123 FAILED"

echo "Тест входа с паролем из production.env:"
ADMIN_PASS=$(grep ADMIN_PASSWORD config/env/production.env | cut -d'=' -f2)
curl -X POST http://$SERVER_IP:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://$SERVER_IP" \
  -d "{\"username\": \"admin\", \"password\": \"$ADMIN_PASS\"}" 2>/dev/null && echo "✅ Вход с production.env паролем OK" || echo "❌ Вход с production.env паролем FAILED"

echo ""
echo "=== 10. ПРОВЕРКА CORS ==="
echo "Тест CORS preflight:"
curl -X OPTIONS http://$SERVER_IP:8000/api/v1/auth/login \
  -H "Origin: http://$SERVER_IP" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -i "access-control" || echo "❌ CORS заголовки не найдены"

echo ""
echo "=== 11. ПРОВЕРКА СЕТИ DOCKER ==="
echo "Docker сети:"
docker network ls | grep app-network || echo "❌ Сеть app-network не найдена"

echo "Контейнеры в сети app-network:"
docker network inspect docker_app-network 2>/dev/null | grep -A 5 "Containers" || echo "❌ Не удалось получить информацию о сети"

echo ""
echo "=== 12. ПРОВЕРКА VOLUMES ==="
echo "Docker volumes:"
docker volume ls | grep docker || echo "❌ Volumes не найдены"

echo ""
echo "🔍 ДИАГНОСТИКА ЗАВЕРШЕНА"
echo "========================="
echo "📋 Отправьте этот вывод для анализа проблем"
