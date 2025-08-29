#!/bin/bash

# Скрипт для деплоя AGB проекта на Linux сервер
# Использование: ./deploy.sh [environment]

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для логирования
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Проверяем наличие Docker и Docker Compose
check_dependencies() {
    log "Проверяем зависимости..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен. Установите Docker и попробуйте снова."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
        exit 1
    fi
    
    success "Все зависимости установлены"
}

# Останавливаем и удаляем существующие контейнеры
cleanup() {
    log "Очищаем существующие контейнеры..."
    
    if docker-compose ps -q | grep -q .; then
        docker-compose down --remove-orphans
        success "Существующие контейнеры остановлены и удалены"
    else
        log "Нет запущенных контейнеров"
    fi
}

# Собираем образы
build_images() {
    log "Собираем Docker образы..."
    
    docker-compose build --no-cache
    success "Образы успешно собраны"
}

# Запускаем сервисы
start_services() {
    log "Запускаем сервисы..."
    
    docker-compose up -d
    
    # Ждем запуска сервисов
    log "Ждем запуска сервисов..."
    sleep 30
    
    success "Сервисы запущены"
}

# Проверяем статус сервисов
check_services() {
    log "Проверяем статус сервисов..."
    
    # Проверяем PostgreSQL
    if docker-compose exec -T postgres pg_isready -U felix_user -d agb_felix &> /dev/null; then
        success "PostgreSQL работает"
    else
        error "PostgreSQL не отвечает"
        return 1
    fi
    
    # Проверяем бекенд через nginx
    if curl -f http://localhost/api/health &> /dev/null; then
        success "Backend работает"
    else
        error "Backend не отвечает"
        return 1
    fi
    
    # Проверяем фронтенд
    if curl -f http://localhost &> /dev/null; then
        success "Frontend работает"
    else
        error "Frontend не отвечает"
        return 1
    fi
    
    # Проверяем nginx
    if curl -f http://localhost/health &> /dev/null; then
        success "Nginx работает"
    else
        error "Nginx не отвечает"
        return 1
    fi
    
    success "Все сервисы работают корректно"
}

# Применяем миграции базы данных
apply_migrations() {
    log "Применяем миграции базы данных..."
    
    # Ждем готовности базы данных
    log "Ждем готовности базы данных..."
    while ! docker-compose exec -T postgres pg_isready -U felix_user -d agb_felix &> /dev/null; do
        sleep 5
    done
    
    # Запускаем скрипт создания таблиц
    docker-compose exec -T backend python create_tables.py
    
    success "Миграции применены"
}

# Показываем логи
show_logs() {
    log "Показываем логи сервисов..."
    docker-compose logs --tail=50
}

# Показываем статус
show_status() {
    log "Статус сервисов:"
    docker-compose ps
}

# Основная функция
main() {
    log "Начинаем деплой AGB проекта..."
    
    check_dependencies
    cleanup
    build_images
    start_services
    apply_migrations
    check_services
    
    success "Деплой завершен успешно!"
    
    log "Доступные URL:"
    echo "  - Frontend: http://localhost"
    echo "  - Backend API: http://localhost/api"
    echo "  - Health Check: http://localhost/health"
    
    log "Для просмотра логов используйте: docker-compose logs -f [service_name]"
    log "Для остановки: docker-compose down"
}

# Обработка аргументов командной строки
case "${1:-}" in
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "restart")
        log "Перезапускаем сервисы..."
        docker-compose restart
        success "Сервисы перезапущены"
        ;;
    "stop")
        log "Останавливаем сервисы..."
        docker-compose down
        success "Сервисы остановлены"
        ;;
    "clean")
        log "Полная очистка..."
        docker-compose down --volumes --remove-orphans
        docker system prune -f
        success "Очистка завершена"
        ;;
    *)
        main
        ;;
esac
