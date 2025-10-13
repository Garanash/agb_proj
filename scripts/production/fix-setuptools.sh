#!/bin/bash

# Быстрое исправление проблемы с setuptools
# Использование: ./fix-setuptools.sh

set -e

echo "🔧 Быстрое исправление setuptools"
echo "================================="

# Переходим в директорию backend
cd backend

echo "✅ Найден main.py в $(pwd)"

# Проверяем наличие виртуального окружения
if [ ! -d "venv" ]; then
    echo "❌ Виртуальное окружение не найдено!"
    echo "   Создайте: ./scripts/production/clean-recreate-venv.sh"
    exit 1
fi

echo "📦 Установка setuptools и wheel..."
venv/bin/pip install --upgrade pip
venv/bin/pip install setuptools wheel

echo "🔧 Проверка установки..."
if venv/bin/python -c "import setuptools; print('setuptools:', setuptools.__version__)" 2>/dev/null; then
    echo "✅ setuptools установлен"
else
    echo "❌ setuptools не установлен"
    exit 1
fi

if venv/bin/python -c "import wheel; print('wheel:', wheel.__version__)" 2>/dev/null; then
    echo "✅ wheel установлен"
else
    echo "❌ wheel не установлен"
    exit 1
fi

echo "📦 Попытка установки зависимостей..."
venv/bin/pip install -r requirements.txt

echo ""
echo "🎉 Исправление завершено!"
echo ""
echo "📋 Проверьте установленные пакеты:"
echo "venv/bin/pip list"
echo ""
echo "🚀 Теперь можете запустить backend:"
echo "./scripts/production/ultra-simple-backend.sh"
