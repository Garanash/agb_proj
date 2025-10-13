#!/bin/bash

# Универсальный скрипт синхронизации ВСЕХ компонентов
# Использование: ./scripts/production/sync-all-components.sh

set -e

echo "🔄 Универсальная синхронизация всех компонентов"
echo "=============================================="

# Переходим в директорию frontend
cd frontend

echo "📁 Синхронизация ВСЕХ UI компонентов..."
# Синхронизируем ВСЕ UI компоненты из src/components/ui/ в components/ui/
for file in src/components/ui/*.tsx; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "   Копируем $filename..."
        cp "$file" "components/ui/$filename" 2>/dev/null || true
    fi
done

echo "📁 Синхронизация ВСЕХ основных компонентов..."
# Синхронизируем ВСЕ основные компоненты из src/components/ в components/
for file in src/components/*.tsx; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo "   Копируем $filename..."
        cp "$file" "components/$filename" 2>/dev/null || true
    fi
done

echo "🔍 Проверка синхронизации..."
echo "UI компоненты в components/ui/:"
ls -la components/ui/ | wc -l
echo "Основные компоненты в components/:"
ls -la components/ | grep -E "\.tsx$" | wc -l

echo "✅ Универсальная синхронизация завершена!"
