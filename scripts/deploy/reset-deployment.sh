#!/bin/bash

# Скрипт для полной очистки и пересборки проекта
# Используйте когда нужно "начать с чистого листа"

set -e

echo "🔄 AGB Project - Полная очистка и пересборка"
echo "==========================================="

# Подтверждение действия
read -p "⚠️  Это удалит ВСЕ данные и контейнеры. Продолжить? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Операция отменена"
    exit 1
fi

echo "🛑 Остановка всех контейнеров..."
docker-compose down -v 2>/dev/null || true
docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true

echo "🗑️  Удаление всех образов..."
docker-compose down --rmi all 2>/dev/null || true
docker-compose -f docker-compose.prod.yml down --rmi all 2>/dev/null || true

echo "🧹 Очистка Docker системы..."
docker system prune -f
docker volume prune -f

echo "📁 Очистка локальных файлов..."
# Удаляем кэш и временные файлы
rm -rf frontend/.next 2>/dev/null || true
rm -rf frontend/node_modules 2>/dev/null || true
rm -rf backend/__pycache__ 2>/dev/null || true
rm -rf backend/*.pyc 2>/dev/null || true

echo "🔨 Пересборка проекта..."
docker-compose build --no-cache

echo "🚀 Запуск обновленного проекта..."
docker-compose up -d

echo "⏳ Ожидание готовности сервисов..."
sleep 30

echo "🧪 Тестирование развертывания..."
./test-deployment.sh

echo ""
echo "🎉 ПЕРЕСБОРКА ЗАВЕРШЕНА!"
echo "======================="
echo ""
echo "Система полностью пересобрана и готова к работе."
echo "Все данные инициализированы заново."
echo ""
echo "🌐 Доступ к системе:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
