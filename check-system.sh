#!/bin/bash

echo "🔍 Проверка состояния системы AGB Project"
echo "=========================================="

# Перейти в директорию проекта
cd ~/agb_proj

echo "📊 Статус контейнеров:"
docker-compose ps

echo ""
echo "🌐 Проверка API бэкенда:"
curl -s http://localhost:8000/api/health

echo ""
echo "🗄️ Проверка подключения к PostgreSQL:"
docker-compose exec postgres psql -U test_user -d test_platform_db -c "SELECT COUNT(*) as users_count FROM users;" 2>/dev/null

echo ""
echo "📋 Последние логи бэкенда:"
docker-compose logs backend | tail -3

echo ""
echo "✅ Проверка завершена!"