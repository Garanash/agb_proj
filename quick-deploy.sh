#!/bin/bash

# Быстрый деплой скрипт для сервера
# Использование: ./quick-deploy.sh

set -e

echo "🚀 Быстрый деплой приложения"

# Проверяем, что мы на сервере
if [ "$USER" != "root" ]; then
    echo "❌ Этот скрипт должен запускаться от root пользователя"
    exit 1
fi

echo "📦 Обновляем код из репозитория..."
git pull origin master

echo "🔧 Останавливаем старые контейнеры..."
docker-compose down || true

echo "🐳 Запускаем новые контейнеры..."
docker-compose up -d --build

echo "⏳ Ждем запуска сервисов..."
sleep 30

echo "📊 Статус сервисов:"
docker-compose ps

echo "🔍 Последние логи:"
docker-compose logs --tail=20

echo "✅ Деплой завершен!"
echo ""
echo "🌐 Проверить приложение: curl http://localhost/api/health"
echo "📝 Проверить логи: docker-compose logs -f"
