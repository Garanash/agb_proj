#!/bin/bash

# Скрипт для запуска продакшн деплоя
# Использование: ./deploy-production.sh

set -e

echo "🚀 Запуск продакшн деплоя AGB"
echo "============================="

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

echo "📋 Конфигурация:"
echo "   - База данных: $POSTGRES_DB на $POSTGRES_HOST:$POSTGRES_PORT"
echo "   - Redis: $REDIS_HOST:$REDIS_PORT"
echo "   - N8N: $N8N_HOST:$N8N_PORT"
echo "   - Backend: $BACKEND_HOST:$BACKEND_PORT"
echo "   - Frontend: $FRONTEND_HOST:$FRONTEND_PORT"
echo ""

# Проверяем Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен!"
    exit 1
fi

# Останавливаем существующие контейнеры
echo "🛑 Остановка существующих контейнеров..."
docker-compose -f docker-compose.production.yml down

# Очищаем Docker сети (исправляем конфликт IP)
echo "🧹 Очистка Docker сетей..."
docker network prune -f

# Создаем необходимые директории
echo "📁 Создание директорий..."
mkdir -p logs/nginx
mkdir -p uploads/{ai_processing,documents,portfolio,profiles}

# Запускаем Docker сервисы
echo "🐳 Запуск Docker сервисов..."
docker-compose -f docker-compose.production.yml up -d

# Ждем готовности сервисов
echo "⏳ Ожидание готовности сервисов..."
sleep 10

# Проверяем статус сервисов
echo "🔍 Проверка статуса сервисов..."
docker-compose -f docker-compose.production.yml ps

# Проверяем подключение к базе данных
echo "🗄️  Проверка подключения к базе данных..."
until docker exec agb_postgres pg_isready -U $POSTGRES_USER -d $POSTGRES_DB; do
    echo "   Ожидание PostgreSQL..."
    sleep 2
done

# Проверяем подключение к Redis
echo "🔴 Проверка подключения к Redis..."
until docker exec agb_redis redis-cli ping; do
    echo "   Ожидание Redis..."
    sleep 2
done

# Проверяем N8N
echo "🔄 Проверка N8N..."
until curl -f http://localhost:5678/healthz 2>/dev/null; do
    echo "   Ожидание N8N..."
    sleep 2
done

# Проверяем Nginx
echo "🌐 Проверка Nginx..."
until curl -f http://localhost/health 2>/dev/null; do
    echo "   Ожидание Nginx..."
    sleep 2
done

echo ""
echo "✅ Docker сервисы запущены успешно!"
echo ""
echo "🌐 Доступные сервисы:"
echo "   - Основное приложение: http://localhost"
echo "   - API: http://localhost/api"
echo "   - N8N: http://localhost/n8n"
echo "   - Health check: http://localhost/health"
echo ""
echo "📊 Для мониторинга используйте:"
echo "   docker-compose -f docker-compose.production.yml logs -f"
echo ""
echo "🛑 Для остановки:"
echo "   docker-compose -f docker-compose.production.yml down"
