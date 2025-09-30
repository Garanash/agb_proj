#!/bin/bash

# Скрипт для деплоя AGB проекта
# Использование: ./deploy.sh [environment] [action]
# environment: dev, prod (по умолчанию: prod)
# action: build, up, down, restart, logs (по умолчанию: up)

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌${NC} $1"
}

# Параметры
ENVIRONMENT=${1:-prod}
ACTION=${2:-up}

# Проверка параметров
if [[ ! "$ENVIRONMENT" =~ ^(dev|prod)$ ]]; then
    error "Неверное окружение. Используйте: dev или prod"
    exit 1
fi

if [[ ! "$ACTION" =~ ^(build|up|down|restart|logs|status)$ ]]; then
    error "Неверное действие. Используйте: build, up, down, restart, logs, status"
    exit 1
fi

# Определение файла конфигурации
if [ "$ENVIRONMENT" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    log "Используется конфигурация для разработки"
else
    COMPOSE_FILE="docker-compose.yml"
    log "Используется конфигурация для продакшна"
fi

# Проверка существования файла конфигурации
if [ ! -f "$COMPOSE_FILE" ]; then
    error "Файл конфигурации $COMPOSE_FILE не найден"
    exit 1
fi

# Функция для проверки Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker не запущен или нет прав доступа"
        exit 1
    fi
}

# Функция для проверки переменных окружения
check_env() {
    if [ "$ENVIRONMENT" = "prod" ]; then
        if [ ! -f "config/env/production.env" ]; then
            warning "Файл config/env/production.env не найден"
            log "Создайте файл конфигурации на основе config/env/production.env.example"
        fi
    fi
}

# Функция для сборки образов
build_images() {
    log "Сборка Docker образов..."
    docker-compose -f $COMPOSE_FILE build --no-cache
    success "Образы собраны успешно"
}

# Функция для запуска сервисов
start_services() {
    log "Запуск сервисов..."
    docker-compose -f $COMPOSE_FILE up -d
    success "Сервисы запущены"
    
    # Ожидание готовности сервисов
    log "Ожидание готовности сервисов..."
    sleep 10
    
    # Проверка статуса
    docker-compose -f $COMPOSE_FILE ps
}

# Функция для остановки сервисов
stop_services() {
    log "Остановка сервисов..."
    docker-compose -f $COMPOSE_FILE down
    success "Сервисы остановлены"
}

# Функция для перезапуска сервисов
restart_services() {
    log "Перезапуск сервисов..."
    docker-compose -f $COMPOSE_FILE restart
    success "Сервисы перезапущены"
}

# Функция для просмотра логов
show_logs() {
    log "Просмотр логов..."
    docker-compose -f $COMPOSE_FILE logs -f
}

# Функция для проверки статуса
show_status() {
    log "Статус сервисов:"
    docker-compose -f $COMPOSE_FILE ps
}

# Функция для очистки
cleanup() {
    log "Очистка неиспользуемых ресурсов..."
    docker system prune -f
    success "Очистка завершена"
}

# Основная логика
main() {
    log "🚀 Запуск деплоя AGB проекта"
    log "Окружение: $ENVIRONMENT"
    log "Действие: $ACTION"
    
    check_docker
    check_env
    
    case $ACTION in
        "build")
            build_images
            ;;
        "up")
            build_images
            start_services
            ;;
        "down")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
    esac
    
    success "Деплой завершен успешно!"
    
    if [ "$ACTION" = "up" ]; then
        log "🌐 Приложение доступно по адресу: http://localhost"
        log "📊 Статус сервисов: docker-compose ps"
        log "📝 Логи: docker-compose logs -f"
    fi
}

# Обработка сигналов
trap 'error "Деплой прерван"; exit 1' INT TERM

# Запуск
main "$@"