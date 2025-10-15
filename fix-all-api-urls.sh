#!/bin/bash

echo "🔧 Исправление всех API URL в frontend..."

# Переходим в директорию frontend
cd frontend

# Заменяем все импорты getApiUrl на getSimpleApiUrl
echo "📝 Замена импортов getApiUrl на getSimpleApiUrl..."
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/import { getApiUrl }/import { getSimpleApiUrl }/g'
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/import { getApiUrl, /import { getSimpleApiUrl, /g'

# Заменяем все вызовы getApiUrl() на getSimpleApiUrl()
echo "📝 Замена вызовов getApiUrl() на getSimpleApiUrl()..."
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/getApiUrl()/getSimpleApiUrl()/g'

# Заменяем все упоминания getApiUrl на getSimpleApiUrl
echo "📝 Замена всех упоминаний getApiUrl на getSimpleApiUrl..."
find . -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/getApiUrl/getSimpleApiUrl/g'

echo "✅ Замена завершена!"

# Проверяем результат
echo "🔍 Проверка результата..."
echo "Файлы с getApiUrl:"
grep -r "getApiUrl" . --include="*.tsx" --include="*.ts" | wc -l

echo "Файлы с getSimpleApiUrl:"
grep -r "getSimpleApiUrl" . --include="*.tsx" --include="*.ts" | wc -l

echo "🎉 Готово!"
