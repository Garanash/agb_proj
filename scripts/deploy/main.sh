#!/bin/bash
set -e

# 🚀 AGB Project - Главный скрипт развертывания
# Унифицированный скрипт для всех типов развертывания

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Функция показа помощи
show_help() {
    cat << EOF
🚀 AGB Project - Система развертывания

Использование: $0 [КОМАНДА] [ОПЦИИ]

КОМАНДЫ:
    dev         Развертывание для разработки
    prod        Production развертывание
    test        Тестовое развертывание
    stop        Остановка всех сервисов
    restart     Перезапуск сервисов
    status      Показать статус сервисов
    logs        Показать логи
    cleanup     Очистка Docker ресурсов
    health      Проверка здоровья системы

ОПЦИИ:
    --fresh     Свежее развертывание (с очисткой)
    --no-cache  Сборка без кэша
    --verbose   Подробный вывод
    --help      Показать эту справку

ПРИМЕРЫ:
    $0 dev --fresh          # Свежее развертывание для разработки
    $0 prod --no-cache      # Production без кэша
    $0 test                 # Тестовое развертывание
    $0 status               # Статус сервисов
    $0 logs frontend        # Логи фронтенда

EOF
}

# Проверка зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен. Установите Docker и попробуйте снова."
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
    fi
    
    log "✅ Все зависимости установлены"
}

# Проверка конфигурации
check_config() {
    local env_file="config/env/.env"
    
    if [ ! -f "$env_file" ]; then
        warn "Файл .env не найден. Создаем из примера..."
        if [ -f "config/env/production.env.example" ]; then
            cp config/env/production.env.example "$env_file"
            log "✅ Создан файл .env из примера"
        else
            error "Файл .env не найден и нет примера для создания"
        fi
    fi
    
    log "✅ Конфигурация проверена"
}

# Создание необходимых директорий
create_directories() {
    log "Создание необходимых директорий..."
    
    mkdir -p data/uploads/{documents,portfolio,profiles}
    mkdir -p infrastructure/ssl
    mkdir -p logs
    
    log "✅ Директории созданы"
}

# Очистка Docker ресурсов
cleanup_docker() {
    log "Очистка Docker ресурсов..."
    
    # Останавливаем контейнеры
    docker-compose -f config/docker/docker-compose.yml down 2>/dev/null || true
    docker-compose -f config/docker/docker-compose.prod.yml down 2>/dev/null || true
    
    # Удаляем неиспользуемые ресурсы
    docker system prune -f
    docker volume prune -f
    
    log "✅ Docker ресурсы очищены"
}

# Развертывание для разработки
deploy_dev() {
    log "🚀 Развертывание для разработки..."
    
    check_dependencies
    check_config
    create_directories
    
    if [ "$1" = "--fresh" ]; then
        cleanup_docker
    fi
    
    docker-compose -f config/docker/docker-compose.yml up -d --build
    
    log "✅ Развертывание для разработки завершено"
    log "🌐 Frontend: http://localhost:3000"
    log "🌐 Backend: http://localhost:8000"
    log "🌐 API Docs: http://localhost:8000/docs"
}

# Production развертывание
deploy_prod() {
    log "🏭 Production развертывание..."
    
    check_dependencies
    check_config
    create_directories
    
    if [ "$1" = "--fresh" ]; then
        cleanup_docker
    fi
    
    docker-compose -f config/docker/docker-compose.prod.yml up -d --build
    
    log "✅ Production развертывание завершено"
    log "🌐 Приложение доступно по адресу: http://localhost"
}

# Тестовое развертывание
deploy_test() {
    log "🧪 Тестовое развертывание..."
    
    check_dependencies
    check_config
    create_directories
    
    # Используем production конфигурацию для тестов
    docker-compose -f config/docker/docker-compose.prod.yml up -d --build
    
    # Запускаем тесты
    ./scripts/setup/test-deployment.sh
    
    log "✅ Тестовое развертывание завершено"
}

# Остановка сервисов
stop_services() {
    log "⏹️ Остановка сервисов..."
    
    docker-compose -f config/docker/docker-compose.yml down 2>/dev/null || true
    docker-compose -f config/docker/docker-compose.prod.yml down 2>/dev/null || true
    
    log "✅ Сервисы остановлены"
}

# Показать статус
show_status() {
    log "📊 Статус сервисов:"
    
    echo ""
    echo "=== Docker Compose Services ==="
    docker-compose -f config/docker/docker-compose.yml ps 2>/dev/null || echo "Нет активных сервисов разработки"
    
    echo ""
    echo "=== Production Services ==="
    docker-compose -f config/docker/docker-compose.prod.yml ps 2>/dev/null || echo "Нет активных production сервисов"
    
    echo ""
    echo "=== Docker System ==="
    docker system df
}

# Показать логи
show_logs() {
    local service=${1:-""}
    
    if [ -n "$service" ]; then
        log "📋 Логи сервиса: $service"
        docker-compose -f config/docker/docker-compose.yml logs -f "$service" 2>/dev/null || \
        docker-compose -f config/docker/docker-compose.prod.yml logs -f "$service" 2>/dev/null || \
        error "Сервис '$service' не найден"
    else
        log "📋 Логи всех сервисов:"
        docker-compose -f config/docker/docker-compose.yml logs -f 2>/dev/null || \
        docker-compose -f config/docker/docker-compose.prod.yml logs -f 2>/dev/null || \
        error "Нет активных сервисов"
    fi
}

# Проверка здоровья системы
check_health() {
    log "🏥 Проверка здоровья системы..."
    
    # Проверяем Docker
    if ! docker info &> /dev/null; then
        error "Docker не запущен"
    fi
    
    # Проверяем сервисы
    local services=("frontend" "backend" "postgres" "nginx")
    for service in "${services[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$service"; then
            log "✅ $service: запущен"
        else
            warn "❌ $service: не запущен"
        fi
    done
    
    log "✅ Проверка здоровья завершена"
}

# Главная функция
main() {
    local command=${1:-"help"}
    local option=${2:-""}
    
    case $command in
        "dev")
            deploy_dev "$option"
            ;;
        "prod")
            deploy_prod "$option"
            ;;
        "test")
            deploy_test "$option"
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            stop_services
            sleep 2
            deploy_dev "$option"
            ;;
        "status")
            show_status
            ;;
        "logs")
            show_logs "$option"
            ;;
        "cleanup")
            cleanup_docker
            ;;
        "health")
            check_health
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            error "Неизвестная команда: $command. Используйте --help для справки."
            ;;
    esac
}

# Запуск
main "$@"
