#!/bin/bash

echo "🔧 Настройка переменных окружения для сервера..."
echo "=================================================="

# Перейти в директорию проекта
cd ~/agb_proj

echo "📋 Шаг 1: Проверяем наличие production.env..."
if [ ! -f "production.env" ]; then
    echo "❌ Ошибка: production.env не найден!"
    echo "Создайте production.env на основе production.env.example"
    exit 1
fi

echo "✅ production.env найден"

echo "📋 Шаг 2: Копируем production.env в .env..."
cp production.env .env

echo "✅ Файл .env создан"

echo "📋 Шаг 3: Проверяем содержимое .env..."
echo "Содержимое .env файла:"
echo "----------------------------------------"
cat .env
echo "----------------------------------------"

echo "📋 Шаг 4: Проверяем переменные окружения..."
echo "Ключевые переменные:"
echo "- POSTGRES_DB: $(grep POSTGRES_DB .env | cut -d'=' -f2)"
echo "- POSTGRES_USER: $(grep POSTGRES_USER .env | cut -d'=' -f2)"
echo "- DATABASE_URL: $(grep DATABASE_URL .env | head -1 | cut -d'=' -f2)"
echo "- SECRET_KEY: $(grep SECRET_KEY .env | cut -d'=' -f2 | head -c 20)..."
echo "- ADMIN_USERNAME: $(grep ADMIN_USERNAME .env | cut -d'=' -f2)"

echo ""
echo "✅ Настройка переменных окружения завершена!"
echo "=================================================="
echo "Теперь можно запускать: docker-compose up --build -d"
