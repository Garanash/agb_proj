#!/bin/bash

# Скрипт для исправления проблем с местом на сервере и повторного развертывания

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

# Проверяем подключение к серверу
SERVER_IP="37.252.20.46"
SERVER_USER="root"

log "🚀 Начинаем исправление проблем с сервером..."

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

# Передаем скрипт очистки на сервер
info "Передаем скрипт очистки на сервер..."
scp cleanup-server.sh $SERVER_USER@$SERVER_IP:/tmp/

# Выполняем очистку на сервере
info "Выполняем очистку на сервере..."
ssh $SERVER_USER@$SERVER_IP "chmod +x /tmp/cleanup-server.sh && /tmp/cleanup-server.sh"

# Передаем оптимизированный Dockerfile
info "Передаем оптимизированный Dockerfile на сервер..."
scp frontend/Dockerfile.prod.minimal $SERVER_USER@$SERVER_IP:/tmp/Dockerfile.prod

# Переходим в директорию проекта на сервере
info "Переходим в директорию проекта на сервере..."
ssh $SERVER_USER@$SERVER_IP "cd /root/agb_proj && cp /tmp/Dockerfile.prod frontend/"

# Останавливаем все контейнеры
info "Останавливаем все контейнеры..."
ssh $SERVER_USER@$SERVER_IP "cd /root/agb_proj && docker-compose -f docker-compose.prod.yml down"

# Очищаем Docker кэш
info "Очищаем Docker кэш..."
ssh $SERVER_USER@$SERVER_IP "docker system prune -a -f --volumes"

# Запускаем развертывание
info "Запускаем развертывание..."
ssh $SERVER_USER@$SERVER_IP "cd /root/agb_proj && chmod +x deploy-root.sh && ./deploy-root.sh"

log "✅ Исправление проблем с сервером завершено!"
info "Проверьте статус сервисов:"
info "ssh $SERVER_USER@$SERVER_IP 'cd /root/agb_proj && docker-compose -f docker-compose.prod.yml ps'"