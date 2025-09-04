#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Функция для логирования ошибок
log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ОШИБКА: $1${NC}" >&2
}

# Функция для проверки наличия команды
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "Команда '$1' не найдена. Установите необходимые зависимости."
        exit 1
    fi
}

# Проверка наличия необходимых команд
check_command docker
check_command docker-compose
check_command openssl

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    log_error "Скрипт должен быть запущен с правами root (используйте sudo)"
    exit 1
fi

echo -e "${GREEN}=== Инициализация проекта AGB ===${NC}"

# Очистка кэшей и временных файлов
log "1. Очистка кэшей и временных файлов..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Очистка Docker
log "Очистка Docker кэша..."
if docker system prune -f; then
    log "✓ Docker кэш очищен"
else
    log_error "Ошибка при очистке Docker кэша"
    exit 1
fi

# Остановка и удаление контейнеров
log "2. Остановка и удаление контейнеров..."
if docker-compose down -v --remove-orphans; then
    log "✓ Контейнеры остановлены и удалены"
else
    log_error "Ошибка при остановке контейнеров"
    exit 1
fi

# Генерация production.env
log "3. Создание файла конфигурации production.env..."

# Генерация случайных паролей
DB_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
SECRET_KEY=$(openssl rand -base64 64 | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)
ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

# Создание production.env
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

if [ $? -eq 0 ]; then
    log "✓ Файл production.env создан"
else
    log_error "Ошибка при создании файла production.env"
    exit 1
fi

# Сохранение учетных данных
log "Сохранение учетных данных..."
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

if [ $? -eq 0 ]; then
    log "✓ Учетные данные сохранены в credentials.txt"
else
    log_error "Ошибка при сохранении учетных данных"
    exit 1
fi

# Установка прав на файлы
chmod 600 production.env credentials.txt
chown root:root production.env credentials.txt

# Сборка и запуск проекта
log "4. Сборка проекта..."
if ! docker-compose build --no-cache; then
    log_error "Ошибка при сборке проекта"
    exit 1
fi
log "✓ Проект собран"

log "5. Запуск контейнеров..."
if ! docker-compose up -d; then
    log_error "Ошибка при запуске контейнеров"
    exit 1
fi
log "✓ Контейнеры запущены"

# Ожидание готовности базы данных
log "6. Ожидание готовности базы данных..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U felix_prod_user -d agb_felix_prod >/dev/null 2>&1; then
        log "✓ База данных готова"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Превышено время ожидания готовности базы данных"
        exit 1
    fi
    sleep 2
done

# Инициализация базы данных
log "7. Инициализация базы данных..."
if ! docker-compose exec -T backend python init_db.py; then
    log_error "Ошибка при инициализации базы данных"
    exit 1
fi
log "✓ Структура базы данных создана"

if ! docker-compose exec -T backend python init_data.py; then
    log_error "Ошибка при загрузке начальных данных"
    exit 1
fi
log "✓ Начальные данные загружены"

# Проверка работоспособности сервисов
log "8. Проверка работоспособности сервисов..."
for service in backend frontend nginx; do
    if ! docker-compose ps $service | grep -q "Up"; then
        log_error "Сервис $service не запущен"
        exit 1
    fi
done
log "✓ Все сервисы работают"

echo -e "\n${GREEN}=== Проект успешно инициализирован! ===${NC}"
echo -e "${YELLOW}Учетные данные сохранены в файле credentials.txt${NC}"
echo -e "${GREEN}Проект доступен по адресу: http://localhost${NC}"

# Вывод статуса контейнеров
echo -e "\n${YELLOW}Статус контейнеров:${NC}"
docker-compose ps