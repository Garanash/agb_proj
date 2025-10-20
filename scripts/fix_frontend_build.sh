#!/bin/bash
set -e

echo "=== ИСПРАВЛЕНИЕ СБОРКИ ФРОНТЕНДА ==="

# 1. Обновление кода
echo "1) Обновление кода..."
git pull

# 2. Пересборка фронтенда с standalone режимом
echo "2) Пересборка фронтенда..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build --no-cache frontend

# 3. Перезапуск фронтенда и nginx
echo "3) Перезапуск сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d frontend nginx

# 4. Проверка статуса
echo "4) Проверка статуса контейнеров..."
docker ps | grep -E "(frontend|nginx)"

echo "✅ Фронтенд пересобран и перезапущен!"
echo "Обновите страницу в браузере (Cmd/Ctrl+Shift+R)"
