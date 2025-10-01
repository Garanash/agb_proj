#!/bin/bash

# 🔍 AGB Project - Диагностика проблем на сервере
# Автор: AI Assistant
# Версия: 1.0

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "🔍 AGB Project - Диагностика сервера"
echo "===================================="
echo ""

# Проверка системных ресурсов
check_system_resources() {
    log_info "Проверяем системные ресурсы..."
    
    echo "💾 Память:"
    free -h
    echo ""
    
    echo "💿 Диск:"
    df -h
    echo ""
    
    echo "⚡ CPU:"
    top -bn1 | head -20
    echo ""
    
    # Проверяем доступное место на диске
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE_SPACE" -lt 2000000 ]; then  # Меньше 2GB
        log_warning "Мало свободного места на диске: ${AVAILABLE_SPACE}KB"
    else
        log_success "Достаточно места на диске: ${AVAILABLE_SPACE}KB"
    fi
}

# Проверка Docker
check_docker_status() {
    log_info "Проверяем статус Docker..."
    
    if ! systemctl is-active --quiet docker; then
        log_error "Docker не запущен!"
        return 1
    fi
    
    log_success "Docker запущен"
    
    echo "📊 Статус контейнеров:"
    docker ps -a
    echo ""
    
    echo "📈 Использование ресурсов Docker:"
    docker system df
    echo ""
}

# Проверка логов контейнеров
check_container_logs() {
    log_info "Проверяем логи контейнеров..."
    
    # Проверяем логи каждого контейнера
    for container in $(docker ps -a --format "{{.Names}}"); do
        echo "📋 Логи контейнера: $container"
        echo "----------------------------------------"
        docker logs --tail=20 "$container" 2>&1 | head -10
        echo ""
    done
}

# Проверка health checks
check_health_checks() {
    log_info "Проверяем health checks..."
    
    # Проверяем каждый сервис
    services=("postgres" "redis" "backend" "frontend" "nginx")
    
    for service in "${services[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "$service"; then
            health_status=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null || echo "no-health-check")
            if [ "$health_status" = "healthy" ]; then
                log_success "$service: ✅ Здоров"
            elif [ "$health_status" = "unhealthy" ]; then
                log_error "$service: ❌ Нездоров"
            else
                log_warning "$service: ⚠️  Без health check или неизвестный статус"
            fi
        else
            log_warning "$service: ⚠️  Не запущен"
        fi
    done
}

# Проверка портов
check_ports() {
    log_info "Проверяем открытые порты..."
    
    echo "🌐 Открытые порты:"
    netstat -tlnp | grep -E ':(80|443|3000|8000|5432|6379|5678)' || echo "Нет открытых портов"
    echo ""
}

# Проверка конфигурации
check_configuration() {
    log_info "Проверяем конфигурацию..."
    
    if [ ! -f "config/env/production.env" ]; then
        log_error "Файл config/env/production.env не найден!"
        return 1
    fi
    
    log_success "Конфигурация найдена"
    
    # Проверяем основные переменные
    echo "🔧 Основные настройки:"
    grep -E "^(POSTGRES_|SECRET_KEY|ADMIN_|DOMAIN)" config/env/production.env | head -10
    echo ""
}

# Рекомендации по исправлению
show_recommendations() {
    echo ""
    echo "💡 РЕКОМЕНДАЦИИ ПО ИСПРАВЛЕНИЮ:"
    echo "================================"
    echo ""
    echo "1. 🔧 Если не хватает памяти:"
    echo "   - Увеличьте swap: sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile"
    echo "   - Остановите ненужные сервисы: sudo systemctl stop n8n (если не нужен)"
    echo ""
    echo "2. 🐳 Если проблемы с Docker:"
    echo "   - Очистите Docker: docker system prune -a -f"
    echo "   - Перезапустите Docker: sudo systemctl restart docker"
    echo ""
    echo "3. 📦 Если проблемы со сборкой:"
    echo "   - Соберите по одному сервису: docker-compose build postgres"
    echo "   - Проверьте логи сборки: docker-compose build --no-cache 2>&1 | tee build.log"
    echo ""
    echo "4. 🚀 Безопасный запуск:"
    echo "   - Запустите в фоне: nohup ./deploy-server.sh > deploy.log 2>&1 &"
    echo "   - Или используйте screen: screen -S deploy ./deploy-server.sh"
    echo ""
    echo "5. 🔍 Мониторинг:"
    echo "   - Следите за логами: docker-compose logs -f"
    echo "   - Проверяйте ресурсы: htop"
    echo ""
}

# Основная функция
main() {
    check_system_resources
    check_docker_status
    check_container_logs
    check_health_checks
    check_ports
    check_configuration
    show_recommendations
    
    echo ""
    log_info "Диагностика завершена. Проверьте рекомендации выше."
}

# Запуск
main "$@"
