#!/bin/bash

# Скрипт для полной очистки и пересоздания виртуального окружения
# Использование: ./clean-recreate-venv.sh

set -e

echo "🧹 Полная очистка и пересоздание виртуального окружения"
echo "====================================================="

# Переходим в директорию backend
cd backend

echo "✅ Найден main.py в $(pwd)"

# Проверяем наличие requirements.txt
if [ ! -f "requirements.txt" ]; then
    echo "❌ Не удалось найти requirements.txt!"
    exit 1
fi

echo "🗑️ Удаление старого виртуального окружения..."
if [ -d "venv" ]; then
    rm -rf venv
    echo "✅ Старое виртуальное окружение удалено"
else
    echo "ℹ️ Виртуальное окружение не найдено"
fi

echo "🐍 Создание нового виртуального окружения..."
python3 -m venv venv
echo "✅ Новое виртуальное окружение создано"

echo "📦 Проверка pip в виртуальном окружении..."
if [ -f "venv/bin/pip" ]; then
    echo "✅ pip найден в виртуальном окружении"
    echo "📋 Версия pip: $(venv/bin/pip --version)"
else
    echo "❌ pip не найден в виртуальном окружении!"
    echo "🔄 Попытка исправления..."
    
    # Пытаемся исправить виртуальное окружение
    python3 -m venv --upgrade venv
    
    if [ -f "venv/bin/pip" ]; then
        echo "✅ pip исправлен"
    else
        echo "❌ Не удалось исправить pip"
        exit 1
    fi
fi

echo "📦 Установка зависимостей..."
venv/bin/pip install --upgrade pip
venv/bin/pip install setuptools wheel
venv/bin/pip install -r requirements.txt

echo "🔧 Проверка установленных пакетов..."
echo "📋 Установленные пакеты:"
venv/bin/pip list

echo ""
echo "🎉 Виртуальное окружение успешно пересоздано!"
echo ""
echo "📋 Проверьте установленные пакеты:"
echo "venv/bin/pip list"
echo ""
echo "🚀 Теперь можете запустить backend:"
echo "./scripts/production/ultra-simple-backend.sh"
