#!/bin/bash

echo "🔧 Изменение docker-compose.yml для использования production.env..."
echo "=================================================================="

# Перейти в директорию проекта
cd ~/agb_proj

echo "📋 Шаг 1: Создаем резервную копию docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.backup

echo "✅ Резервная копия создана"

echo "📋 Шаг 2: Заменяем .env на production.env в docker-compose.yml..."
sed -i 's/env_file:/# env_file:/g' docker-compose.yml
sed -i 's/      - .env/      - production.env/g' docker-compose.yml
sed -i 's/# env_file:/env_file:/g' docker-compose.yml

echo "✅ docker-compose.yml изменен"

echo "📋 Шаг 3: Проверяем изменения..."
echo "Измененные строки:"
echo "----------------------------------------"
grep -A 2 -B 2 "env_file:" docker-compose.yml
echo "----------------------------------------"

echo ""
echo "✅ Модификация docker-compose.yml завершена!"
echo "=================================================================="
echo "Теперь docker-compose будет использовать production.env вместо .env"
echo ""
echo "Для восстановления оригинала выполните:"
echo "cp docker-compose.yml.backup docker-compose.yml"
