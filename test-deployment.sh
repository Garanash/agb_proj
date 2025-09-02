#!/bin/bash

# Скрипт для тестирования развертывания
# Проверяет все компоненты системы

set -e

echo "🧪 AGB Project - Тестирование развертывания"
echo "==========================================="

# Функция для проверки HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local max_attempts=10
    local attempt=1
    
    echo "🔍 Проверка $name: $url"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ $name доступен"
            return 0
        else
            echo "⏳ Попытка $attempt/$max_attempts для $name..."
            sleep 5
            ((attempt++))
        fi
    done
    
    echo "❌ $name недоступен после $max_attempts попыток"
    return 1
}

# Проверяем статус контейнеров
echo "📊 Статус контейнеров:"
docker-compose ps

echo ""
echo "🏥 Проверка здоровья сервисов..."

# Проверяем backend healthcheck
if check_endpoint "http://localhost:8000/api/health" "Backend Health"; then
    echo "📋 Детали backend health:"
    curl -s http://localhost:8000/api/health | jq . 2>/dev/null || curl -s http://localhost:8000/api/health
    echo ""
fi

# Проверяем frontend
check_endpoint "http://localhost:3000" "Frontend"

# Проверяем API endpoints
echo "🔧 Проверка API endpoints..."
check_endpoint "http://localhost:8000/docs" "API Documentation"
check_endpoint "http://localhost:8000/api/" "API Root"

# Проверяем базу данных
echo "🗄️  Проверка базы данных..."
if docker-compose exec -T postgres pg_isready -U felix_user -d agb_felix > /dev/null 2>&1; then
    echo "✅ База данных доступна"
    
    # Проверяем наличие таблиц
    echo "📋 Проверка таблиц в базе данных..."
    TABLES=$(docker-compose exec -T postgres psql -U felix_user -d agb_felix -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' \n')
    
    if [ "$TABLES" -gt 0 ]; then
        echo "✅ Найдено $TABLES таблиц в базе данных"
        
        # Проверяем наличие пользователей
        USER_COUNT=$(docker-compose exec -T postgres psql -U felix_user -d agb_felix -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n')
        if [ "$USER_COUNT" -gt 0 ]; then
            echo "✅ Найдено $USER_COUNT пользователей в системе"
        else
            echo "⚠️  Пользователи не найдены - возможно, инициализация не завершена"
        fi
    else
        echo "❌ Таблицы не найдены в базе данных"
    fi
else
    echo "❌ База данных недоступна"
fi

echo ""
echo "📊 Сводка тестирования:"
echo "======================="

# Проверяем все компоненты и выводим результат
COMPONENTS=(
    "Backend Health:http://localhost:8000/api/health"
    "Frontend:http://localhost:3000"
    "API Docs:http://localhost:8000/docs"
    "API Root:http://localhost:8000/api/"
)

ALL_OK=true

for component in "${COMPONENTS[@]}"; do
    IFS=':' read -r name url <<< "$component"
    if curl -f -s "$url" > /dev/null 2>&1; then
        echo "✅ $name - OK"
    else
        echo "❌ $name - FAIL"
        ALL_OK=false
    fi
done

echo ""
if [ "$ALL_OK" = true ]; then
    echo "🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!"
    echo "Система готова к использованию."
    echo ""
    echo "🌐 Доступ к системе:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
    echo ""
    echo "👤 Тестовые учетные данные:"
    echo "   admin / admin123"
    echo "   testuser / test123"
else
    echo "❌ НЕКОТОРЫЕ ТЕСТЫ НЕ ПРОЙДЕНЫ"
    echo "Проверьте логи сервисов:"
    echo "   docker-compose logs"
    echo ""
    echo "Попробуйте перезапустить сервисы:"
    echo "   docker-compose restart"
fi
