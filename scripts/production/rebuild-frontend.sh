#!/bin/bash

# Скрипт для полной очистки и пересборки frontend
# Использование: ./scripts/production/rebuild-frontend.sh

set -e

echo "🔄 Полная пересборка frontend"
echo "============================="

# Переходим в директорию frontend
cd frontend

echo "🔄 Синхронизация компонентов..."
# Синхронизируем все компоненты
../scripts/production/sync-components.sh

echo "🗑️  Удаление всех кэшей..."
rm -rf .next
rm -rf node_modules
rm -rf node_modules/.cache
rm -rf .npm

echo "🧹 Очистка npm кэша..."
npm cache clean --force

echo "📦 Установка зависимостей..."
npm install

echo "🔨 Сборка приложения..."
npm run build

echo "✅ Frontend успешно пересобран!"
