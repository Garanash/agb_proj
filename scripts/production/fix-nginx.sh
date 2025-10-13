#!/bin/bash

# Скрипт исправления проблем с Nginx
# Использование: ./fix-nginx.sh

set -e

echo "🔧 Исправление проблем с Nginx"
echo "=============================="

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

echo "🛑 Остановка Nginx..."
docker-compose -f docker-compose.production.yml stop nginx

echo "🧹 Очистка Docker сетей..."
docker network prune -f

echo "🔍 Проверка конфигурации Nginx..."
# Проверяем синтаксис конфигурации
if docker run --rm -v $(pwd)/infrastructure/nginx:/etc/nginx:ro nginx:alpine nginx -t; then
    echo "✅ Конфигурация Nginx корректна"
else
    echo "❌ Ошибка в конфигурации Nginx"
    exit 1
fi

echo "🌐 Запуск Nginx..."
docker-compose -f docker-compose.production.yml up -d nginx

echo "⏳ Ожидание запуска Nginx..."
sleep 5

echo "🔍 Проверка статуса Nginx..."
if docker-compose -f docker-compose.production.yml ps nginx | grep -q "Up"; then
    echo "✅ Nginx запущен успешно"
else
    echo "❌ Nginx не запустился"
    echo "📋 Логи Nginx:"
    docker-compose -f docker-compose.production.yml logs nginx
    exit 1
fi

echo "🌐 Проверка доступности Nginx..."
if curl -f http://localhost/health 2>/dev/null; then
    echo "✅ Nginx отвечает на запросы"
else
    echo "❌ Nginx не отвечает на запросы"
    echo "📋 Логи Nginx:"
    docker-compose -f docker-compose.production.yml logs --tail=20 nginx
fi

echo ""
echo "🎉 Исправление завершено!"
echo ""
echo "📋 Для полной диагностики запустите:"
echo "   ./scripts/production/diagnose-server.sh"
