#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Инициализация проекта AGB ===${NC}"

# Функция для проверки результата выполнения команды
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1${NC}"
    else
        echo -e "${RED}✗ $1${NC}"
        exit 1
    fi
}

# Очистка кэшей и временных файлов
echo -e "\n${YELLOW}1. Очистка кэшей и временных файлов...${NC}"
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null
find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null
find . -type f -name "*.pyc" -delete 2>/dev/null
docker system prune -f >/dev/null 2>&1
check_result "Очистка кэшей завершена"

# Остановка и удаление контейнеров
echo -e "\n${YELLOW}2. Остановка и удаление контейнеров...${NC}"
docker-compose down -v >/dev/null 2>&1
check_result "Контейнеры остановлены и удалены"

# Генерация production.env
echo -e "\n${YELLOW}3. Создание файла конфигурации production.env...${NC}"

# Генерация случайных паролей
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
SECRET_KEY=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

cat > production.env << EOL
# ПРОДАКШЕН КОНФИГУРАЦИЯ AGB ПРОЕКТА

# База данных PostgreSQL
POSTGRES_DB=agb_felix_prod
POSTGRES_USER=felix_prod_user
POSTGRES_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql+asyncpg://felix_prod_user:${DB_PASSWORD}@postgres:5432/agb_felix_prod

# Backend - FastAPI
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
PYTHONWARNINGS=ignore:Unverified HTTPS request
AUTO_INIT_DATA=true

# Frontend - Next.js
NEXT_PUBLIC_API_URL=http://localhost/api
NODE_ENV=production

# Nginx
NGINX_PORT=80
NGINX_SSL_PORT=443

# Администратор по умолчанию
ADMIN_USERNAME=admin
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_FIRST_NAME=Администратор
ADMIN_LAST_NAME=Системы

# Домен (для SSL)
DOMAIN=yourdomain.com

# SSL настройки
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem

# Мониторинг
WATCHTOWER_CLEANUP=true
WATCHTOWER_POLL_INTERVAL=3600
EOL

check_result "Файл production.env создан"

# Сохранение учетных данных
echo -e "\n${YELLOW}Сохранение учетных данных в credentials.txt...${NC}"
cat > credentials.txt << EOL
=== УЧЕТНЫЕ ДАННЫЕ ПРОЕКТА ===
Сохраните эти данные в надежном месте!

База данных:
- Пользователь: felix_prod_user
- Пароль: ${DB_PASSWORD}

Администратор системы:
- Логин: admin
- Пароль: ${ADMIN_PASSWORD}

Секретный ключ:
${SECRET_KEY}
EOL

check_result "Учетные данные сохранены в credentials.txt"

# Сборка и запуск проекта
echo -e "\n${YELLOW}4. Сборка и запуск проекта...${NC}"
docker-compose build --no-cache >/dev/null 2>&1
check_result "Сборка проекта"

docker-compose up -d >/dev/null 2>&1
check_result "Запуск контейнеров"

# Ожидание готовности базы данных
echo -e "\n${YELLOW}5. Ожидание готовности базы данных...${NC}"
sleep 30

# Инициализация базы данных
echo -e "\n${YELLOW}6. Инициализация базы данных...${NC}"
docker-compose exec backend python init_db.py
check_result "Инициализация базы данных"

docker-compose exec backend python init_data.py
check_result "Загрузка начальных данных"

echo -e "\n${GREEN}=== Проект успешно инициализирован! ===${NC}"
echo -e "${YELLOW}Учетные данные сохранены в файле credentials.txt${NC}"
echo -e "${GREEN}Проект доступен по адресу: http://localhost${NC}"
