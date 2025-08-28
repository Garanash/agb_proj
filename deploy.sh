#!/bin/bash

echo "🚀 Запуск Felix Platform..."

# Остановить все
docker-compose -f docker-compose.prod.yml down

# Удалить все образы
docker system prune -af

# Запустить все
docker-compose -f docker-compose.prod.yml up -d --build

echo "✅ Готово! Приложение доступно по адресу: http://localhost"
echo "⏳ Подождите 2-3 минуты для полного запуска"
