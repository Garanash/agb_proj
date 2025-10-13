#!/bin/bash

# Быстрая установка недостающих зависимостей в существующее виртуальное окружение
# Использование: ./install-requests.sh

set -e

echo "📦 Быстрая установка недостающих зависимостей"
echo "============================================"

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
echo "📋 Шаг 3: Установка недостающих зависимостей"
echo "----------------------------------------"

# Активируем виртуальное окружение
echo "📦 Активация виртуального окружения..."
source venv/bin/activate

# Обновляем pip
echo "📦 Обновление pip..."
venv/bin/pip install --upgrade pip

# Устанавливаем недостающие зависимости
echo "📦 Установка requests..."
venv/bin/pip install requests==2.31.0

echo "📦 Установка psutil..."
venv/bin/pip install psutil==5.9.6

echo "📦 Установка python-whois..."
venv/bin/pip install python-whois==0.8.0

echo ""
echo "📋 Шаг 4: Проверка установки"
echo "-------------------------"

# Проверяем установку
echo "🔍 Проверка установки requests..."
venv/bin/python -c "import requests; print('requests:', requests.__version__)"

echo "🔍 Проверка установки psutil..."
venv/bin/python -c "import psutil; print('psutil:', psutil.__version__)"

echo "🔍 Проверка установки python-whois..."
venv/bin/python -c "import whois; print('python-whois: OK')"

echo ""
echo "✅ Недостающие зависимости успешно установлены!"
echo ""
echo "📋 Теперь можно запустить backend:"
echo "./scripts/production/start-backend-if-needed.sh"
