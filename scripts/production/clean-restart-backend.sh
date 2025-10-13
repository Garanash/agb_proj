#!/bin/bash

# Полная очистка и перезапуск backend без pandas
# Использование: ./clean-restart-backend.sh

set -e

echo "🧹 Полная очистка и перезапуск backend"
echo "====================================="

# Получаем IPv4 IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IPv4 IP сервера: $SERVER_IP"

echo ""
echo "📋 Шаг 1: Остановка всех процессов"
echo "--------------------------------"

# Останавливаем все процессы на порту 8000
echo "🛑 Остановка процессов на порту 8000..."
lsof -ti :8000 | xargs kill -9 2>/dev/null || echo "   Порт 8000 свободен"

# Останавливаем все процессы на порту 3000
echo "🛑 Остановка процессов на порту 3000..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || echo "   Порт 3000 свободен"

echo ""
echo "📋 Шаг 2: Полная очистка backend"
echo "-------------------------------"

cd backend

# Удаляем виртуальное окружение
if [ -d "venv" ]; then
    echo "🗑️ Удаление виртуального окружения..."
    rm -rf venv
fi

# Удаляем кэш Python
echo "🗑️ Очистка кэша Python..."
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Удаляем логи
echo "🗑️ Очистка логов..."
rm -f ../backend.log
rm -f *.log

echo ""
echo "📋 Шаг 3: Создание нового виртуального окружения"
echo "-----------------------------------------------"

# Создаем новое виртуальное окружение
echo "🐍 Создание нового виртуального окружения..."
python3 -m venv venv

echo ""
echo "📋 Шаг 4: Установка только безопасных зависимостей"
echo "------------------------------------------------"

# Активируем виртуальное окружение
echo "📦 Активация виртуального окружения..."
source venv/bin/activate

# Обновляем pip
echo "📦 Обновление pip..."
venv/bin/pip install --upgrade pip

# Устанавливаем setuptools и wheel
echo "📦 Установка setuptools и wheel..."
venv/bin/pip install setuptools wheel

# Устанавливаем только основные зависимости БЕЗ pandas
echo "📦 Установка основных зависимостей..."
venv/bin/pip install fastapi==0.104.1 uvicorn[standard]==0.24.0

echo "📦 Установка зависимостей для БД..."
venv/bin/pip install sqlalchemy==2.0.23 asyncpg==0.29.0 psycopg2-binary==2.9.9 alembic==1.12.1

echo "📦 Установка зависимостей для аутентификации..."
venv/bin/pip install pydantic[email]==2.5.0 python-multipart==0.0.6 python-jose[cryptography]==3.3.0 passlib[bcrypt]==1.7.4 bcrypt==4.0.1

echo "📦 Установка дополнительных зависимостей..."
venv/bin/pip install python-dotenv==1.0.0 fastapi-users==12.1.2 aiohttp==3.9.5 httpx==0.25.2 requests==2.31.0

echo ""
echo "📋 Шаг 5: Создание заглушек для pandas"
echo "------------------------------------"

# Создаем заглушки для pandas
echo "🔧 Создание заглушек для pandas..."
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

echo "✅ Заглушки для pandas созданы"

echo ""
echo "📋 Шаг 6: Замена импортов pandas"
echo "-------------------------------"

# Заменяем импорты pandas на заглушки
echo "🔄 Замена импортов pandas..."
for file in api/v1/endpoints/*.py; do
    if [ -f "$file" ] && grep -q "import pandas" "$file"; then
        echo "🔄 Обработка файла: $file"
        cp "$file" "$file.backup"
        sed -i 's/import pandas as pd/from pandas_stub import pd/' "$file"
        echo "✅ Импорт заменен в $file"
    fi
done

echo ""
echo "📋 Шаг 7: Проверка установки"
echo "-------------------------"

# Проверяем установку
echo "🔍 Проверка установленных пакетов..."
venv/bin/python -c "import fastapi; print('fastapi:', fastapi.__version__)"
venv/bin/python -c "import uvicorn; print('uvicorn:', uvicorn.__version__)"
venv/bin/python -c "from pandas_stub import pd; print('pandas_stub: OK')"

echo ""
echo "📋 Шаг 8: Запуск backend"
echo "---------------------"

# Загружаем переменные окружения
echo "🔧 Загрузка переменных окружения..."
if [ -f "../.env.production" ]; then
    set -a
    source ../.env.production
    set +a
    echo "✅ Переменные окружения загружены"
else
    echo "⚠️ Файл .env.production не найден, используем значения по умолчанию"
fi

# Запускаем backend
echo "🚀 Запуск backend сервера..."
echo "   Порт: 8000"
echo "   Логи: ../backend.log"
echo "   Python: venv/bin/python"
echo "   Uvicorn: venv/bin/uvicorn"

# Запускаем в фоне
nohup bash -c "source venv/bin/activate && venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000" > ../backend.log 2>&1 &

BACKEND_PID=$!
echo "📋 Backend запущен с PID: $BACKEND_PID"

echo ""
echo "📋 Шаг 9: Проверка запуска"
echo "-------------------------"

# Ждем запуска backend
echo "⏳ Ожидание запуска backend..."
sleep 15

# Проверяем доступность backend
echo "🔍 Проверка доступности backend..."
if curl -s --connect-timeout 10 "http://$SERVER_IP:8000/api/v1/health" > /dev/null; then
    echo "✅ Backend доступен на http://$SERVER_IP:8000"
    echo "✅ Swagger доступен на http://$SERVER_IP:8000/docs"
else
    echo "❌ Backend недоступен, проверяем логи..."
    if [ -f "../backend.log" ]; then
        echo "📋 Последние 10 строк логов backend:"
        tail -10 ../backend.log
    fi
    echo "❌ Не удалось запустить backend"
    exit 1
fi

echo ""
echo "🎉 Backend успешно запущен без pandas!"
echo ""
echo "📋 Проверьте в браузере:"
echo "1. Backend API: http://$SERVER_IP:8000/api/v1/health"
echo "2. Swagger UI: http://$SERVER_IP:8000/docs"
echo "3. Логи backend: tail -f ../backend.log"
echo ""
echo "📋 Следующий шаг:"
echo "Запустите frontend: cd ../frontend && npm start"
