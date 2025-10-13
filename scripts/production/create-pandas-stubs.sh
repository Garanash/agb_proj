#!/bin/bash

# Создание заглушек для pandas в backend
# Использование: ./create-pandas-stubs.sh

set -e

echo "🔧 Создание заглушек для pandas в backend"
echo "========================================"

cd backend

echo "📋 Создание файла pandas_stub.py..."

# Создаем заглушку для pandas
cat > pandas_stub.py << 'EOF'
"""
Заглушка для pandas - минимальная реализация для работы без pandas
"""
import json
import csv
import io
from typing import Any, Dict, List, Optional, Union

class DataFrame:
    """Заглушка для pandas.DataFrame"""
    
    def __init__(self, data=None, columns=None):
        self.data = data or []
        self.columns = columns or []
        if isinstance(data, list) and len(data) > 0:
            if isinstance(data[0], dict):
                self.columns = list(data[0].keys())
                self.data = [list(row.values()) for row in data]
            elif isinstance(data[0], list):
                self.data = data
        elif isinstance(data, dict):
            self.columns = list(data.keys())
            self.data = list(zip(*data.values()))
    
    def to_dict(self, orient='records'):
        """Преобразует DataFrame в словарь"""
        if orient == 'records':
            return [dict(zip(self.columns, row)) for row in self.data]
        elif orient == 'dict':
            return dict(zip(self.columns, zip(*self.data)))
        return {}
    
    def to_json(self, orient='records'):
        """Преобразует DataFrame в JSON"""
        return json.dumps(self.to_dict(orient))
    
    def to_csv(self, path_or_buf=None, index=False):
        """Преобразует DataFrame в CSV"""
        output = io.StringIO() if path_or_buf is None else path_or_buf
        
        # Записываем заголовки
        if self.columns:
            output.write(','.join(self.columns) + '\n')
        
        # Записываем данные
        for row in self.data:
            output.write(','.join(str(cell) for cell in row) + '\n')
        
        if path_or_buf is None:
            return output.getvalue()
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, key):
        if isinstance(key, str):
            # Возвращаем колонку
            if key in self.columns:
                col_index = self.columns.index(key)
                return [row[col_index] for row in self.data]
        return None
    
    def __setitem__(self, key, value):
        if isinstance(key, str):
            if key in self.columns:
                col_index = self.columns.index(key)
                for i, val in enumerate(value):
                    if i < len(self.data):
                        self.data[i][col_index] = val
            else:
                # Добавляем новую колонку
                self.columns.append(key)
                for i, val in enumerate(value):
                    if i < len(self.data):
                        self.data[i].append(val)
                    else:
                        self.data.append([None] * (len(self.columns) - 1) + [val])
    
    def dropna(self):
        """Удаляет строки с пустыми значениями"""
        filtered_data = []
        for row in self.data:
            if all(cell is not None and cell != '' for cell in row):
                filtered_data.append(row)
        return DataFrame(filtered_data, self.columns)
    
    def fillna(self, value):
        """Заполняет пустые значения"""
        filled_data = []
        for row in self.data:
            filled_row = [cell if cell is not None and cell != '' else value for cell in row]
            filled_data.append(filled_row)
        return DataFrame(filled_data, self.columns)

def read_csv(file_path_or_buffer, **kwargs):
    """Читает CSV файл и возвращает DataFrame"""
    if hasattr(file_path_or_buffer, 'read'):
        # Это файловый объект
        content = file_path_or_buffer.read()
        if isinstance(content, bytes):
            content = content.decode('utf-8')
    else:
        # Это путь к файлу
        with open(file_path_or_buffer, 'r', encoding='utf-8') as f:
            content = f.read()
    
    # Парсим CSV
    reader = csv.reader(io.StringIO(content))
    rows = list(reader)
    
    if not rows:
        return DataFrame()
    
    columns = rows[0]
    data = rows[1:]
    
    return DataFrame(data, columns)

def read_excel(file_path_or_buffer, **kwargs):
    """Заглушка для read_excel - возвращает пустой DataFrame"""
    print("⚠️ read_excel не поддерживается в заглушке pandas")
    return DataFrame()

def concat(dataframes, **kwargs):
    """Объединяет несколько DataFrame"""
    if not dataframes:
        return DataFrame()
    
    result_data = []
    result_columns = dataframes[0].columns
    
    for df in dataframes:
        result_data.extend(df.data)
    
    return DataFrame(result_data, result_columns)

# Создаем псевдоним
pd = type('pandas', (), {
    'DataFrame': DataFrame,
    'read_csv': read_csv,
    'read_excel': read_excel,
    'concat': concat,
})()
EOF

echo "✅ Файл pandas_stub.py создан"

echo ""
echo "📋 Замена импортов pandas на заглушки..."

# Создаем резервные копии и заменяем импорты
for file in api/v1/endpoints/*.py; do
    if grep -q "import pandas" "$file"; then
        echo "🔄 Обработка файла: $file"
        cp "$file" "$file.backup"
        sed -i 's/import pandas as pd/from pandas_stub import pd/' "$file"
        echo "✅ Импорт заменен в $file"
    fi
done

echo ""
echo "📋 Проверка замены импортов..."
if grep -r "import pandas" api/v1/endpoints/; then
    echo "❌ Остались импорты pandas"
else
    echo "✅ Все импорты pandas заменены"
fi

echo ""
echo "🎉 Заглушки для pandas созданы!"
echo ""
echo "📋 Что сделано:"
echo "1. Создан файл pandas_stub.py с минимальной реализацией pandas"
echo "2. Заменены все импорты 'import pandas as pd' на 'from pandas_stub import pd'"
echo "3. Созданы резервные копии всех измененных файлов"
echo ""
echo "📋 Теперь можно запустить backend без pandas:"
echo "./scripts/production/minimal-backend.sh"
