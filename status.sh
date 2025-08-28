#!/bin/sh

echo "📊 Felix Platform - Статус системы"
echo "=================================="

# Проверка статуса контейнеров
echo "🔍 Статус контейнеров:"
docker-compose -f docker-compose.prod.yml ps

echo ""

# Проверка портов
echo "🔍 Проверка портов:"
if ss -tlnp | grep :80 > /dev/null 2>&1; then
    echo "✅ Порт 80 (HTTP) - открыт"
else
    echo "❌ Порт 80 (HTTP) - закрыт"
fi

if ss -tlnp | grep :5432 > /dev/null 2>&1; then
    echo "✅ Порт 5432 (PostgreSQL) - открыт"
else
    echo "⚠️ Порт 5432 (PostgreSQL) - только локально"
fi

echo ""

# Проверка API
echo "🧪 Проверка API:"
if curl -s http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ API работает"
else
    echo "❌ API не работает"
fi

# Проверка frontend
echo "🌐 Проверка frontend:"
if curl -s http://localhost > /dev/null 2>&1; then
    echo "✅ Frontend работает"
else
    echo "❌ Frontend не работает"
fi

echo ""

# Проверка базы данных
echo "🗄️ Проверка базы данных:"
if docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U felix_user -d agb_felix > /dev/null 2>&1; then
    echo "✅ База данных доступна"
    
    # Количество пользователей
    USER_COUNT=$(docker-compose -f docker-compose.prod.yml exec -T db psql -U felix_user -d agb_felix -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    if [ ! -z "$USER_COUNT" ] && [ "$USER_COUNT" != "0" ]; then
        echo "   👥 Пользователей в БД: $USER_COUNT"
    else
        echo "   ⚠️ Пользователи не найдены"
    fi
else
    echo "❌ База данных недоступна"
fi

echo ""

# Проверка внешнего доступа
echo "🌍 Проверка внешнего доступа:"
if curl -s http://172.25.155.26 > /dev/null 2>&1; then
    echo "✅ Внешний доступ работает"
else
    echo "⚠️ Внешний доступ не работает (проверьте firewall)"
fi

echo ""

# Системная информация
echo "💻 Системная информация:"
echo "   🐳 Docker версия: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)"
echo "   📦 Docker Compose версия: $(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)"
echo "   💾 Свободное место: $(df -h / | tail -1 | awk '{print $4}')"
echo "   🧠 Свободная память: $(free -h | grep Mem | awk '{print $7}')"

echo ""
echo "=================================="
echo "✅ Проверка завершена"
echo "=================================="
