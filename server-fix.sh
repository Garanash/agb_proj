#!/bin/bash

# Универсальный скрипт для очистки сервера и запуска приложения
# Исправляет все проблемы с местом на диске и запускает систему

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# Параметры сервера
SERVER_IP="37.252.20.46"
SERVER_USER="root"

log "🚀 Запуск универсального исправления сервера..."

# Проверяем подключение к серверу
info "Проверяем подключение к серверу $SERVER_IP..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP exit 2>/dev/null; then
    error "Не удается подключиться к серверу $SERVER_IP"
    error "Убедитесь, что:"
    error "1. Сервер доступен"
    error "2. SSH ключи настроены"
    error "3. Пользователь $SERVER_USER имеет доступ"
    exit 1
fi

log "✅ Подключение к серверу установлено"

# Передаем все необходимые файлы на сервер
info "Передаем исправленные файлы на сервер..."

# Передаем оптимизированный Dockerfile
scp frontend/Dockerfile.prod.minimal $SERVER_USER@$SERVER_IP:/tmp/Dockerfile.prod

# Передаем исправленный next.config.js
scp frontend/next.config.js $SERVER_USER@$SERVER_IP:/tmp/

# Передаем исправленный файл service-engineer
scp frontend/app/dashboard/service-engineer/page.tsx $SERVER_USER@$SERVER_IP:/tmp/

log "✅ Все файлы переданы на сервер"

# Выполняем исправления на сервере
info "Выполняем исправления на сервере..."
ssh $SERVER_USER@$SERVER_IP << 'EOF'
set -e

# Переходим в директорию проекта
cd /root/agb_proj

# Останавливаем все контейнеры
echo "Останавливаем все контейнеры..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Очищаем Docker кэш и неиспользуемые ресурсы
echo "Очищаем Docker кэш и неиспользуемые ресурсы..."
docker system prune -a -f --volumes

# Очищаем системные кэши
echo "Очищаем системные кэши apt..."
apt-get clean && apt-get autoremove -y

# Очищаем логи
echo "Очищаем логи..."
journalctl --vacuum-time=1d

# Проверяем доступное место на диске
echo "Проверяем доступное место на диске..."
df -h

# Копируем исправленные файлы
echo "Копируем исправленные файлы..."
cp /tmp/Dockerfile.prod frontend/
cp /tmp/next.config.js frontend/
cp /tmp/page.tsx frontend/app/dashboard/service-engineer/

# Создаем необходимые директории
echo "Создаем необходимые директории..."
mkdir -p uploads ssl backups
chown -R 1000:1000 uploads ssl backups

# Запускаем контейнеры
echo "Запускаем контейнеры..."
docker-compose -f docker-compose.prod.yml up -d --build

# Исправляем права доступа для Docker volumes
echo "Исправляем права доступа для Docker volumes..."
docker-compose -f docker-compose.prod.yml exec -T backend chown -R 1000:1000 /app/uploads 2>/dev/null || true
docker-compose -f docker-compose.prod.yml exec -T postgres chown -R 999:999 /var/lib/postgresql/data 2>/dev/null || true

# Ждем запуска сервисов
echo "Ждем запуска сервисов..."
sleep 30

# Проверяем статус сервисов
echo "Проверяем статус сервисов..."
docker-compose -f docker-compose.prod.yml ps

echo "✅ Исправления завершены!"
EOF

log "✅ Все исправления выполнены на сервере!"

# Проверяем статус сервисов
info "Проверяем статус сервисов..."
ssh $SERVER_USER@$SERVER_IP "cd /root/agb_proj && docker-compose -f docker-compose.prod.yml ps"

log "🎉 Исправление всех проблем завершено!"
info "Проверьте доступность приложения:"
info "  - Фронтенд: http://$SERVER_IP:3000"
info "  - Бекенд: http://$SERVER_IP:8000"
info "  - Nginx: http://$SERVER_IP"
echo ""
info "Полезные команды для мониторинга:"
info "  - Логи: ssh $SERVER_USER@$SERVER_IP 'cd /root/agb_proj && docker-compose -f docker-compose.prod.yml logs -f'"
info "  - Статус: ssh $SERVER_USER@$SERVER_IP 'cd /root/agb_proj && docker-compose -f docker-compose.prod.yml ps'"
info "  - Перезапуск: ssh $SERVER_USER@$SERVER_IP 'cd /root/agb_proj && docker-compose -f docker-compose.prod.yml restart'"
