#!/bin/bash

# Скрипт для запуска n8n с интеграцией AGB Platform

echo "🚀 Запуск n8n с интеграцией AGB Platform..."

# Проверяем, что мы в правильной директории
if [ ! -f "config/docker/docker-compose.n8n.yml" ]; then
    echo "❌ Ошибка: Запустите скрипт из корневой директории проекта"
    exit 1
fi

# Создаем директории для n8n, если их нет
mkdir -p config/docker/n8n/workflows
mkdir -p config/docker/n8n/credentials

# Копируем файл переменных окружения, если его нет
if [ ! -f "config/env/n8n.env" ]; then
    echo "⚠️  Файл config/env/n8n.env не найден. Создайте его на основе config/env/n8n.env.example"
    exit 1
fi

# Загружаем переменные окружения
export $(cat config/env/n8n.env | grep -v '^#' | xargs)

# Проверяем, что основные сервисы запущены
echo "🔍 Проверка зависимостей..."

# Проверяем PostgreSQL
if ! docker ps | grep -q "test_platform_postgres"; then
    echo "❌ PostgreSQL не запущен. Запустите сначала основную платформу:"
    echo "   docker-compose -f config/docker/docker-compose.yml up -d postgres"
    exit 1
fi

# Проверяем Redis
if ! docker ps | grep -q "agb_redis"; then
    echo "🔄 Запуск Redis..."
    docker-compose -f config/docker/docker-compose.n8n.yml up -d redis
    sleep 5
fi

# Создаем базу данных для n8n, если её нет
echo "🗄️  Настройка базы данных для n8n..."
docker exec test_platform_postgres psql -U test_user -d test_platform_db -c "CREATE DATABASE n8n;" 2>/dev/null || echo "База данных n8n уже существует"

# Создаем пользователя для n8n
docker exec test_platform_postgres psql -U test_user -d test_platform_db -c "CREATE USER n8n_user WITH PASSWORD 'n8n_password';" 2>/dev/null || echo "Пользователь n8n_user уже существует"
docker exec test_platform_postgres psql -U test_user -d test_platform_db -c "GRANT ALL PRIVILEGES ON DATABASE n8n TO n8n_user;" 2>/dev/null || echo "Права уже предоставлены"

# Запускаем n8n
echo "🚀 Запуск n8n..."
docker-compose -f config/docker/docker-compose.n8n.yml up -d n8n

# Ждем запуска n8n
echo "⏳ Ожидание запуска n8n..."
sleep 30

# Проверяем статус
if docker ps | grep -q "agb_n8n"; then
    echo "✅ n8n успешно запущен!"
    echo ""
    echo "🌐 Доступные URL:"
    echo "   n8n: http://localhost:5678"
    echo "   Логин: admin / admin123"
    echo ""
    echo "📋 API endpoints:"
    echo "   Webhook: http://localhost:5678/webhook/agb-platform"
    echo "   Health: http://localhost:5678/healthz"
    echo ""
    echo "🔧 Управление:"
    echo "   Остановка: docker-compose -f config/docker/docker-compose.n8n.yml down"
    echo "   Логи: docker logs agb_n8n"
    echo "   Перезапуск: docker-compose -f config/docker/docker-compose.n8n.yml restart n8n"
else
    echo "❌ Ошибка запуска n8n. Проверьте логи:"
    echo "   docker logs agb_n8n"
    exit 1
fi
