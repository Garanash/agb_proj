#!/bin/bash

# Скрипт для исправления URL в frontend файлах

echo "Исправляем URL в frontend файлах..."

# Найдем все файлы с проблемными URL
files=$(find . -name "*.tsx" -o -name "*.ts" | xargs grep -l "'\\${process.env.NEXT_PUBLIC_API_URL" 2>/dev/null)

for file in $files; do
    echo "Исправляем $file..."
    
    # Создаем временный файл с исправлениями
    sed "s|'\${process\.env\.NEXT_PUBLIC_API_URL || '\([^']*\)'}|process.env.NEXT_PUBLIC_API_URL || '\1'|g" "$file" > "$file.tmp"
    mv "$file.tmp" "$file"
done

echo "Готово!"
