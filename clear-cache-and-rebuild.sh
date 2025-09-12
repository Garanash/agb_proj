#!/bin/bash

echo "🧹 Очистка кэша и пересборка приложения..."

# Остановка всех контейнеров
echo "⏹️ Остановка контейнеров..."
docker-compose -f config/docker/docker-compose.yml down

# Удаление всех контейнеров
echo "🗑️ Удаление контейнеров..."
docker-compose -f config/docker/docker-compose.yml rm -f

# Удаление всех образов
echo "🗑️ Удаление образов..."
docker rmi $(docker images -q) 2>/dev/null || true

# Очистка Docker кэша
echo "🧹 Очистка Docker кэша..."
docker system prune -f

# Пересборка всех сервисов
echo "🔨 Пересборка всех сервисов..."
docker-compose -f config/docker/docker-compose.yml build --no-cache

# Запуск всех сервисов
echo "🚀 Запуск всех сервисов..."
docker-compose -f config/docker/docker-compose.yml up -d

# Ожидание запуска
echo "⏳ Ожидание запуска сервисов..."
sleep 30

# Проверка статуса
echo "✅ Проверка статуса..."
docker-compose -f config/docker/docker-compose.yml ps

echo "🎉 Готово! Приложение пересобрано с полной очисткой кэша."
echo "🌐 Откройте http://localhost в браузере"
echo "💡 Если проблемы остаются, очистите кэш браузера (Ctrl+Shift+Delete)"
