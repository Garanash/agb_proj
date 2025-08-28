#!/bin/bash

echo "🚀 Запуск Felix Platform..."

# Остановить все контейнеры
echo "📦 Останавливаю все контейнеры..."
docker-compose -f docker-compose.prod.yml down

# Удалить все образы
echo "🗑️ Удаляю все образы..."
docker rmi $(docker images -q) 2>/dev/null || true

# Очистить все контейнеры
echo "🧹 Очищаю все контейнеры..."
docker container prune -f

# Очистить все volumes
echo "🗂️ Очищаю все volumes..."
docker volume prune -f

# Запустить все заново
echo "🏗️ Собираю и запускаю все сервисы..."
docker-compose -f docker-compose.prod.yml up -d --build

# Подождать запуска
echo "⏳ Жду запуска сервисов..."
sleep 60

# Проверить статус
echo "📊 Статус сервисов:"
docker-compose -f docker-compose.prod.yml ps

echo "✅ Запуск завершен!"
echo "🌐 Приложение доступно по адресу: http://localhost"
echo "🔍 Проверка API: curl http://localhost/health"
