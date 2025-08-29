#!/bin/bash

# Скрипт для тестирования деплоя AGB проекта локально
# Использование: ./test-deploy.sh

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
    
    # Проверяем фронтенд через nginx
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

# Тестируем API endpoints
test_api() {
    log "Тестируем API endpoints..."
    
    # Тест health check
    if curl -f http://localhost/health &> /dev/null; then
        success "Health check работает"
    else
        error "Health check не работает"
    fi
    
    # Тест API
    if curl -f http://localhost/api/ &> /dev/null; then
        success "API доступен"
    else
        error "API недоступен"
    fi
    
    success "API тестирование завершено"
}

# Показываем информацию о тестировании
show_test_info() {
    log "Тестирование завершено!"
    
    log "Доступные URL для тестирования:"
    echo "  - Frontend: http://localhost"
    echo "  - Backend API: http://localhost/api"
    echo "  - Health Check: http://localhost/health"
    echo "  - Backend Direct: http://localhost:8000"
    echo "  - Frontend Direct: http://localhost:3000"
    
    log "Для просмотра логов используйте:"
    echo "  - Все сервисы: docker-compose logs -f"
    echo "  - Конкретный сервис: docker-compose logs -f [service_name]"
    
    log "Для остановки тестирования:"
    echo "  - ./test-deploy.sh stop"
    echo "  - или: docker-compose down"
}

# Основная функция
main() {
    log "Начинаем тестирование деплоя AGB проекта..."
    
    check_dependencies
    cleanup
    build_images
    start_services
    apply_migrations
    check_services
    test_api
    show_test_info
}

# Обработка аргументов командной строки
case "${1:-}" in
    "stop")
        log "Останавливаем тестовые сервисы..."
        docker-compose down
        success "Тестовые сервисы остановлены"
        ;;
    "logs")
        log "Показываем логи сервисов..."
        docker-compose logs --tail=50
        ;;
    "status")
        log "Статус тестовых сервисов:"
        docker-compose ps
        ;;
    *)
        main
        ;;
esac
