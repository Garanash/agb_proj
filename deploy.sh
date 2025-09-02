#!/bin/bash
set -e

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
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Проверка прав root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "Не запускайте этот скрипт от имени root!"
        exit 1
    fi
}

# Проверка зависимостей
check_dependencies() {
    log "Проверка зависимостей..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен. Установите Docker и попробуйте снова."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose не установлен. Установите Docker Compose и попробуйте снова."
        exit 1
    fi
    
    log "Все зависимости установлены ✅"
}

# Создание production.env если его нет
create_production_env() {
    if [ ! -f "production.env" ]; then
        log "Создание production.env из шаблона..."
        cp production.env.example production.env
        warn "ВНИМАНИЕ: Отредактируйте production.env перед запуском!"
        warn "Особенно важно изменить пароли и секретные ключи!"
        return 1
    else
        log "production.env уже существует ✅"
        return 0
    fi
}

# Создание SSL сертификатов (самоподписанных для тестирования)
create_ssl_certificates() {
    if [ ! -d "ssl" ]; then
        log "Создание SSL сертификатов..."
        mkdir -p ssl
        
        # Создаем самоподписанный сертификат
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/key.pem \
            -out ssl/cert.pem \
            -subj "/C=RU/ST=Moscow/L=Moscow/O=AGB/CN=localhost"
        
        log "SSL сертификаты созданы ✅"
        warn "Для production используйте настоящие SSL сертификаты!"
    else
        log "SSL директория уже существует ✅"
    fi
}

# Создание необходимых директорий
create_directories() {
    log "Создание необходимых директорий..."
    
    mkdir -p scripts
    mkdir -p ssl
    mkdir -p uploads/documents
    mkdir -p uploads/portfolio
    mkdir -p uploads/profiles
    
    # Устанавливаем правильные права
    chmod +x scripts/init-production-db.sh 2>/dev/null || true
    
    log "Директории созданы ✅"
}

# Остановка существующих контейнеров
stop_existing_containers() {
    log "Остановка существующих контейнеров..."
    
    # Останавливаем production контейнеры
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    
    # Останавливаем development контейнеры если они запущены
    docker-compose down 2>/dev/null || true
    
    log "Контейнеры остановлены ✅"
}

# Сборка и запуск production контейнеров
build_and_start() {
    log "Сборка и запуск production контейнеров..."
    
    # Собираем образы
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Запускаем контейнеры
    docker-compose -f docker-compose.prod.yml up -d
    
    log "Контейнеры запущены ✅"
}

# Проверка здоровья сервисов
check_health() {
    log "Проверка здоровья сервисов..."
    
    # Ждем запуска сервисов
    sleep 30
    
    # Проверяем PostgreSQL
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U felix_prod_user -d agb_felix_prod > /dev/null 2>&1; then
        log "PostgreSQL: ✅"
    else
        error "PostgreSQL: ❌"
        return 1
    fi
    
    # Проверяем Backend
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        log "Backend: ✅"
    else
        error "Backend: ❌"
        return 1
    fi
    
    # Проверяем Frontend
    if curl -f http://localhost/ > /dev/null 2>&1; then
        log "Frontend: ✅"
    else
        error "Frontend: ❌"
        return 1
    fi
    
    # Проверяем Nginx
    if curl -f http://localhost/health > /dev/null 2>&1; then
        log "Nginx: ✅"
    else
        error "Nginx: ❌"
        return 1
    fi
    
    log "Все сервисы работают корректно ✅"
    return 0
}

# Показать информацию о развертывании
show_deployment_info() {
    log "🎉 Развертывание завершено успешно!"
    echo ""
    info "Доступ к приложению:"
    echo "  🌐 Веб-интерфейс: http://localhost"
    echo "  🔧 API: http://localhost/api"
    echo "  📊 Health check: http://localhost/health"
    echo ""
    info "Учетные данные администратора:"
    echo "  👤 Логин: admin"
    echo "  🔑 Пароль: (из production.env)"
    echo ""
    info "Полезные команды:"
    echo "  📋 Логи: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  🔄 Перезапуск: docker-compose -f docker-compose.prod.yml restart"
    echo "  🛑 Остановка: docker-compose -f docker-compose.prod.yml down"
    echo "  📊 Статус: docker-compose -f docker-compose.prod.yml ps"
    echo ""
    warn "Не забудьте:"
    echo "  🔐 Изменить пароли в production.env"
    echo "  🔒 Настроить SSL сертификаты для production"
    echo "  🛡️ Настроить файрвол и безопасность"
}

# Основная функция
main() {
    log "🚀 Запуск развертывания AGB Production"
    echo "=================================="
    
    check_root
    check_dependencies
    create_directories
    create_ssl_certificates
    
    if ! create_production_env; then
        error "Отредактируйте production.env и запустите скрипт снова!"
        exit 1
    fi
    
    stop_existing_containers
    build_and_start
    
    if check_health; then
        show_deployment_info
    else
        error "Некоторые сервисы не работают. Проверьте логи:"
        echo "docker-compose -f docker-compose.prod.yml logs"
        exit 1
    fi
}

# Обработка аргументов командной строки
case "${1:-}" in
    "stop")
        log "Остановка production контейнеров..."
        docker-compose -f docker-compose.prod.yml down
        log "Контейнеры остановлены ✅"
        ;;
    "restart")
        log "Перезапуск production контейнеров..."
        docker-compose -f docker-compose.prod.yml restart
        log "Контейнеры перезапущены ✅"
        ;;
    "logs")
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    "status")
        docker-compose -f docker-compose.prod.yml ps
        ;;
    "health")
        check_health
        ;;
    *)
        main
        ;;
esac
