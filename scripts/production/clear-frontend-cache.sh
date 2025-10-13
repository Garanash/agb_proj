#!/bin/bash

# Скрипт для очистки кэша Next.js и перезапуска frontend
# Использование: ./scripts/production/clear-frontend-cache.sh

set -e

echo "🧹 Очистка кэша Next.js"
echo "======================="

# Переходим в директорию frontend
cd frontend

echo "🗑️  Удаление кэша Next.js..."
rm -rf .next
rm -rf node_modules/.cache

echo "🗑️  Удаление кэша npm..."
npm cache clean --force

echo "📦 Переустановка зависимостей..."
rm -rf node_modules
npm install

echo "🔨 Сборка приложения..."
npm run build

echo "✅ Кэш очищен и приложение пересобрано!"
