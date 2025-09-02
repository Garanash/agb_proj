#!/bin/bash

echo "🔧 Исправление проблемы ContainerConfig на сервере..."
echo "=================================================="

# Перейти в директорию проекта
cd ~/agb_proj

echo "📦 Шаг 1: Останавливаем все контейнеры..."
docker-compose down -v --remove-orphans

echo "🧹 Шаг 2: Очищаем поврежденные контейнеры..."
docker container prune -f

echo "🗑️  Шаг 3: Удаляем все неиспользуемые ресурсы..."
docker system prune -a -f
docker volume prune -f
docker network prune -f

echo "🔄 Шаг 4: Перезапускаем Docker демон..."
sudo systemctl restart docker

echo "⏳ Шаг 5: Ждем стабилизации системы..."
sleep 10

echo "🚀 Шаг 6: Запускаем систему заново..."
docker-compose up --build -d

echo "📊 Шаг 7: Проверяем статус..."
sleep 5
docker-compose ps

echo "✅ Исправление завершено!"
echo "=================================================="
echo "Проверьте логи командой: docker-compose logs"
echo "API должен быть доступен по адресу: http://localhost/api/health"
