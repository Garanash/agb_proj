#!/bin/bash

# Диагностика проблем с backend
# Использование: ./diagnose-backend.sh

set -e

echo "🔍 Диагностика проблем с backend"
echo "================================"

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "📋 Проверка системы:"
echo "-------------------"

# Проверяем Python
if command -v python3 &> /dev/null; then
    echo "✅ Python3: $(python3 --version)"
else
    echo "❌ Python3 не установлен"
    echo "   Установите: apt update && apt install python3 python3-pip"
fi

# Проверяем pip
if command -v pip3 &> /dev/null; then
    echo "✅ pip3: $(pip3 --version)"
else
    echo "❌ pip3 не установлен"
    echo "   Установите: apt install python3-pip"
fi

# Проверяем uvicorn
if pip3 list | grep -q uvicorn; then
    echo "✅ uvicorn установлен"
else
    echo "❌ uvicorn не установлен"
    echo "   Установите: pip3 install uvicorn"
fi

echo ""
echo "📋 Проверка файлов:"
echo "------------------"

# Проверяем структуру проекта
if [ -d "backend" ]; then
    echo "✅ Директория backend найдена"
    if [ -f "backend/main.py" ]; then
        echo "✅ main.py найден"
    else
        echo "❌ main.py не найден в backend/"
    fi
    if [ -f "backend/requirements.txt" ]; then
        echo "✅ requirements.txt найден"
    else
        echo "❌ requirements.txt не найден в backend/"
    fi
else
    echo "❌ Директория backend не найдена"
fi

echo ""
echo "📋 Проверка портов:"
echo "------------------"

# Проверяем порт 8000
if lsof -i :8000 > /dev/null 2>&1; then
    echo "⚠️ Порт 8000 занят:"
    lsof -i :8000
else
    echo "✅ Порт 8000 свободен"
fi

echo ""
echo "📋 Проверка переменных окружения:"
echo "--------------------------------"

if [ -f ".env.production" ]; then
    echo "✅ .env.production найден"
    echo "📋 Содержимое (первые 10 строк):"
    head -10 .env.production
else
    echo "❌ .env.production не найден"
    echo "   Создайте: ./create-env.sh"
fi

echo ""
echo "📋 Проверка логов:"
echo "----------------"

if [ -f "backend.log" ]; then
    echo "✅ backend.log найден"
    echo "📋 Последние 10 строк логов:"
    tail -10 backend.log
else
    echo "❌ backend.log не найден"
fi

echo ""
echo "📋 Рекомендации:"
echo "---------------"

# Проверяем, что нужно исправить
if ! command -v python3 &> /dev/null; then
    echo "🔧 Установите Python3: apt update && apt install python3 python3-pip"
fi

if ! command -v pip3 &> /dev/null; then
    echo "🔧 Установите pip3: apt install python3-pip"
fi

if [ ! -f ".env.production" ]; then
    echo "🔧 Создайте .env.production: ./create-env.sh"
fi

if [ ! -d "backend" ]; then
    echo "🔧 Проверьте структуру проекта"
fi

if lsof -i :8000 > /dev/null 2>&1; then
    echo "🔧 Остановите процессы на порту 8000: lsof -ti :8000 | xargs kill -9"
fi

echo ""
echo "✅ Диагностика завершена!"
echo ""
echo "🚀 Для запуска backend используйте:"
echo "   ./scripts/production/simple-start-backend.sh"
