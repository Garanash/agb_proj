#!/bin/bash

# Активируем виртуальное окружение
source /app/venv/bin/activate

echo "🚀 Запуск Test Platform Backend..."
echo "📋 Инициализация базы данных..."
python init_db.py &
INIT_PID=$!
echo "⏳ Ожидание завершения инициализации..."
wait $INIT_PID
echo "✅ Инициализация завершена, запуск сервера..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload --workers 2 --loop uvloop --http httptools --access-log --log-level info