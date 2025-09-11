#!/bin/bash
set -e

# 🧪 AGB Project - Скрипт тестирования развертывания
# Проверяет работоспособность всех компонентов системы

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

# Функция проверки HTTP эндпоинта
check_http() {
    local url=$1
    local name=$2
    local timeout=${3:-10}
    
    log "Проверка $name: $url"
    
    if curl -s --max-time $timeout "$url" > /dev/null 2>&1; then
        log "✅ $name: доступен"
        return 0
    else
        error "❌ $name: недоступен ($url)"
        return 1
    fi
}

# Функция проверки Docker контейнера
check_container() {
    local container_name=$1
    local service_name=$2
    
    log "Проверка контейнера: $container_name"
    
    if docker ps --format "table {{.Names}}" | grep -q "^$container_name$"; then
        local status=$(docker inspect --format='{{.State.Status}}' "$container_name")
        if [ "$status" = "running" ]; then
            log "✅ $service_name: контейнер запущен"
            return 0
        else
            error "❌ $service_name: контейнер не запущен (статус: $status)"
            return 1
        fi
    else
        error "❌ $service_name: контейнер не найден"
        return 1
    fi
}

# Функция проверки базы данных
check_database() {
    local container_name="agb_postgres_prod"
    local db_name="agb_felix_prod"
    local user="felix_prod_user"
    
    log "Проверка базы данных: $db_name"
    
    if docker exec "$container_name" pg_isready -U "$user" -d "$db_name" > /dev/null 2>&1; then
        log "✅ База данных: доступна"
        return 0
    else
        error "❌ База данных: недоступна"
        return 1
    fi
}

# Функция проверки API эндпоинтов
check_api() {
    local base_url="http://localhost:8000"
    
    log "Проверка API эндпоинтов"
    
    # Проверяем health endpoint
    check_http "$base_url/api/health" "API Health" 5
    
    # Проверяем info endpoint
    check_http "$base_url/api/info" "API Info" 5
    
    # Проверяем docs endpoint
    check_http "$base_url/docs" "API Documentation" 5
    
    log "✅ API эндпоинты: работают"
}

# Функция проверки фронтенда
check_frontend() {
    local base_url="http://localhost:3000"
    
    log "Проверка фронтенда"
    
    # Проверяем главную страницу
    check_http "$base_url" "Frontend" 10
    
    # Проверяем API через Nginx
    check_http "http://localhost/api/health" "Nginx API Proxy" 5
    
    log "✅ Фронтенд: работает"
}

# Функция проверки логов на ошибки
check_logs() {
    local services=("agb_frontend_prod" "agb_backend_prod" "agb_nginx_prod" "agb_postgres_prod")
    
    log "Проверка логов на ошибки"
    
    for service in "${services[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^$service$"; then
            local error_count=$(docker logs "$service" 2>&1 | grep -i "error\|exception\|fatal" | wc -l)
            if [ "$error_count" -gt 0 ]; then
                warn "⚠️ $service: найдено $error_count ошибок в логах"
                docker logs "$service" 2>&1 | grep -i "error\|exception\|fatal" | tail -5
            else
                log "✅ $service: ошибок в логах не найдено"
            fi
        fi
    done
}

# Функция проверки производительности
check_performance() {
    log "Проверка производительности"
    
    # Проверяем использование памяти
    local memory_usage=$(docker stats --no-stream --format "table {{.MemUsage}}" | grep -v "MEM USAGE" | head -4 | awk '{print $1}' | sed 's/MiB//' | awk '{sum+=$1} END {print sum}')
    
    if [ "$memory_usage" -lt 2000 ]; then
        log "✅ Использование памяти: ${memory_usage}MB (нормально)"
    else
        warn "⚠️ Использование памяти: ${memory_usage}MB (высокое)"
    fi
    
    # Проверяем время отклика API
    local response_time=$(curl -s -w "%{time_total}" -o /dev/null "http://localhost:8000/api/health")
    local response_ms=$(echo "$response_time * 1000" | bc)
    
    if (( $(echo "$response_time < 1.0" | bc -l) )); then
        log "✅ Время отклика API: ${response_ms}ms (отлично)"
    elif (( $(echo "$response_time < 3.0" | bc -l) )); then
        log "✅ Время отклика API: ${response_ms}ms (хорошо)"
    else
        warn "⚠️ Время отклика API: ${response_ms}ms (медленно)"
    fi
}

