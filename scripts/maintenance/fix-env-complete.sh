#!/bin/bash

echo "🔧 Полное исправление проблемы с переменными окружения..."
echo "============================================================"

# Перейти в директорию проекта
cd ~/agb_proj

echo "📋 Шаг 1: Проверяем текущий production.env..."
echo "----------------------------------------"
cat production.env
echo "----------------------------------------"

echo ""
echo "📋 Шаг 2: Полностью останавливаем все сервисы..."
docker-compose down -v --remove-orphans

echo ""
echo "📋 Шаг 3: Очищаем Docker от поврежденных данных..."
docker system prune -a -f
docker volume prune -f

echo ""
echo "📋 Шаг 4: Перезапускаем Docker демон..."
sudo systemctl restart docker
sleep 5

echo ""
echo "📋 Шаг 5: Создаем новые volumes..."
docker volume create agb_proj_postgres_data
docker volume create agb_proj_uploads_data

echo ""
echo "📋 Шаг 6: Запускаем только PostgreSQL для инициализации..."
docker-compose up -d postgres
sleep 10

echo ""
echo "📋 Шаг 7: Проверяем что PostgreSQL работает..."
docker-compose ps

echo ""
echo "📋 Шаг 8: Запускаем остальные сервисы..."
docker-compose up -d backend frontend nginx

echo ""
echo "📋 Шаг 9: Ждем запуска системы..."
sleep 15

echo ""
echo "📋 Шаг 10: Проверяем статус всех сервисов..."
docker-compose ps

echo ""
echo "📋 Шаг 11: Проверяем логи бэкенда..."
docker-compose logs backend | tail -5

echo ""
echo "📋 Шаг 12: Тестируем API..."
curl -s http://localhost:8000/api/health | head -3

echo ""
echo "✅ Исправление завершено!"
echo "============================================================"
echo "Если проблема сохраняется, проверьте логи командой:"
echo "docker-compose logs backend"
