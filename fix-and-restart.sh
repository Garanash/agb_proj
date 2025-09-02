#!/bin/bash

# Быстрое исправление и перезапуск
# Используется когда нужно быстро пересобрать после изменений

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

info "🔧 Быстрое исправление и перезапуск..."

# 1. Проверяем наличие production.env
if [[ ! -f "production.env" ]]; then
    error "production.env не найден!"
    exit 1
fi

# 2. Останавливаем все сервисы
info "1. Останавливаем все сервисы..."
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
docker-compose -f docker-compose.prod.offline.yml down --remove-orphans 2>/dev/null || true

# 3. Очищаем кэш
info "2. Очищаем Docker кэш..."
docker system prune -af --volumes 2>/dev/null || true

# 4. Определяем конфигурацию
if docker info | grep -q "Username:"; then
    USERNAME=$(docker info | grep "Username:" | awk '{print $2}')
    success "Авторизован как: $USERNAME"
    COMPOSE_FILE="docker-compose.prod.yml"
else
    warning "Не авторизован в Docker Hub, используем offline конфигурацию"
    COMPOSE_FILE="docker-compose.prod.offline.yml"
fi

# 5. Пересобираем и запускаем
info "3. Пересобираем и запускаем сервисы..."
docker-compose -f $COMPOSE_FILE up -d --build --force-recreate

# 6. Ждем запуска
info "4. Ждем запуска сервисов (45 секунд)..."
sleep 45

# 7. Проверяем статус
info "5. Проверяем статус..."
docker-compose -f $COMPOSE_FILE ps

success "🎉 Перезапуск завершен!"
info "Проверьте логи: docker-compose -f $COMPOSE_FILE logs -f"
