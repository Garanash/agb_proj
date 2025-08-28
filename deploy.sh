#!/bin/bash

echo "🚀 Начинаем деплой проекта Felix..."

# Остановка существующих контейнеров
echo "📦 Останавливаем существующие контейнеры..."
docker-compose down

# Удаление старых образов
echo "🗑️ Удаляем старые образы..."
docker-compose down --rmi all

# Сборка и запуск
echo "🔨 Собираем и запускаем контейнеры..."
docker-compose up --build -d

# Ждем запуска базы данных
echo "⏳ Ждем запуска базы данных..."
sleep 10

# Создание таблиц и администратора
echo "🗄️ Создаем таблицы базы данных..."
docker-compose exec backend python create_tables.py

echo "👤 Создаем администратора..."
docker-compose exec backend python init_db.py

echo "✅ Деплой завершен!"
echo ""
echo "🌐 Доступ к приложению:"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "База данных: localhost:5432"
echo ""
echo "🔑 Данные для входа:"
echo "Логин: admin"
echo "Пароль: neurofork1"
echo ""
echo "📋 Полезные команды:"
echo "Просмотр логов: docker-compose logs -f"
echo "Остановка: docker-compose down"
echo "Перезапуск: docker-compose restart"
