#!/bin/bash

# Максимально простой запуск backend с виртуальным окружением
# Использование: ./ultra-simple-backend.sh

set -e

echo "🚀 Ультра-простой запуск Backend"
echo "==============================="

# Переходим в директорию backend
cd backend

echo "✅ Найден main.py в $(pwd)"

# Проверяем наличие requirements.txt
if [ ! -f "requirements.txt" ]; then
    echo "❌ Не удалось найти requirements.txt!"
    exit 1
fi

echo "🐍 Создание виртуального окружения..."
# Проверяем и пересоздаем виртуальное окружение если нужно
if [ ! -d "venv" ] || [ ! -f "venv/bin/pip" ]; then
    echo "🔄 Пересоздание виртуального окружения..."
    rm -rf venv
    python3 -m venv venv
    echo "✅ Виртуальное окружение пересоздано"
else
    echo "✅ Виртуальное окружение уже существует и корректно"
fi

echo "📦 Установка зависимостей..."
# Используем pip из виртуального окружения напрямую
venv/bin/pip install --upgrade pip
venv/bin/pip install setuptools wheel
venv/bin/pip install -r requirements.txt

echo "🔧 Проверка установленных пакетов..."
venv/bin/pip list | grep -E "(fastapi|uvicorn|sqlalchemy)" || echo "⚠️ Некоторые пакеты могут быть не установлены"

echo "🔧 Установка переменных окружения..."
export DATABASE_URL="postgresql://agb_user:agb_password@localhost:5432/agb_db"
export JWT_SECRET_KEY="your_jwt_secret_key_change_this_in_production"
export DEBUG="False"
export ENVIRONMENT="production"

echo "🚀 Запуск backend сервера..."
echo "   Порт: 8000"
echo "   Логи: backend.log"
echo "   Python: venv/bin/python"
echo "   Uvicorn: venv/bin/uvicorn"

# Запускаем backend с виртуальным окружением
nohup venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &

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
echo ""
echo "📋 Проверьте доступность:"
echo "curl http://localhost:8000/api/v1/health"
