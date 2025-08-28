#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Felix Platform - Статус системы${NC}"
echo "=================================="

# Проверка статуса контейнеров
echo -e "${YELLOW}🔍 Статус контейнеров:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""

# Проверка портов
echo -e "${YELLOW}🔍 Проверка портов:${NC}"
if ss -tlnp | grep :80 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Порт 80 (HTTP) - открыт${NC}"
else
    echo -e "${RED}❌ Порт 80 (HTTP) - закрыт${NC}"
fi

if ss -tlnp | grep :5432 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Порт 5432 (PostgreSQL) - открыт${NC}"
else
    echo -e "${YELLOW}⚠️ Порт 5432 (PostgreSQL) - только локально${NC}"
fi

echo ""

# Проверка API
echo -e "${YELLOW}🧪 Проверка API:${NC}"
if curl -s http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API работает${NC}"
else
    echo -e "${RED}❌ API не работает${NC}"
fi

# Проверка frontend
echo -e "${YELLOW}🌐 Проверка frontend:${NC}"
if curl -s http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend работает${NC}"
else
    echo -e "${RED}❌ Frontend не работает${NC}"
fi

echo ""

# Проверка базы данных
echo -e "${YELLOW}🗄️ Проверка базы данных:${NC}"
if docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U felix_user -d agb_felix > /dev/null 2>&1; then
    echo -e "${GREEN}✅ База данных доступна${NC}"
    
    # Количество пользователей
    USER_COUNT=$(docker-compose -f docker-compose.prod.yml exec -T db psql -U felix_user -d agb_felix -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
    if [ ! -z "$USER_COUNT" ] && [ "$USER_COUNT" != "0" ]; then
        echo -e "${GREEN}   👥 Пользователей в БД: $USER_COUNT${NC}"
    else
        echo -e "${YELLOW}   ⚠️ Пользователи не найдены${NC}"
    fi
else
    echo -e "${RED}❌ База данных недоступна${NC}"
fi

echo ""

# Проверка внешнего доступа
echo -e "${YELLOW}🌍 Проверка внешнего доступа:${NC}"
if curl -s http://172.25.155.26 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Внешний доступ работает${NC}"
else
    echo -e "${YELLOW}⚠️ Внешний доступ не работает (проверьте firewall)${NC}"
fi

echo ""

# Системная информация
echo -e "${YELLOW}💻 Системная информация:${NC}"
echo -e "${GREEN}   🐳 Docker версия: $(docker --version | cut -d' ' -f3 | cut -d',' -f1)${NC}"
echo -e "${GREEN}   📦 Docker Compose версия: $(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)${NC}"
echo -e "${GREEN}   💾 Свободное место: $(df -h / | tail -1 | awk '{print $4}')${NC}"
echo -e "${GREEN}   🧠 Свободная память: $(free -h | grep Mem | awk '{print $7}')${NC}"

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}✅ Проверка завершена${NC}"
echo -e "${GREEN}==================================${NC}"
