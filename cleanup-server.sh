#!/bin/bash

# Скрипт для очистки сервера от неиспользуемых ресурсов

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

log "🚀 Запуск очистки сервера..."

# Проверяем доступное место на диске
info "Проверяем доступное место на диске..."
df -h

# Останавливаем все контейнеры
info "Останавливаем все контейнеры..."
docker stop $(docker ps -aq) 2>/dev/null || true

# Удаляем все контейнеры
info "Удаляем все контейнеры..."
docker rm $(docker ps -aq) 2>/dev/null || true

# Удаляем все образы
info "Удаляем все образы..."
docker rmi $(docker images -aq) 2>/dev/null || true

# Очищаем Docker кэш и неиспользуемые ресурсы
info "Очищаем Docker кэш и неиспользуемые ресурсы..."
docker system prune -a -f --volumes

# Очищаем системные кэши
info "Очищаем системные кэши apt..."
apt-get clean && apt-get autoremove -y

# Очищаем логи
info "Очищаем логи..."
journalctl --vacuum-time=1d

# Проверяем доступное место после очистки
info "Проверяем доступное место на диске после очистки..."
df -h

log "✅ Очистка сервера завершена."