# Функция проверки безопасности
check_security() {
    log "Проверка безопасности"
    
    # Проверяем, что production пароли не используются в dev
    if [ -f "config/env/.env" ]; then
        if grep -q "admin123\|test123\|password" config/env/.env; then
            warn "⚠️ Найдены небезопасные пароли в .env файле"
        else
            log "✅ Пароли в .env файле выглядят безопасно"
        fi
    fi
    
    # Проверяем, что секретный ключ изменен
    if [ -f "config/env/production.env" ]; then
        if grep -q "your-super-secret-key-change-this-in-production" config/env/production.env; then
            warn "⚠️ Секретный ключ не изменен в production.env"
        else
            log "✅ Секретный ключ в production.env изменен"
        fi
    fi
}

# Функция генерации отчета
generate_report() {
    local report_file="logs/deployment-test-$(date +%Y%m%d_%H%M%S).txt"
    
    log "Генерация отчета: $report_file"
    
    mkdir -p logs
    
    {
        echo "==========================================="
        echo "AGB Project - Отчет о тестировании развертывания"
        echo "Дата: $(date)"
        echo "==========================================="
        echo ""
        
        echo "=== Статус контейнеров ==="
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        
        echo "=== Использование ресурсов ==="
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
        echo ""
        
        echo "=== Проверка эндпоинтов ==="
        echo "Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)"
        echo "Backend API: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/health)"
        echo "Nginx: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health)"
        echo ""
        
        echo "=== Логи с ошибками ==="
        for service in agb_frontend_prod agb_backend_prod agb_nginx_prod; do
            if docker ps --format "table {{.Names}}" | grep -q "^$service$"; then
                echo "--- $service ---"
                docker logs "$service" 2>&1 | grep -i "error\|exception\|fatal" | tail -3
                echo ""
            fi
        done
        
    } > "$report_file"
    
    log "✅ Отчет сохранен: $report_file"
}

# Главная функция
main() {
    log "🧪 Начало тестирования развертывания AGB Project"
    echo ""
    
    # Проверяем Docker
    if ! docker info > /dev/null 2>&1; then
        error "Docker не запущен или недоступен"
    fi
    
    # Проверяем контейнеры
    log "=== Проверка контейнеров ==="
    check_container "agb_postgres_prod" "PostgreSQL"
    check_container "agb_backend_prod" "Backend"
    check_container "agb_frontend_prod" "Frontend"
    check_container "agb_nginx_prod" "Nginx"
    echo ""
    
    # Проверяем базу данных
    log "=== Проверка базы данных ==="
    check_database
    echo ""
    
    # Проверяем API
    log "=== Проверка API ==="
    check_api
    echo ""
    
    # Проверяем фронтенд
    log "=== Проверка фронтенда ==="
    check_frontend
    echo ""
    
    # Проверяем логи
    log "=== Проверка логов ==="
    check_logs
    echo ""
    
    # Проверяем производительность
    log "=== Проверка производительности ==="
    check_performance
    echo ""
    
    # Проверяем безопасность
    log "=== Проверка безопасности ==="
    check_security
    echo ""
    
    # Генерируем отчет
    generate_report
    
    log "🎉 Тестирование развертывания завершено успешно!"
    log "🌐 Система доступна по адресу: http://localhost"
    log "📊 API документация: http://localhost:8000/docs"
}

# Запуск
main "$@"
