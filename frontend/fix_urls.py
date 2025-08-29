#!/usr/bin/env python3
import os
import re

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Исправляем проблемные URL
    original = content
    
    # Заменяем неправильные URL на правильные
    content = re.sub(
        r"'${process\.env\.NEXT_PUBLIC_API_URL \|\| '([^']*)'}([^']*)/api/([^']*)'",
        r'process.env.NEXT_PUBLIC_API_URL || "\1"',
        content
    )
    
    # Если файл изменился, сохраняем
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Обрабатываем все файлы
fixed_count = 0
for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            filepath = os.path.join(root, file)
            try:
                if fix_file(filepath):
                    print(f'Исправлен: {filepath}')
                    fixed_count += 1
            except Exception as e:
                print(f'Ошибка в {filepath}: {e}')

print(f'Всего исправлено файлов: {fixed_count}')
