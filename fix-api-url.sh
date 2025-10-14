#!/bin/bash

echo "🔧 AGB Project - Быстрое исправление API URL"
echo "============================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ОБНОВЛЕНИЕ PRODUCTION.ENV ==="
echo "Обновление NEXT_PUBLIC_API_URL..."
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP/api|g" config/env/production.env

echo "Проверка обновления:"
grep "NEXT_PUBLIC_API_URL" config/env/production.env

echo ""
echo "=== 2. ПЕРЕСБОРКА FRONTEND ==="
echo "Остановка frontend..."
docker stop agb_frontend_prod
docker rm agb_frontend_prod

echo "Пересборка frontend с новым API URL..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build frontend

echo "Запуск frontend..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d frontend
sleep 15

echo ""
echo "=== 3. ПРОВЕРКА РЕЗУЛЬТАТА ==="
echo "Статус frontend:"
docker ps | grep frontend

echo ""
echo "Проверка frontend:"
curl -s http://$SERVER_IP | head -1

echo ""
echo "🎉 ИСПРАВЛЕНИЕ API URL ЗАВЕРШЕНО!"
echo "================================="
echo "🌐 Frontend: http://$SERVER_IP"
echo "🔧 Backend API: http://$SERVER_IP:8000"
echo ""
echo "👤 Логин: admin"
echo "🔑 Пароль: admin123"
