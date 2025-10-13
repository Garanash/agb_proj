#!/bin/bash

# 🔧 AGB Project - Исправление проблем с Docker на сервере
# Автор: AI Assistant
# Версия: 1.0

echo "🔧 AGB Project - Исправление проблем с Docker"
echo "============================================="

echo "🛑 Шаг 1: Остановка всех контейнеров проекта"
echo "--------------------------------------------"

# Останавливаем все контейнеры проекта
docker stop agb_nginx_prod agb_frontend_prod agb_backend_prod agb_postgres_prod agb_redis_prod 2>/dev/null || true

echo "🗑️ Шаг 2: Удаление контейнеров"
echo "-----------------------------"

# Удаляем контейнеры
docker rm agb_nginx_prod agb_frontend_prod agb_backend_prod agb_postgres_prod agb_redis_prod 2>/dev/null || true

echo "🌐 Шаг 3: Удаление сети Docker"
echo "-----------------------------"

# Удаляем сеть
docker network rm docker_app-network 2>/dev/null || true

echo "💾 Шаг 4: Очистка volumes"
echo "------------------------"

# Удаляем volumes
docker volume rm docker_postgres_data docker_redis_data docker_uploads_data 2>/dev/null || true

echo "🧹 Шаг 5: Очистка неиспользуемых ресурсов"
echo "---------------------------------------"

# Очищаем неиспользуемые ресурсы
docker system prune -f

echo "✅ Шаг 6: Проверка статуса"
echo "------------------------"

echo "📊 Список сетей:"
docker network ls | grep -E "(docker_app-network|agb)"

echo ""
echo "📊 Список volumes:"
docker volume ls | grep -E "(docker_|agb_)"

echo ""
echo "📊 Список контейнеров:"
docker ps -a | grep -E "(agb_|docker-)"

echo ""
echo "🎉 Исправление завершено!"
echo ""
echo "🚀 Теперь можно запустить: ./quick-start.sh"
