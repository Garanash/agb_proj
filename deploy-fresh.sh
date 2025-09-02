#!/bin/bash

# Скрипт для развертывания проекта на новой машине
# Автоматически создает базу данных и инициализирует все данные

set -e

echo "🚀 Test Platform - Развертывание на новой машине"
echo "=============================================="

# Проверяем наличие Docker и Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите Docker и попробуйте снова."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    exit 1
fi

# Проверяем наличие .env файла
if [ ! -f ".env" ]; then
    echo "⚠️  Файл .env не найден. Создаем базовый .env файл..."
    cat > .env << EOF
# База данных
POSTGRES_DB=test_platform_db
POSTGRES_USER=test_user
POSTGRES_PASSWORD=test_password

# FastAPI
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Администратор
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@almazgeobur.ru
ADMIN_FIRST_NAME=Администратор
ADMIN_LAST_NAME=Системы

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development

# Nginx
NGINX_PORT=80
NGINX_SSL_PORT=443
EOF
    echo "✅ Создан базовый .env файл. Отредактируйте его при необходимости."
fi

# Останавливаем и удаляем существующие контейнеры
echo "🔄 Остановка существующих контейнеров..."
docker-compose down -v 2>/dev/null || true

# Удаляем старые образы (опционально)
echo "🗑️  Удаление старых образов..."
docker-compose down --rmi all 2>/dev/null || true

# Собираем и запускаем контейнеры
echo "🔨 Сборка и запуск контейнеров..."
docker-compose up --build -d

# Ждем готовности сервисов
echo "⏳ Ожидание готовности сервисов..."
sleep 30

# Проверяем статус контейнеров
echo "📊 Статус контейнеров:"
docker-compose ps

# Проверяем healthcheck
echo "🏥 Проверка здоровья сервисов..."
for i in {1..10}; do
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        echo "✅ Backend готов к работе"
        break
    else
        echo "⏳ Ожидание готовности backend... ($i/10)"
        sleep 10
    fi
done

# Проверяем frontend
for i in {1..10}; do
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend готов к работе"
        break
    else
        echo "⏳ Ожидание готовности frontend... ($i/10)"
        sleep 10
    fi
done

echo ""
echo "🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
echo "=========================="
echo ""
echo "📋 Доступ к системе:"
echo "   🌐 Frontend: http://localhost:3000"
echo "   🔧 Backend API: http://localhost:8000"
echo "   📊 API Docs: http://localhost:8000/docs"
echo "   🗄️  База данных: localhost:15432"
echo ""
echo "👤 Учетные данные по умолчанию:"
echo "   Admin: admin / admin123"
echo "   Test:  testuser / test123"
echo "   Заказчик: customer1 / customer123"
echo "   Исполнитель: contractor1 / contractor123"
echo "   Сервисный инженер: service_engineer / engineer123"
echo ""
echo "🔧 Полезные команды:"
echo "   docker-compose logs -f          # Просмотр логов"
echo "   docker-compose restart          # Перезапуск сервисов"
echo "   docker-compose down             # Остановка сервисов"
echo "   docker-compose exec backend bash # Подключение к backend контейнеру"
echo ""
echo "📝 Для production развертывания используйте:"
echo "   docker-compose -f docker-compose.prod.yml up --build -d"
