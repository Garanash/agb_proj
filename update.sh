#!/bin/bash
set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Создание бэкапа базы данных
backup_database() {
    log "Создание бэкапа базы данных..."
    
    BACKUP_DIR="backups"
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$BACKUP_DIR"
    
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U felix_prod_user -d agb_felix_prod > "$BACKUP_FILE"; then
        log "Бэкап создан: $BACKUP_FILE ✅"
    else
        error "Ошибка создания бэкапа"
        exit 1
    fi
}

# Обновление кода из Git
update_code() {
    log "Обновление кода из Git..."
    
    if [ -d ".git" ]; then
        git fetch origin
        git pull origin master
        log "Код обновлен ✅"
    else
        warn "Git репозиторий не найден, пропускаем обновление кода"
    fi
}

# Пересборка и перезапуск контейнеров
rebuild_containers() {
    log "Пересборка контейнеров..."
    
    # Останавливаем контейнеры
    docker-compose -f docker-compose.prod.yml down
    
    # Удаляем старые образы
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Запускаем контейнеры
    docker-compose -f docker-compose.prod.yml up -d
    
    log "Контейнеры пересобраны и запущены ✅"
}

# Проверка здоровья после обновления
check_health_after_update() {
    log "Проверка здоровья после обновления..."
    
    # Ждем запуска сервисов
    sleep 30
    
    local retries=0
    local max_retries=10
    
    while [ $retries -lt $max_retries ]; do
        if curl -f http://localhost/health > /dev/null 2>&1; then
            log "Все сервисы работают корректно ✅"
            return 0
        fi
        
        retries=$((retries + 1))
        warn "Попытка $retries/$max_retries - ожидание готовности сервисов..."
        sleep 10
    done
    
    error "Сервисы не отвечают после обновления"
    return 1
}

# Очистка неиспользуемых Docker ресурсов
cleanup_docker() {
    log "Очистка неиспользуемых Docker ресурсов..."
    
    docker system prune -f
    docker volume prune -f
    
    log "Очистка завершена ✅"
}

# Основная функция обновления
main() {
    log "🔄 Запуск обновления AGB Production"
    echo "=================================="
    
    # Проверяем, что контейнеры запущены
    if ! docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
        error "Production контейнеры не запущены. Запустите deploy.sh сначала."
        exit 1
    fi
    
    backup_database
    update_code
    rebuild_containers
    
    if check_health_after_update; then
        log "🎉 Обновление завершено успешно!"
        
        # Предлагаем очистку
        read -p "Выполнить очистку неиспользуемых Docker ресурсов? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cleanup_docker
        fi
        
        info "Приложение обновлено и работает на http://localhost"
    else
        error "Обновление завершилось с ошибками. Проверьте логи:"
        echo "docker-compose -f docker-compose.prod.yml logs"
        exit 1
    fi
}

# Обработка аргументов
case "${1:-}" in
    "backup")
        backup_database
        ;;
    "rebuild")
        rebuild_containers
        ;;
    "health")
        check_health_after_update
        ;;
    "cleanup")
        cleanup_docker
        ;;
    *)
        main
        ;;
esac
