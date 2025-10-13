#!/bin/bash

# Быстрая установка requests в существующее виртуальное окружение
# Использование: ./install-requests.sh

set -e

echo "📦 Быстрая установка requests"
echo "============================"

echo ""
echo "📋 Шаг 1: Переход в директорию backend"
echo "------------------------------------"

cd backend

echo ""
echo "📋 Шаг 2: Проверка виртуального окружения"
echo "--------------------------------------"

# Проверяем виртуальное окружение
if [ ! -d "venv" ]; then
    echo "❌ Виртуальное окружение не найдено"
    echo "🔧 Создание виртуального окружения..."
    python3 -m venv venv
    echo "✅ Виртуальное окружение создано"
else
    echo "✅ Виртуальное окружение найдено"
fi

echo ""
echo "📋 Шаг 3: Установка requests"
echo "-------------------------"

# Активируем виртуальное окружение
echo "📦 Активация виртуального окружения..."
source venv/bin/activate

# Обновляем pip
echo "📦 Обновление pip..."
venv/bin/pip install --upgrade pip

# Устанавливаем requests
echo "📦 Установка requests..."
venv/bin/pip install requests==2.31.0

echo ""
echo "📋 Шаг 4: Проверка установки"
echo "-------------------------"

# Проверяем установку
echo "🔍 Проверка установки requests..."
venv/bin/python -c "import requests; print('requests:', requests.__version__)"

echo ""
echo "✅ Requests успешно установлен!"
echo ""
echo "📋 Теперь можно запустить backend:"
echo "./scripts/production/start-backend-if-needed.sh"
