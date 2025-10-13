#!/bin/bash

# Простой скрипт для запуска backend
# Использование: ./simple-start-backend.sh

set -e

echo "🚀 Простой запуск Backend сервера"
echo "================================="

# Проверяем наличие Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не найден!"
    echo "   Установите Python3: apt update && apt install python3 python3-pip"
    exit 1
fi

# Проверяем наличие pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 не найден!"
    echo "   Установите pip3: apt install python3-pip"
    exit 1
fi

# Переходим в директорию backend
cd backend

# Проверяем, что мы в правильной директории
if [ ! -f "main.py" ]; then
    echo "❌ Не удалось найти main.py в директории backend!"
    echo "   Текущая директория: $(pwd)"
    exit 1
fi

echo "✅ Найден main.py в $(pwd)"

# Проверяем наличие requirements.txt
if [ ! -f "requirements.txt" ]; then
    echo "❌ Не удалось найти requirements.txt!"
    exit 1
fi

echo "📦 Установка зависимостей..."
pip3 install -r requirements.txt

echo "🔧 Проверка переменных окружения..."
# Устанавливаем базовые переменные окружения
export DATABASE_URL="postgresql://agb_user:agb_password@localhost:5432/agb_db"
export JWT_SECRET_KEY="your_jwt_secret_key_change_this_in_production"
export DEBUG="False"
export ENVIRONMENT="production"

echo "🚀 Запуск backend сервера..."
echo "   Порт: 8000"
echo "   Логи: backend.log"

# Запускаем backend
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &

BACKEND_PID=$!
echo "📋 Backend запущен с PID: $BACKEND_PID"

# Ждем запуска
echo "⏳ Ожидание запуска backend..."
sleep 5

# Проверяем, что процесс запущен
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend успешно запущен!"
    echo "📋 PID: $BACKEND_PID"
    echo "📋 Логи: tail -f backend.log"
    echo "🌐 API: http://localhost:8000/api"
    echo "📚 Swagger: http://localhost:8000/docs"
else
    echo "❌ Backend не запустился!"
    echo "📋 Проверьте логи: tail -f backend.log"
    exit 1
fi

echo ""
echo "🎉 Backend запущен и готов к работе!"
