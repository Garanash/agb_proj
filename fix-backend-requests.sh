#!/bin/bash

# 🔧 AGB Project - Исправление проблемы с requests модулем
# Автор: AI Assistant
# Версия: 1.0

echo "🔧 AGB Project - Исправление проблемы с requests"
echo "==============================================="

echo "🛑 Шаг 1: Остановка всех контейнеров"
echo "-----------------------------------"

# Останавливаем все контейнеры
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down

echo "🗑️ Шаг 2: Удаление backend контейнера и образа"
echo "---------------------------------------------"

# Удаляем backend контейнер
docker rm agb_backend_prod 2>/dev/null || true

# Удаляем backend образ
docker rmi docker-backend 2>/dev/null || true

echo "📦 Шаг 3: Пересборка backend с исправленными зависимостями"
echo "--------------------------------------------------------"

# Пересобираем только backend
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build backend

echo "🚀 Шаг 4: Запуск всех сервисов"
echo "-----------------------------"

# Запускаем все сервисы
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d

echo "⏳ Шаг 5: Ожидание готовности backend"
echo "-----------------------------------"

# Ждем готовности backend
echo "Ожидание готовности backend (60 секунд)..."
sleep 60

echo "📊 Шаг 6: Проверка статуса"
echo "------------------------"

# Проверяем статус
docker ps

echo ""
echo "🔍 Проверка логов backend:"
docker logs agb_backend_prod --tail 20

echo ""
echo "✅ Исправление завершено!"
echo ""
echo "🌐 Проверьте доступность:"
echo "• Frontend: http://localhost"
echo "• Backend API: http://localhost:8000/docs"
echo "• Health Check: http://localhost/api/health"
