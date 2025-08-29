#!/bin/bash

# Скрипт для анализа всех логов Docker
# Запускать на сервере для диагностики проблем

set -e

echo "🔍 АНАЛИЗ ЛОГОВ DOCKER"
echo "======================"
echo ""

# 1. Статус контейнеров
echo "1. 📊 Статус контейнеров:"
docker-compose ps
echo ""

# 2. Проверка ресурсов
echo "2. 💾 Использование ресурсов:"
docker stats --no-stream agb_backend agb_frontend agb_nginx agb_postgres 2>/dev/null || echo "Некоторые контейнеры не запущены"
echo ""

# 3. Логи каждого сервиса
SERVICES=("postgres" "backend" "frontend" "nginx")

for service in "${SERVICES[@]}"; do
    echo "3. 📝 Логи $service:"
    echo "----------------------------------------"

    # Проверяем, запущен ли контейнер
    if docker-compose ps $service | grep -q "Up"; then
        # Получаем последние 20 строк логов
        docker-compose logs --tail=20 $service 2>&1
    else
        echo "❌ Контейнер $service не запущен"
    fi

    echo ""
    echo "----------------------------------------"
    echo ""
done

# 4. Проверка сетевых подключений
echo "4. 🌐 Сетевые подключения:"
echo "   - Проверка портов:"
netstat -tlnp 2>/dev/null | grep -E "(80|5432)" || ss -tlnp | grep -E "(80|5432)" || echo "Не удалось проверить порты"

echo ""
echo "   - Проверка Docker сетей:"
docker network ls | grep agb || echo "Сеть agb не найдена"

echo ""

# 5. Проверка конфигурации
echo "5. ⚙️ Конфигурация:"

echo "   - Docker Compose файл:"
if [ -f "docker-compose.yml" ]; then
    echo "   ✅ docker-compose.yml существует"
else
    echo "   ❌ docker-compose.yml не найден"
fi

echo "   - Переменные окружения:"
if [ -f ".env" ]; then
    echo "   ✅ .env существует"
    echo "   Содержимое .env:"
    cat .env | sed 's/^/     /'
else
    echo "   ❌ .env не найден"
fi

echo ""

# 6. Тестирование сервисов
echo "6. 🧪 Тестирование сервисов:"

echo "   - PostgreSQL:"
if docker-compose exec -T postgres pg_isready -U felix_user -d agb_felix >/dev/null 2>&1; then
    echo "   ✅ PostgreSQL готов"
else
    echo "   ❌ PostgreSQL не готов"
fi

echo "   - Backend API:"
API_RESPONSE=$(curl -s --max-time 5 http://localhost/api/health 2>/dev/null)
if echo "$API_RESPONSE" | grep -q "healthy"; then
    echo "   ✅ Backend API работает: $API_RESPONSE"
else
    echo "   ❌ Backend API не работает: $API_RESPONSE"
fi

echo "   - Frontend:"
FRONTEND_RESPONSE=$(curl -s --max-time 5 -I http://localhost/ 2>/dev/null | head -1)
if echo "$FRONTEND_RESPONSE" | grep -q "200"; then
    echo "   ✅ Frontend работает: $FRONTEND_RESPONSE"
else
    echo "   ❌ Frontend не работает: $FRONTEND_RESPONSE"
fi

echo "   - Nginx:"
NGINX_RESPONSE=$(curl -s --max-time 5 http://localhost/health 2>/dev/null)
if [ "$NGINX_RESPONSE" = "healthy" ]; then
    echo "   ✅ Nginx health check работает"
else
    echo "   ❌ Nginx health check не работает: $NGINX_RESPONSE"
fi

echo ""

# 7. Проверка на распространенные ошибки
echo "7. 🔍 Поиск распространенных ошибок:"

echo "   - Ошибки в логах backend:"
docker-compose logs backend 2>&1 | grep -i error | tail -5 || echo "   ✅ Ошибок в backend не найдено"

echo ""
echo "   - Ошибки в логах frontend:"
docker-compose logs frontend 2>&1 | grep -i error | tail -5 || echo "   ✅ Ошибок в frontend не найдено"

echo ""
echo "   - Ошибки в логах nginx:"
docker-compose logs nginx 2>&1 | grep -i error | tail -5 || echo "   ✅ Ошибок в nginx не найдено"

echo ""

# 8. Рекомендации
echo "8. 💡 Рекомендации:"
echo ""

if ! docker-compose ps | grep -q "Up.*backend"; then
    echo "   🔧 Backend не запущен. Попробуйте:"
    echo "      docker-compose up -d backend"
fi

if ! docker-compose ps | grep -q "Up.*frontend"; then
    echo "   🔧 Frontend не запущен. Попробуйте:"
    echo "      docker-compose up -d frontend"
fi

if ! docker-compose ps | grep -q "Up.*nginx"; then
    echo "   🔧 Nginx не запущен. Попробуйте:"
    echo "      docker-compose up -d nginx"
fi

if ! curl -s http://localhost/api/health | grep -q "healthy"; then
    echo "   🔧 API не работает. Проверьте логи:"
    echo "      docker-compose logs backend"
fi

echo ""
echo "   📞 Для дополнительной диагностики:"
echo "      ./debug-browser.sh"
echo "      docker-compose logs -f"
echo "      docker-compose restart"
