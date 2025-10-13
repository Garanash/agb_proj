#!/bin/bash

# 🚀 AGB Project - Безопасное развертывание на сервере
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

# Проверка системных ресурсов
check_resources() {
    log_info "Проверяем системные ресурсы..."
    
    # Проверяем доступную память
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$AVAILABLE_MEMORY" -lt 2048 ]; then
        log_warning "Доступно только ${AVAILABLE_MEMORY}MB памяти. Рекомендуется минимум 2GB."
        read -p "Продолжить? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Доступно ${AVAILABLE_MEMORY}MB памяти"
    fi
    
    # Проверяем свободное место на диске
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE_SPACE" -lt 2000000 ]; then
        log_warning "Мало свободного места на диске: ${AVAILABLE_SPACE}KB"
        read -p "Продолжить? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        log_success "Достаточно места на диске: ${AVAILABLE_SPACE}KB"
    fi
}

# Очистка системы
cleanup_system() {
    log_info "Очищаем систему..."
    
    # Останавливаем старые контейнеры
    docker-compose down -v 2>/dev/null || true
    
    # Очищаем Docker
    docker system prune -f
    
    # Очищаем неиспользуемые образы
    docker image prune -f
    
    log_success "Очистка завершена"
}

# Создание swap файла если нужно
create_swap() {
    if [ ! -f /swapfile ]; then
        log_info "Создаем swap файл..."
        sudo fallocate -l 2G /swapfile
        sudo chmod 600 /swapfile
        sudo mkswap /swapfile
        sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
        log_success "Swap файл создан"
    else
        log_success "Swap файл уже существует"
    fi
}

# Поэтапная сборка
build_gradually() {
    log_info "Начинаем поэтапную сборку..."
    
    # 1. Сначала база данных
    log_info "Сборка PostgreSQL..."
    docker-compose -f docker-compose.optimized.yml build postgres
    docker-compose -f docker-compose.optimized.yml up -d postgres
    
    # Ждем готовности базы
    log_info "Ожидаем готовности PostgreSQL..."
    sleep 30
    
    # 2. Redis
    log_info "Сборка Redis..."
    docker-compose -f docker-compose.optimized.yml build redis
    docker-compose -f docker-compose.optimized.yml up -d redis
    
    # Ждем готовности Redis
    log_info "Ожидаем готовности Redis..."
    sleep 15
    
    # 3. Backend
    log_info "Сборка Backend..."
    docker-compose -f docker-compose.optimized.yml build backend
    docker-compose -f docker-compose.optimized.yml up -d backend
    
    # Ждем готовности Backend
    log_info "Ожидаем готовности Backend..."
    sleep 60
    
    # 4. Frontend
    log_info "Сборка Frontend..."
    docker-compose -f docker-compose.optimized.yml build frontend
    docker-compose -f docker-compose.optimized.yml up -d frontend
    
    # Ждем готовности Frontend
    log_info "Ожидаем готовности Frontend..."
    sleep 30
    
    # 5. Nginx
    log_info "Сборка Nginx..."
    docker-compose -f docker-compose.optimized.yml build nginx
    docker-compose -f docker-compose.optimized.yml up -d nginx
    
    log_success "Все сервисы запущены!"
}

# Проверка статуса
check_status() {
    log_info "Проверяем статус сервисов..."
    
    echo "📊 Статус контейнеров:"
    docker-compose -f docker-compose.optimized.yml ps
    
    echo ""
    echo "🔍 Проверка доступности сервисов:"
    
    # Проверка PostgreSQL
    if docker-compose -f docker-compose.optimized.yml exec -T postgres pg_isready -U felix_prod_user -d agb_felix_prod > /dev/null 2>&1; then
        log_success "PostgreSQL: ✅ Работает"
    else
        log_warning "PostgreSQL: ⚠️  Недоступен"
    fi
    
    # Проверка Redis
    if docker-compose -f docker-compose.optimized.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis: ✅ Работает"
    else
        log_warning "Redis: ⚠️  Недоступен"
    fi
    
    # Проверка Backend
    if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
        log_success "Backend: ✅ Работает (http://localhost:8000)"
    else
        log_warning "Backend: ⚠️  Недоступен"
    fi
    
    # Проверка Frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend: ✅ Работает (http://localhost:3000)"
    else
        log_warning "Frontend: ⚠️  Недоступен"
    fi
    
    # Проверка Nginx
    if curl -f http://localhost > /dev/null 2>&1; then
        log_success "Nginx: ✅ Работает (http://localhost)"
    else
        log_warning "Nginx: ⚠️  Недоступен"
    fi
}

# Мониторинг ресурсов
monitor_resources() {
    log_info "Мониторинг ресурсов..."
    
    echo "💾 Использование памяти:"
    free -h
    echo ""
    
    echo "💿 Использование диска:"
    df -h
    echo ""
    
    echo "⚡ Загрузка CPU:"
    top -bn1 | head -10
    echo ""
    
    echo "🐳 Docker ресурсы:"
    docker system df
    echo ""
}

# Показать информацию о доступе
show_access_info() {
    echo ""
    echo "🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
    echo "=================================="
    echo ""
    echo "🌐 Доступ к приложению:"
    echo "   • Главная страница: http://localhost"
    echo "   • API: http://localhost/api"
    echo "   • Backend (прямой): http://localhost:8000"
    echo "   • Frontend (прямой): http://localhost:3000"
    echo ""
    echo "👤 Данные для входа:"
    echo "   • Логин: admin"
    echo "   • Пароль: $(grep ADMIN_PASSWORD config/env/production.env | cut -d'=' -f2)"
    echo ""
    echo "🔧 Управление:"
    echo "   • Статус: docker-compose -f docker-compose.optimized.yml ps"
    echo "   • Логи: docker-compose -f docker-compose.optimized.yml logs -f"
    echo "   • Остановка: docker-compose -f docker-compose.optimized.yml down"
    echo "   • Перезапуск: docker-compose -f docker-compose.optimized.yml restart"
    echo ""
    echo "📊 Мониторинг:"
    echo "   • Ресурсы: ./diagnose-server.sh"
    echo "   • Логи в реальном времени: docker-compose -f docker-compose.optimized.yml logs -f"
    echo ""
}

# Основная функция
main() {
    echo "🚀 AGB Project - Безопасное развертывание"
    echo "========================================="
    echo ""
    
    # Проверки
    check_resources
    cleanup_system
    create_swap
    
    # Развертывание
    build_gradually
    
    # Проверка
    check_status
    monitor_resources
    show_access_info
    
    echo ""
    log_info "Развертывание завершено! Используйте 'screen' или 'nohup' для длительных операций."
}

# Запуск
main "$@"
