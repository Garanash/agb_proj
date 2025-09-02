#!/bin/bash

# Скрипт для исправления проблем на сервере (запуск непосредственно на сервере)
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

log "🚀 Запуск исправления проблем на сервере..."

# Проверяем, что мы в правильной директории
if [[ ! -f "docker-compose.prod.yml" ]]; then
    error "Файл docker-compose.prod.yml не найден!"
    error "Убедитесь, что вы находитесь в директории проекта (/root/agb_proj)"
    exit 1
fi

log "✅ Находимся в правильной директории"

# Останавливаем все контейнеры
info "Останавливаем все контейнеры..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Очищаем Docker кэш и неиспользуемые ресурсы
info "Очищаем Docker кэш и неиспользуемые ресурсы..."
docker system prune -a -f --volumes

# Очищаем системные кэши
info "Очищаем системные кэши apt..."
apt-get clean && apt-get autoremove -y

# Очищаем логи
info "Очищаем логи..."
journalctl --vacuum-time=1d

# Проверяем доступное место на диске
info "Проверяем доступное место на диске..."
df -h

# Создаем необходимые директории
info "Создаем необходимые директории..."
mkdir -p uploads ssl backups
chown -R 1000:1000 uploads ssl backups

# Проверяем наличие production.env
if [[ ! -f "production.env" ]]; then
    error "Файл production.env не найден!"
    error "Скопируйте production.env.example в production.env и настройте переменные"
    exit 1
fi

# Запускаем контейнеры
info "Запускаем контейнеры..."
docker-compose -f docker-compose.prod.yml up -d --build

# Ждем запуска сервисов
info "Ждем запуска сервисов..."
sleep 30

# Исправляем права доступа для Docker volumes
info "Исправляем права доступа для Docker volumes..."
docker-compose -f docker-compose.prod.yml exec -T backend chown -R 1000:1000 /app/uploads 2>/dev/null || true
docker-compose -f docker-compose.prod.yml exec -T postgres chown -R 999:999 /var/lib/postgresql/data 2>/dev/null || true

# Проверяем статус сервисов
info "Проверяем статус сервисов..."
docker-compose -f docker-compose.prod.yml ps

log "🎉 Исправление всех проблем завершено!"
info "Проверьте доступность приложения:"
info "  - Фронтенд: http://localhost:3000"
info "  - Бекенд: http://localhost:8000"
info "  - Nginx: http://localhost"
echo ""
info "Полезные команды для мониторинга:"
info "  - Логи: docker-compose -f docker-compose.prod.yml logs -f"
info "  - Статус: docker-compose -f docker-compose.prod.yml ps"
info "  - Перезапуск: docker-compose -f docker-compose.prod.yml restart"
