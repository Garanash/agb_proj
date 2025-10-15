#!/bin/bash

echo "=== СОЗДАНИЕ ВСЕХ ТАБЛИЦ В БАЗЕ ДАННЫХ ==="

# Проверяем, что мы в правильной директории
if [ ! -f "scripts/create_all_tables.py" ]; then
    echo "❌ Скрипт не найден. Убедитесь, что вы находитесь в корневой директории проекта."
    exit 1
fi

# Проверяем, что backend контейнер запущен
if ! docker ps | grep -q "agb_backend_local"; then
    echo "❌ Backend контейнер не запущен. Запустите сначала Docker среду."
    exit 1
fi

echo "1. Копирование скрипта в контейнер..."
docker cp scripts/create_all_tables.py agb_backend_local:/app/create_all_tables.py

echo "2. Запуск скрипта создания таблиц..."
docker exec agb_backend_local python3 /app/create_all_tables.py

echo "3. Проверка создания таблиц..."
docker exec agb_postgres_local psql -U felix_dev_user -d agb_felix_dev -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
"

echo "4. Проверка администратора..."
docker exec agb_postgres_local psql -U felix_dev_user -d agb_felix_dev -c "
SELECT username, email, first_name, last_name, role, is_active 
FROM users 
WHERE username = 'admin';
"

echo "✅ Готово! Все таблицы созданы."
