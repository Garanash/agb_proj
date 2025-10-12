#!/bin/bash

# Скрипт для запуска frontend на сервере
# Использование: ./start-frontend.sh

set -e

echo "🚀 Запуск Frontend сервера"
echo "=========================="

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

# Переходим в директорию frontend
cd frontend

# Проверяем Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен!"
    exit 1
fi

# Проверяем зависимости
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

# Создаем директории для логов
mkdir -p ../logs

# Собираем приложение для продакшна
echo "🔨 Сборка приложения для продакшна..."
npm run build

# Запускаем сервер
echo "🌐 Запуск Frontend сервера на $FRONTEND_HOST:$FRONTEND_PORT..."
echo "   Логи: ../logs/frontend.log"
echo "   Для остановки: Ctrl+C"
echo ""

# Запускаем с логированием
npm start 2>&1 | tee ../logs/frontend.log
