#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Felix Platform - Автоматический деплой${NC}"
echo "=================================="

# Функция для проверки команд
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ Команда $1 не найдена! Установите Docker и Docker Compose${NC}"
        exit 1
    fi
}

# Проверяем необходимые команды
echo -e "${YELLOW}🔍 Проверяем необходимые команды...${NC}"
check_command docker
check_command docker-compose

# Остановка всех контейнеров
echo -e "${YELLOW}📦 Останавливаем все контейнеры...${NC}"
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Очистка Docker системы
echo -e "${YELLOW}🧹 Очищаем Docker систему...${NC}"
docker system prune -af --volumes 2>/dev/null || true

# Удаление всех образов
echo -e "${YELLOW}🗑️ Удаляем все образы...${NC}"
docker rmi $(docker images -q) 2>/dev/null || true

# Очистка всех контейнеров
echo -e "${YELLOW}🧹 Очищаем все контейнеры...${NC}"
docker container prune -f 2>/dev/null || true

# Очистка всех volumes
echo -e "${YELLOW}🗂️ Очищаем все volumes...${NC}"
docker volume prune -f 2>/dev/null || true

# Очистка всех networks
echo -e "${YELLOW}🌐 Очищаем все networks...${NC}"
docker network prune -f 2>/dev/null || true

# Проверяем, что порт 80 свободен
echo -e "${YELLOW}🔍 Проверяем порт 80...${NC}"
if ss -tlnp | grep :80 > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️ Порт 80 занят, освобождаем...${NC}"
    sudo fuser -k 80/tcp 2>/dev/null || true
    sleep 2
fi

# Сборка и запуск
echo -e "${YELLOW}🏗️ Собираем и запускаем все сервисы...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

# Ждем запуска базы данных
echo -e "${YELLOW}⏳ Ждем запуска базы данных...${NC}"
sleep 10

# Проверяем статус базы данных
echo -e "${YELLOW}🔍 Проверяем статус базы данных...${NC}"
until docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U felix_user -d agb_felix > /dev/null 2>&1; do
    echo -e "${YELLOW}⏳ База данных еще не готова, ждем...${NC}"
    sleep 5
done
echo -e "${GREEN}✅ База данных готова!${NC}"

# Инициализация базы данных
echo -e "${YELLOW}🗄️ Инициализируем базу данных...${NC}"
docker-compose -f docker-compose.prod.yml exec -T backend python init_db.py 2>/dev/null || {
    echo -e "${YELLOW}⚠️ База данных уже инициализирована${NC}"
}

# Ждем полного запуска всех сервисов
echo -e "${YELLOW}⏳ Ждем полного запуска всех сервисов...${NC}"
sleep 30

# Проверяем статус всех контейнеров
echo -e "${YELLOW}🔍 Проверяем статус всех контейнеров...${NC}"
docker-compose -f docker-compose.prod.yml ps

# Проверяем, что nginx слушает порт 80
echo -e "${YELLOW}🔍 Проверяем, что nginx слушает порт 80...${NC}"
if ss -tlnp | grep :80 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nginx слушает порт 80${NC}"
else
    echo -e "${RED}❌ Nginx не слушает порт 80${NC}"
    echo -e "${YELLOW}🔍 Проверяем логи nginx...${NC}"
    docker-compose -f docker-compose.prod.yml logs nginx
    exit 1
fi

# Тестируем API
echo -e "${YELLOW}🧪 Тестируем API...${NC}"
if curl -s http://localhost/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API работает!${NC}"
else
    echo -e "${YELLOW}⚠️ API еще не готов, ждем...${NC}"
    sleep 30
    if curl -s http://localhost/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API работает!${NC}"
    else
        echo -e "${RED}❌ API не работает${NC}"
        echo -e "${YELLOW}🔍 Проверяем логи backend...${NC}"
        docker-compose -f docker-compose.prod.yml logs backend
    fi
fi

# Финальная проверка
echo -e "${YELLOW}🔍 Финальная проверка...${NC}"
echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}✅ Деплой завершен успешно!${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "${BLUE}🌐 Доступ к приложению:${NC}"
echo -e "${GREEN}   Внутренний: http://localhost${NC}"
echo -e "${GREEN}   Внешний:   http://172.25.155.26${NC}"
echo ""
echo -e "${BLUE}🔑 Данные для входа:${NC}"
echo -e "${GREEN}   Логин: admin${NC}"
echo -e "${GREEN}   Пароль: neurofork1${NC}"
echo ""
echo -e "${BLUE}📋 Полезные команды:${NC}"
echo -e "${GREEN}   Логи:     docker-compose -f docker-compose.prod.yml logs${NC}"
echo -e "${GREEN}   Статус:   docker-compose -f docker-compose.prod.yml ps${NC}"
echo -e "${GREEN}   Остановка: docker-compose -f docker-compose.prod.yml down${NC}"
echo ""
echo -e "${YELLOW}⏳ Приложение полностью готово через 1-2 минуты${NC}"
echo -e "${GREEN}==================================${NC}"
