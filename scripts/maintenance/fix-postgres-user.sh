#!/bin/bash

echo "🔧 Исправление проблемы с PostgreSQL пользователями..."
echo "=========================================================="

# Перейти в директорию проекта
cd ~/agb_proj

echo "📋 Шаг 1: Проверяем переменные окружения..."
echo "Текущие настройки из production.env:"
echo "- POSTGRES_DB: $(grep POSTGRES_DB production.env | cut -d'=' -f2)"
echo "- POSTGRES_USER: $(grep POSTGRES_USER production.env | cut -d'=' -f2)"
echo "- POSTGRES_PASSWORD: $(grep POSTGRES_PASSWORD production.env | cut -d'=' -f2)"

echo ""
echo "📋 Шаг 2: Останавливаем сервисы..."
docker-compose down

echo ""
echo "📋 Шаг 3: Запускаем только PostgreSQL..."
docker-compose up -d postgres

echo ""
echo "⏳ Ждем запуска PostgreSQL..."
sleep 10

echo ""
echo "📋 Шаг 4: Подключаемся к PostgreSQL и создаем пользователя..."

# Читаем переменные из production.env
DB_NAME=$(grep POSTGRES_DB production.env | cut -d'=' -f2)
DB_USER=$(grep POSTGRES_USER production.env | cut -d'=' -f2)
DB_PASSWORD=$(grep POSTGRES_PASSWORD production.env | cut -d'=' -f2)

echo "Создаем пользователя: $DB_USER для базы: $DB_NAME"

# Создаем пользователя в PostgreSQL
docker-compose exec -T postgres psql -U postgres -d postgres -c "
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD';
   END IF;
END
\$\$;"

# Даем права пользователю
docker-compose exec -T postgres psql -U postgres -d postgres -c "
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
"

echo ""
echo "✅ Пользователь создан и права назначены!"

echo ""
echo "📋 Шаг 5: Останавливаем PostgreSQL..."
docker-compose down

echo ""
echo "📋 Шаг 6: Запускаем все сервисы..."
docker-compose up -d

echo ""
echo "⏳ Ждем запуска системы..."
sleep 15

echo ""
echo "📋 Шаг 7: Проверяем статус..."
docker-compose ps

echo ""
echo "✅ Исправление завершено!"
echo "=========================================================="
echo "Теперь система должна работать с production.env настройками"
