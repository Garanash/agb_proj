#!/bin/bash

echo "🚀 ВОССТАНОВЛЕНИЕ БАЗЫ ДАННЫХ НА СЕРВЕРЕ"
echo "========================================"

# Проверяем наличие дампа
if [ ! -f "database_backup_full.sql" ]; then
    echo "❌ Файл database_backup_full.sql не найден!"
    echo "   Убедитесь, что дамп базы данных находится в текущей директории."
    exit 1
fi

echo "✅ Дамп базы данных найден: $(ls -lh database_backup_full.sql | awk '{print $5}')"

# Проверяем, что мы на сервере (проверяем наличие Docker)
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен на этом сервере!"
    echo "   Установите Docker и Docker Compose перед продолжением."
    exit 1
fi

echo "✅ Docker найден: $(docker --version)"

# Проверяем, что Docker Compose запущен
if ! docker ps &> /dev/null; then
    echo "❌ Docker не запущен!"
    echo "   Запустите Docker: sudo systemctl start docker"
    exit 1
fi

echo "✅ Docker запущен"

# Останавливаем существующие контейнеры
echo ""
echo "🛑 Остановка существующих контейнеров..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down

# Удаляем старые volumes (если нужно)
echo ""
echo "🗑️ Очистка старых данных..."
docker volume prune -f

# Запускаем только PostgreSQL
echo ""
echo "🐘 Запуск PostgreSQL..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d postgres

# Ждем запуска PostgreSQL
echo ""
echo "⏳ Ожидание запуска PostgreSQL (30 секунд)..."
sleep 30

# Проверяем, что PostgreSQL запущен
echo ""
echo "🔍 Проверка статуса PostgreSQL..."
if ! docker ps | grep -q "agb_postgres_prod"; then
    echo "❌ PostgreSQL не запустился!"
    echo "   Проверьте логи: docker logs agb_postgres_prod"
    exit 1
fi

echo "✅ PostgreSQL запущен"

# Восстанавливаем базу данных
echo ""
echo "📥 Восстановление базы данных из дампа..."
docker exec -i agb_postgres_prod psql -U agb_user -d postgres < database_backup_full.sql

if [ $? -eq 0 ]; then
    echo "✅ База данных успешно восстановлена!"
else
    echo "❌ Ошибка при восстановлении базы данных!"
    echo "   Проверьте логи PostgreSQL: docker logs agb_postgres_prod"
    exit 1
fi

# Проверяем восстановление
echo ""
echo "🔍 Проверка восстановления..."
TABLES_COUNT=$(docker exec agb_postgres_prod psql -U agb_user -d agb_prod -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$TABLES_COUNT" -gt 0 ]; then
    echo "✅ Восстановлено $TABLES_COUNT таблиц"
else
    echo "❌ Таблицы не найдены после восстановления!"
    exit 1
fi

# Проверяем пользователей
echo ""
echo "👥 Проверка пользователей..."
USERS_COUNT=$(docker exec agb_postgres_prod psql -U agb_user -d agb_prod -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')

if [ "$USERS_COUNT" -gt 0 ]; then
    echo "✅ Найдено $USERS_COUNT пользователей"
else
    echo "⚠️ Пользователи не найдены"
fi

# Запускаем все сервисы
echo ""
echo "🚀 Запуск всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d

# Ждем запуска всех сервисов
echo ""
echo "⏳ Ожидание запуска всех сервисов (60 секунд)..."
sleep 60

# Проверяем статус всех контейнеров
echo ""
echo "📊 Статус всех контейнеров:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Проверяем health checks
echo ""
echo "🏥 Проверка health checks..."
for service in postgres redis backend frontend nginx; do
    container_name="agb_${service}_prod"
    if docker ps | grep -q "$container_name"; then
        health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "no-health-check")
        echo "  $service: $health"
    else
        echo "  $service: не запущен"
    fi
done

# Тестируем API
echo ""
echo "🧪 Тестирование API..."
sleep 10

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

# Тестируем health check
echo ""
echo "🔍 Тестирование health check..."
HEALTH_RESPONSE=$(curl -s "http://$SERVER_IP:8000/api/health" || echo "error")

if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
    echo "✅ Backend API работает"
else
    echo "❌ Backend API не отвечает"
    echo "   Ответ: $HEALTH_RESPONSE"
fi

# Тестируем frontend
echo ""
echo "🔍 Тестирование frontend..."
FRONTEND_RESPONSE=$(curl -s -I "http://$SERVER_IP" | head -1 || echo "error")

if [[ "$FRONTEND_RESPONSE" == *"200"* ]] || [[ "$FRONTEND_RESPONSE" == *"HTTP"* ]]; then
    echo "✅ Frontend работает"
else
    echo "❌ Frontend не отвечает"
    echo "   Ответ: $FRONTEND_RESPONSE"
fi

echo ""
echo "🎉 ВОССТАНОВЛЕНИЕ ЗАВЕРШЕНО!"
echo ""
echo "📋 Информация о восстановлении:"
echo "  - Таблиц восстановлено: $TABLES_COUNT"
echo "  - Пользователей найдено: $USERS_COUNT"
echo "  - Сервер: $SERVER_IP"
echo ""
echo "🌐 Доступ к приложению:"
echo "  - Frontend: http://$SERVER_IP"
echo "  - Backend API: http://$SERVER_IP:8000"
echo "  - API Docs: http://$SERVER_IP:8000/docs"
echo ""
echo "🔑 Данные для входа:"
echo "  - Администратор: admin / admin123"
echo "  - Менеджер 1: manager1 / ManagerPass123!"
echo "  - Менеджер 2: manager2 / ManagerPass123!"
echo "  - Сотрудник 1: employee1 / EmployeePass123!"
echo "  - Сотрудник 2: employee2 / EmployeePass123!"
echo "  - ВЭД специалист: ved_passport1 / VedPass123!"
echo "  - Пользователь: user1 / UserPass123!"
echo ""
echo "📝 Полезные команды:"
echo "  - Просмотр логов: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env logs"
echo "  - Перезапуск сервисов: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart"
echo "  - Остановка сервисов: docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down"
