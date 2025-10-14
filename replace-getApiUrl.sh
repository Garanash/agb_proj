#!/bin/bash

echo "🔧 AGB Project - Массовая замена getApiUrl на getSimpleApiUrl"
echo "=========================================================="

echo "Найдено файлов с getApiUrl:"
find frontend -name "*.tsx" -o -name "*.ts" | xargs grep -l "getApiUrl" | wc -l

echo ""
echo "Замена getApiUrl на getSimpleApiUrl во всех файлах..."

# Заменяем импорты
find frontend -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/import { getApiUrl }/import { getSimpleApiUrl }/g'
find frontend -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/import { getApiUrl, /import { getSimpleApiUrl, /g'
find frontend -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/, getApiUrl }/, getSimpleApiUrl }/g'

# Заменяем использование функции
find frontend -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/getApiUrl()/getSimpleApiUrl()/g'

echo ""
echo "Проверка результата:"
echo "Осталось файлов с getApiUrl:"
find frontend -name "*.tsx" -o -name "*.ts" | xargs grep -l "getApiUrl" | wc -l

echo ""
echo "Файлы, которые все еще содержат getApiUrl:"
find frontend -name "*.tsx" -o -name "*.ts" | xargs grep -l "getApiUrl" | head -10

echo ""
echo "✅ Замена завершена!"
