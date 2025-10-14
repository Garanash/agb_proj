#!/bin/bash

# 🔧 AGB Project - Исправление CORS проблемы
# Автор: AI Assistant
# Версия: 1.0

echo "🔧 AGB Project - Исправление CORS проблемы"
echo "=========================================="

# Получаем IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

echo "🛑 Шаг 1: Остановка всех контейнеров"
echo "-----------------------------------"

# Останавливаем все контейнеры
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down

echo "📝 Шаг 2: Обновление конфигурации"
echo "--------------------------------"

# Обновляем production.env с правильным IP
if [ -f "config/env/production.env" ]; then
    # Обновляем NEXT_PUBLIC_API_URL
    sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP/api|g" config/env/production.env
    
    # Обновляем ADMIN_EMAIL
    sed -i "s|ADMIN_EMAIL=.*|ADMIN_EMAIL=admin@$SERVER_IP|g" config/env/production.env
    
    echo "✅ Конфигурация обновлена"
    echo "📋 NEXT_PUBLIC_API_URL: http://$SERVER_IP/api"
    echo "📋 ADMIN_EMAIL: admin@$SERVER_IP"
else
    echo "❌ Файл config/env/production.env не найден!"
    exit 1
fi

echo "🗑️ Шаг 3: Удаление frontend контейнера и образа"
echo "----------------------------------------------"

# Удаляем frontend контейнер
docker rm agb_frontend_prod 2>/dev/null || true

# Удаляем frontend образ
docker rmi docker-frontend 2>/dev/null || true

echo "📦 Шаг 4: Пересборка frontend с правильным API URL"
echo "------------------------------------------------"

# Пересобираем только frontend
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build frontend

echo "🚀 Шаг 5: Запуск всех сервисов"
echo "-----------------------------"

# Запускаем все сервисы
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d

echo "⏳ Шаг 6: Ожидание готовности сервисов"
echo "------------------------------------"

# Ждем готовности сервисов
echo "Ожидание готовности сервисов (120 секунд)..."
sleep 120

echo "📊 Шаг 7: Проверка статуса"
echo "------------------------"

# Проверяем статус
docker ps

echo ""
echo "🔍 Проверка доступности сервисов:"
echo "• Frontend: http://$SERVER_IP"
echo "• Backend API: http://$SERVER_IP:8000/docs"
echo "• Health Check: http://$SERVER_IP/api/health"

echo ""
echo "✅ Исправление CORS завершено!"
echo ""
echo "📋 Учетные данные администратора:"
echo "• Логин: admin"
echo "• Пароль: $(grep ADMIN_PASSWORD config/env/production.env | cut -d'=' -f2)"
echo ""
echo "🌐 Откройте http://$SERVER_IP в браузере"
