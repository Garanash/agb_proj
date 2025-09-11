#!/bin/bash

# Скрипт для развертывания проекта в production
# Автоматически создает базу данных и инициализирует все данные

set -e

echo "🚀 AGB Project - Production Развертывание"
echo "========================================"

# Проверяем наличие Docker и Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    exit 1
fi

# Проверяем наличие production.env файла
if [ ! -f "production.env" ]; then
    echo "❌ Файл production.env не найден!"
    echo "Скопируйте production.env.example в production.env и настройте переменные:"
    echo "   cp production.env.example production.env"
    echo "   nano production.env"
    exit 1
fi

# Останавливаем и удаляем существующие контейнеры
echo "🔄 Остановка существующих production контейнеров..."
docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true

# Удаляем старые образы (опционально)
echo "🗑️  Удаление старых production образов..."
docker-compose -f docker-compose.prod.yml down --rmi all 2>/dev/null || true

# Собираем и запускаем контейнеры
echo "🔨 Сборка и запуск production контейнеров..."
docker-compose -f docker-compose.prod.yml up --build -d

# Ждем готовности сервисов
echo "⏳ Ожидание готовности production сервисов..."
sleep 60

# Проверяем статус контейнеров
echo "📊 Статус production контейнеров:"
docker-compose -f docker-compose.prod.yml ps

# Проверяем healthcheck
echo "🏥 Проверка здоровья production сервисов..."
for i in {1..15}; do
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "✅ Production Backend готов к работе"
        break
    else
        echo "⏳ Ожидание готовности production backend... ($i/15)"
        sleep 15
    fi
done

# Проверяем frontend
for i in {1..15}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Production Frontend готов к работе"
        break
    else
        echo "⏳ Ожидание готовности production frontend... ($i/15)"
        sleep 15
    fi
done

echo ""
echo "🎉 PRODUCTION РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
echo "====================================="
echo ""
echo "📋 Доступ к production системе:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   🔧 Backend API: http://localhost:8000"
echo "   📊 API Docs: http://localhost:8000/docs"
echo ""
echo "🔧 Полезные команды для production:"
echo "   docker-compose -f docker-compose.prod.yml logs -f     # Просмотр логов"
echo "   docker-compose -f docker-compose.prod.yml restart     # Перезапуск сервисов"
echo "   docker-compose -f docker-compose.prod.yml down        # Остановка сервисов"
echo "   docker-compose -f docker-compose.prod.yml exec backend bash # Подключение к backend"
echo ""
echo "📊 Мониторинг:"
echo "   docker-compose -f docker-compose.prod.yml logs --tail=100 backend"
echo "   docker-compose -f docker-compose.prod.yml logs --tail=100 frontend"
echo "   docker-compose -f docker-compose.prod.yml logs --tail=100 postgres"
echo ""
echo "🔄 Автообновление (если включено):"
echo "   docker-compose -f docker-compose.prod.yml --profile monitoring up -d"
