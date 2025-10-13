#!/bin/bash

# Скрипт для остановки приложения
# Использование: ./stop-server.sh

echo "🛑 Остановка AGB приложения"
echo "=========================="

# Останавливаем процессы по PID файлу
if [ -f "logs/pids.txt" ]; then
    echo "📋 Остановка процессов по PID..."
    while read -r pid; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "   Остановка процесса $pid"
            kill "$pid"
        fi
    done < logs/pids.txt
    rm -f logs/pids.txt
fi

# Останавливаем все процессы Python и Node
echo "🔄 Остановка всех процессов..."
pkill -f "python.*main.py" || true
pkill -f "next.*dev" || true
pkill -f "uvicorn" || true

# Ждем завершения процессов
sleep 3

# Проверяем, что порты свободны
echo "🔍 Проверка портов..."
if lsof -i :8000 >/dev/null 2>&1; then
    echo "⚠️  Порт 8000 все еще занят"
    lsof -i :8000
fi

if lsof -i :3000 >/dev/null 2>&1; then
    echo "⚠️  Порт 3000 все еще занят"
    lsof -i :3000
fi

echo "✅ Приложение остановлено"
