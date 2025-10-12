#!/bin/bash

# Скрипт для запуска backend на сервере
# Использование: ./start-backend.sh

set -e

echo "🚀 Запуск Backend сервера"
echo "========================="

# Проверяем наличие .env файла
if [ ! -f ".env.production" ]; then
    echo "❌ Файл .env.production не найден!"
    echo "   Запустите: ./create-env.sh"
    exit 1
fi

# Загружаем переменные окружения
export $(cat .env.production | grep -v '^#' | xargs)

# Переходим в директорию backend
cd backend

# Проверяем, что мы в правильной директории
if [ ! -f "main.py" ]; then
    echo "❌ Не удалось найти main.py в директории backend!"
    echo "   Текущая директория: $(pwd)"
    exit 1
fi

# Проверяем Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не установлен!"
    exit 1
fi

# Проверяем виртуальное окружение
if [ ! -d "venv" ]; then
    echo "📦 Создание виртуального окружения..."
    python3 -m venv venv
fi

# Проверяем, что виртуальное окружение создалось правильно
if [ ! -f "./venv/bin/pip" ]; then
    echo "❌ Виртуальное окружение не создалось правильно!"
    echo "   Удаляем и создаем заново..."
    rm -rf venv
    python3 -m venv venv
    
    # Проверяем еще раз
    if [ ! -f "./venv/bin/pip" ]; then
        echo "❌ Не удалось создать виртуальное окружение!"
        echo "   Попробуем использовать системный pip..."
        pip3 install -r requirements.txt
        python3 main.py 2>&1 | tee ../logs/backend.log
        exit 0
    fi
fi

# Активируем виртуальное окружение
echo "🔧 Активация виртуального окружения..."
source venv/bin/activate

# Устанавливаем зависимости
echo "📥 Установка зависимостей..."
./venv/bin/pip install -r requirements.txt

# Создаем директории для логов
mkdir -p ../logs

# Запускаем сервер
echo "🌐 Запуск Backend сервера на $BACKEND_HOST:$BACKEND_PORT..."
echo "   Логи: ../logs/backend.log"
echo "   Для остановки: Ctrl+C"
echo ""

# Запускаем с логированием
python3 main.py 2>&1 | tee ../logs/backend.log
