#!/bin/bash

# Исправление проблем с pandas и запуск backend
# Использование: ./fix-pandas-and-start.sh

set -e

echo "🔧 Исправление проблем с pandas и запуск backend"
echo "=============================================="

# Получаем IPv4 IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IPv4 IP сервера: $SERVER_IP"

echo ""
echo "📋 Шаг 1: Остановка всех процессов на порту 8000"
echo "----------------------------------------------"

# Останавливаем все процессы на порту 8000
echo "🛑 Остановка процессов на порту 8000..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || echo "   Порт 8000 свободен"

echo ""
echo "📋 Шаг 2: Переход в директорию backend"
echo "------------------------------------"

cd backend

echo ""
echo "📋 Шаг 3: Пересоздание виртуального окружения"
echo "--------------------------------------------"

# Удаляем старое виртуальное окружение
if [ -d "venv" ]; then
    echo "🗑️ Удаление старого виртуального окружения..."
    rm -rf venv
fi

# Создаем новое виртуальное окружение
echo "🐍 Создание нового виртуального окружения..."
python3 -m venv venv

echo ""
echo "📋 Шаг 4: Установка зависимостей"
echo "-------------------------------"

# Активируем виртуальное окружение
echo "📦 Активация виртуального окружения..."
source venv/bin/activate

# Обновляем pip
echo "📦 Обновление pip..."
venv/bin/pip install --upgrade pip

# Устанавливаем setuptools и wheel
echo "📦 Установка setuptools и wheel..."
venv/bin/pip install setuptools wheel

# Устанавливаем зависимости по частям для лучшей диагностики
echo "📦 Установка основных зависимостей..."
venv/bin/pip install fastapi==0.104.1 uvicorn[standard]==0.24.0

echo "📦 Установка зависимостей для БД..."
venv/bin/pip install sqlalchemy==2.0.23 asyncpg==0.29.0 psycopg2-binary==2.9.9 alembic==1.12.1

echo "📦 Установка зависимостей для аутентификации..."
venv/bin/pip install pydantic[email]==2.5.0 python-multipart==0.0.6 python-jose[cryptography]==3.3.0 passlib[bcrypt]==1.7.4 bcrypt==4.0.1

echo "📦 Установка дополнительных зависимостей..."
venv/bin/pip install python-dotenv==1.0.0 fastapi-users==12.1.2 aiohttp==3.9.5 httpx==0.25.2

echo "📦 Установка pandas и numpy..."
venv/bin/pip install pandas==2.0.3 numpy==1.24.3

echo ""
echo "📋 Шаг 5: Проверка установки"
echo "----------------------------"

# Проверяем установку
echo "🔍 Проверка установленных пакетов..."
venv/bin/python -c "import fastapi; print('fastapi:', fastapi.__version__)"
venv/bin/python -c "import uvicorn; print('uvicorn:', uvicorn.__version__)"
venv/bin/python -c "import pandas; print('pandas:', pandas.__version__)"
venv/bin/python -c "import numpy; print('numpy:', numpy.__version__)"

echo ""
echo "📋 Шаг 6: Запуск backend"
echo "-----------------------"

# Загружаем переменные окружения
echo "🔧 Загрузка переменных окружения..."
if [ -f "../.env.production" ]; then
    set -a
    source ../.env.production
    set +a
    echo "✅ Переменные окружения загружены"
else
    echo "⚠️ Файл .env.production не найден, используем значения по умолчанию"
fi

# Запускаем backend
echo "🚀 Запуск backend сервера..."
echo "   Порт: 8000"
echo "   Логи: ../backend.log"
echo "   Python: venv/bin/python"
echo "   Uvicorn: venv/bin/uvicorn"

# Запускаем в фоне
nohup bash -c "source venv/bin/activate && venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000" > ../backend.log 2>&1 &

BACKEND_PID=$!
echo "📋 Backend запущен с PID: $BACKEND_PID"

echo ""
echo "📋 Шаг 7: Проверка запуска"
echo "-------------------------"

# Ждем запуска backend
echo "⏳ Ожидание запуска backend..."
sleep 15

# Проверяем доступность backend
echo "🔍 Проверка доступности backend..."
if curl -s --connect-timeout 10 "http://$SERVER_IP:8000/api/v1/health" > /dev/null; then
    echo "✅ Backend доступен на http://$SERVER_IP:8000"
    echo "✅ Swagger доступен на http://$SERVER_IP:8000/docs"
else
    echo "❌ Backend недоступен, проверяем логи..."
    if [ -f "../backend.log" ]; then
        echo "📋 Последние 10 строк логов backend:"
        tail -10 ../backend.log
    fi
    echo "❌ Не удалось запустить backend"
    exit 1
fi

echo ""
echo "🎉 Backend успешно запущен!"
echo ""
echo "📋 Проверьте в браузере:"
echo "1. Backend API: http://$SERVER_IP:8000/api/v1/health"
echo "2. Swagger UI: http://$SERVER_IP:8000/docs"
echo "3. Логи backend: tail -f ../backend.log"
echo ""
echo "📋 Следующий шаг:"
echo "Запустите frontend: ./scripts/production/comprehensive-fix.sh"
