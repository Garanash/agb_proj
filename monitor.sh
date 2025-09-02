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

# Проверка статуса контейнеров
check_containers() {
    log "Проверка статуса контейнеров..."
    
    docker-compose -f docker-compose.prod.yml ps
}

# Проверка здоровья сервисов
check_health() {
    log "Проверка здоровья сервисов..."
    
    local all_healthy=true
    
    # PostgreSQL
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U felix_prod_user -d agb_felix_prod > /dev/null 2>&1; then
        echo "✅ PostgreSQL: OK"
    else
        echo "❌ PostgreSQL: FAILED"
        all_healthy=false
    fi
    
    # Backend
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        echo "✅ Backend: OK"
    else
        echo "❌ Backend: FAILED"
        all_healthy=false
    fi
    
    # Frontend
    if curl -f http://localhost/ > /dev/null 2>&1; then
        echo "✅ Frontend: OK"
    else
        echo "❌ Frontend: FAILED"
        all_healthy=false
    fi
    
    # Nginx
    if curl -f http://localhost/health > /dev/null 2>&1; then
        echo "✅ Nginx: OK"
    else
        echo "❌ Nginx: FAILED"
        all_healthy=false
    fi
    
    if [ "$all_healthy" = true ]; then
        log "Все сервисы работают корректно ✅"
        return 0
    else
        error "Некоторые сервисы не работают ❌"
        return 1
    fi
}

# Показать логи
show_logs() {
    local service="${1:-}"
    
    if [ -n "$service" ]; then
        log "Показ логов сервиса: $service"
        docker-compose -f docker-compose.prod.yml logs -f "$service"
    else
        log "Показ логов всех сервисов"
        docker-compose -f docker-compose.prod.yml logs -f
    fi
}

# Показать использование ресурсов
show_resources() {
    log "Использование ресурсов Docker..."
    
    echo ""
    echo "📊 Контейнеры:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    echo ""
    echo "💾 Дисковое пространство:"
    docker system df
    
    echo ""
    echo "🗂️ Тома:"
    docker volume ls
}

# Показать информацию о базе данных
show_database_info() {
    log "Информация о базе данных..."
    
    echo ""
    echo "📊 Размер базы данных:"
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U felix_prod_user -d agb_felix_prod -c "
        SELECT 
            pg_size_pretty(pg_database_size('agb_felix_prod')) as database_size;
    "
    
    echo ""
    echo "📋 Количество записей в основных таблицах:"
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U felix_prod_user -d agb_felix_prod -c "
        SELECT 
            'users' as table_name, count(*) as records FROM users
        UNION ALL
        SELECT 
            'ved_nomenclature' as table_name, count(*) as records FROM ved_nomenclature
        UNION ALL
        SELECT 
            'ved_passports' as table_name, count(*) as records FROM ved_passports
        UNION ALL
        SELECT 
            'repair_requests' as table_name, count(*) as records FROM repair_requests
        ORDER BY table_name;
    "
}

# Автоматический мониторинг
auto_monitor() {
    local interval="${1:-60}"
    
    log "Запуск автоматического мониторинга (интервал: ${interval}с)"
    log "Нажмите Ctrl+C для остановки"
    
    while true; do
        clear
        echo "🔄 AGB Production Monitor - $(date)"
        echo "=================================="
        
        check_health
        echo ""
        show_resources
        
        echo ""
        echo "⏰ Следующая проверка через ${interval} секунд..."
        sleep "$interval"
    done
}

# Показать справку
show_help() {
    echo "AGB Production Monitor"
    echo ""
    echo "Использование: $0 [команда]"
    echo ""
    echo "Команды:"
    echo "  status     - Показать статус контейнеров"
    echo "  health     - Проверка здоровья сервисов"
    echo "  logs [сервис] - Показать логи (опционально указать сервис)"
    echo "  resources  - Показать использование ресурсов"
    echo "  database   - Показать информацию о базе данных"
    echo "  monitor [интервал] - Автоматический мониторинг (по умолчанию 60с)"
    echo "  help       - Показать эту справку"
    echo ""
    echo "Примеры:"
    echo "  $0 health"
    echo "  $0 logs backend"
    echo "  $0 monitor 30"
}

# Основная функция
main() {
    case "${1:-help}" in
        "status")
            check_containers
            ;;
        "health")
            check_health
            ;;
        "logs")
            show_logs "$2"
            ;;
        "resources")
            show_resources
            ;;
        "database")
            show_database_info
            ;;
        "monitor")
            auto_monitor "$2"
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

main "$@"
