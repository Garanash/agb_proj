#!/bin/bash

# Финальный скрипт для исправления всех проблем на сервере

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

log "🚀 Начинаем исправление всех проблем на сервере..."

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

# Передаем скрипт очистки
scp cleanup-server.sh $SERVER_USER@$SERVER_IP:/tmp/

# Передаем оптимизированный Dockerfile
scp frontend/Dockerfile.prod.minimal $SERVER_USER@$SERVER_IP:/tmp/Dockerfile.prod

# Передаем исправленный next.config.js
scp frontend/next.config.js $SERVER_USER@$SERVER_IP:/tmp/

# Передаем исправленный файл service-engineer
scp frontend/app/dashboard/service-engineer/page.tsx $SERVER_USER@$SERVER_IP:/tmp/

# Передаем минимальную версию docker-compose
scp docker-compose.minimal.yml $SERVER_USER@$SERVER_IP:/tmp/

# Передаем скрипт развертывания минимальной версии
scp deploy-minimal.sh $SERVER_USER@$SERVER_IP:/tmp/

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
docker-compose -f docker-compose.minimal.yml down 2>/dev/null || true

# Выполняем очистку
echo "Выполняем очистку сервера..."
chmod +x /tmp/cleanup-server.sh
/tmp/cleanup-server.sh

# Копируем исправленные файлы
echo "Копируем исправленные файлы..."
cp /tmp/Dockerfile.prod frontend/
cp /tmp/next.config.js frontend/
cp /tmp/page.tsx frontend/app/dashboard/service-engineer/
cp /tmp/docker-compose.minimal.yml ./
cp /tmp/deploy-minimal.sh ./

# Делаем скрипты исполняемыми
chmod +x deploy-minimal.sh

# Очищаем Docker кэш еще раз
echo "Очищаем Docker кэш..."
docker system prune -a -f --volumes

# Запускаем развертывание минимальной версии
echo "Запускаем развертывание минимальной версии..."
./deploy-minimal.sh

echo "✅ Исправления завершены!"
EOF

log "✅ Все исправления выполнены на сервере!"

# Проверяем статус сервисов
info "Проверяем статус сервисов..."
ssh $SERVER_USER@$SERVER_IP "cd /root/agb_proj && docker-compose -f docker-compose.minimal.yml ps"

log "🎉 Исправление всех проблем завершено!"
info "Проверьте доступность приложения:"
info "  - Фронтенд: http://$SERVER_IP:3000"
info "  - Бекенд: http://$SERVER_IP:8000"
echo ""
info "Полезные команды для мониторинга:"
info "  - Логи: ssh $SERVER_USER@$SERVER_IP 'cd /root/agb_proj && docker-compose -f docker-compose.minimal.yml logs -f'"
info "  - Статус: ssh $SERVER_USER@$SERVER_IP 'cd /root/agb_proj && docker-compose -f docker-compose.minimal.yml ps'"
info "  - Перезапуск: ssh $SERVER_USER@$SERVER_IP 'cd /root/agb_proj && docker-compose -f docker-compose.minimal.yml restart'"
