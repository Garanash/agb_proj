#!/bin/bash

# Скрипт для развертывания минимальной версии приложения
# Используется когда места на диске очень мало

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

# Проверяем права root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log "✅ Запуск от root подтвержден"
    else
        error "Этот скрипт предназначен для запуска от имени root. Используйте ./deploy.sh для обычного пользователя."
        exit 1
    fi
}

# Проверяем наличие необходимых файлов
check_files() {
    local required_files=(
        "docker-compose.minimal.yml"
        "production.env"
        "frontend/Dockerfile.prod.minimal"
        "backend/Dockerfile.prod"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            error "Не найден необходимый файл: $file"
            exit 1
        fi
    done
    
    log "✅ Все необходимые файлы найдены"
}

# Останавливаем существующие контейнеры
stop_containers() {
    info "Останавливаем существующие контейнеры..."
    docker-compose -f docker-compose.minimal.yml down 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
}

# Очищаем Docker кэш
cleanup_docker() {
    info "Очищаем Docker кэш..."
    docker system prune -a -f --volumes
}

# Создаем необходимые директории
create_directories() {
    info "Создаем необходимые директории..."
    mkdir -p uploads ssl backups
    
    # Исправляем права доступа если запущено от root
    if [[ $EUID -eq 0 ]]; then
        chown -R 1000:1000 uploads ssl backups
    fi
}

# Запускаем контейнеры
start_containers() {
    info "Запускаем контейнеры..."
    docker-compose -f docker-compose.minimal.yml up -d --build
    
    # Исправляем права доступа для Docker volumes если запущено от root
    if [[ $EUID -eq 0 ]]; then
        info "Исправляем права доступа для Docker volumes..."
        docker-compose -f docker-compose.minimal.yml exec -T backend chown -R 1000:1000 /app/uploads 2>/dev/null || true
        docker-compose -f docker-compose.minimal.yml exec -T postgres chown -R 999:999 /var/lib/postgresql/data 2>/dev/null || true
    fi
}

# Проверяем статус сервисов
check_services() {
    info "Проверяем статус сервисов..."
    sleep 30
    
    local services=("postgres" "backend" "frontend")
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.minimal.yml ps | grep -q "$service.*Up"; then
            log "✅ Сервис $service запущен"
        else
            error "❌ Сервис $service не запущен"
        fi
    done
}

# Показываем информацию о развертывании
show_info() {
    log "🎉 Развертывание минимальной версии завершено!"
    echo ""
    info "Доступные сервисы:"
    info "  - Фронтенд: http://localhost:3000"
    info "  - Бекенд: http://localhost:8000"
    info "  - База данных: localhost:5432"
    echo ""
    info "Полезные команды:"
    info "  - Просмотр логов: docker-compose -f docker-compose.minimal.yml logs -f"
    info "  - Остановка: docker-compose -f docker-compose.minimal.yml down"
    info "  - Перезапуск: docker-compose -f docker-compose.minimal.yml restart"
    echo ""
    warn "⚠️  Внимание: Это минимальная версия без Nginx!"
    warn "Для production использования рекомендуется полная версия с Nginx."
}

# Основная функция
main() {
    log "🚀 Запуск развертывания минимальной версии..."
    
    check_root
    check_files
    stop_containers
    cleanup_docker
    create_directories
    start_containers
    check_services
    show_info
    
    log "✅ Развертывание завершено успешно!"
}

# Запускаем основную функцию
main "$@"
