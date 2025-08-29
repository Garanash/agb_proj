#!/usr/bin/env python3
import os
import re

def add_api_import(filepath):
    """Добавляет импорт функций API в начало файла"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Проверяем, есть ли уже импорт
    if 'from \'@/utils/api\'' in content or 'from "@/utils/api"' in content:
        return False
    
    # Ищем строку с импортом React/useState и добавляем импорт API после неё
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.strip().startswith('import') and ('react' in line.lower() or 'useState' in line or 'useEffect' in line):
            # Находим следующий import или пустую строку
            j = i + 1
            while j < len(lines) and (lines[j].strip() == '' or lines[j].strip().startswith('import')):
                if lines[j].strip().startswith('import') and not ('react' in lines[j].lower() or 'useState' in lines[j] or 'useEffect' in lines[j]):
                    break
                j += 1
            
            # Вставляем импорт API
            lines.insert(j, "import { getApiUrl } from '@/utils/api';")
            break
    
    new_content = '\n'.join(lines)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    return True

def replace_direct_urls(filepath):
    """Заменяет прямые URL на использование функции getApiUrl"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Заменяем прямые ссылки на функцию
    original = content
    content = re.sub(
        r'\$\{process\.env\.NEXT_PUBLIC_API_URL \|\| [\'"]http://localhost[\'"]\}',
        '${getApiUrl()}',
        content
    )
    
    # Если файл изменился, сохраняем
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Обрабатываем все TSX и TS файлы
files_processed = 0
for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith(('.tsx', '.ts')) and not file.startswith('.'):
            filepath = os.path.join(root, file)
            try:
                # Добавляем импорт
                if add_api_import(filepath):
                    print(f'Добавлен импорт в: {filepath}')
                    files_processed += 1
                
                # Заменяем URL
                if replace_direct_urls(filepath):
                    print(f'Заменены URL в: {filepath}')
                    files_processed += 1
                    
            except Exception as e:
                print(f'Ошибка в {filepath}: {e}')

print(f'Обработано файлов: {files_processed}')
