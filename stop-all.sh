#!/bin/bash

# 🛑 AGB Project - Быстрая остановка
# Автор: AI Assistant
# Версия: 1.0

echo "🛑 AGB Project - Остановка всех сервисов"
echo "======================================="

echo "⏹️ Остановка контейнеров..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down

echo "🧹 Очистка volumes..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down -v

echo "✅ Все сервисы остановлены!"
echo ""
echo "🚀 Для повторного запуска используйте: ./quick-start.sh"
