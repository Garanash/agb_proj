#!/usr/bin/env python3
"""
Скрипт для добавления ConfigDict во все схемы Pydantic
"""

import re
import os

def fix_schemas():
    schemas_file = "/Users/andreydolgov/Desktop/programming/agb_proj/backend/api/v1/schemas.py"
    
    with open(schemas_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Найти все классы BaseModel
    pattern = r'class\s+(\w+)\(BaseModel\):'
    matches = re.finditer(pattern, content)
    
    # Собрать все имена классов
    classes = []
    for match in matches:
        class_name = match.group(1)
        classes.append(class_name)
    
    print(f"Найдено {len(classes)} классов BaseModel")
    
    # Проверить, какие уже имеют ConfigDict
    already_have_config = []
    for class_name in classes:
        # Найти определение класса
        class_pattern = rf'class\s+{class_name}\(BaseModel\):'
        class_match = re.search(class_pattern, content)
        if class_match:
            start_pos = class_match.end()
            # Найти следующую строку после class definition
            next_line_start = content.find('\n', start_pos) + 1
            # Проверить следующие 5 строк на наличие model_config
            lines_to_check = content[next_line_start:next_line_start + 500]
            if 'model_config = ConfigDict' in lines_to_check:
                already_have_config.append(class_name)
    
    print(f"Уже имеют ConfigDict: {len(already_have_config)} классов")
    print("Классы без ConfigDict:")
    
    # Добавить ConfigDict в классы, которые его не имеют
    for class_name in classes:
        if class_name not in already_have_config:
            print(f"  - {class_name}")
            
            # Найти определение класса и добавить ConfigDict
            class_pattern = rf'(class\s+{class_name}\(BaseModel\):\s*\n)(\s*""".*?"""\s*\n)?'
            replacement = r'\1    model_config = ConfigDict(from_attributes=True)\n\n\2'
            
            new_content = re.sub(class_pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
            if new_content != content:
                content = new_content
                print(f"    ✅ Добавлен ConfigDict в {class_name}")
            else:
                print(f"    ❌ Не удалось добавить ConfigDict в {class_name}")
    
    # Сохранить изменения
    with open(schemas_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Обработка завершена. Файл сохранен: {schemas_file}")

if __name__ == "__main__":
    fix_schemas()
