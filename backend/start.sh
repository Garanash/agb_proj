#!/bin/bash
set -e

# 🚀 AGB Backend - Скрипт запуска
# Запускает FastAPI приложение с инициализацией базы данных

echo "🚀 Запуск AGB Backend..."

# Активируем виртуальное окружение
source /app/venv/bin/activate

# Ждем готовности базы данных
echo "⏳ Ожидание готовности базы данных..."
until pg_isready -h postgres -p 5432 -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
    echo "⏳ База данных не готова, ждем..."
    sleep 2
done

echo "✅ База данных готова"

# Инициализируем базу данных если нужно
if [ "$AUTO_INIT_DATA" = "true" ]; then
    echo "🔧 Инициализация базы данных..."
    cd /app && python scripts/init_db.py
    echo "✅ База данных инициализирована"
fi

# Запускаем FastAPI приложение
echo "🚀 Запуск FastAPI приложения..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
