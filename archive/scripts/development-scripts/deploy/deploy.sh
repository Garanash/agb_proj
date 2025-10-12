#!/bin/bash

# Единый скрипт деплоя для Linux сервера
# Автоматически собирает и запускает весь проект без ошибок

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для вывода
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Проверка ОС
check_os() {
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        error "Этот скрипт предназначен только для Linux систем!"
        exit 1
    fi
    success "Операционная система: $(uname -a)"
}

# Проверка Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker не установлен! Установите Docker и Docker Compose"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose не установлен! Установите Docker Compose"
        exit 1
    fi

    success "Docker версия: $(docker --version)"
    success "Docker Compose версия: $(docker-compose --version)"
}

# Создание production.env
setup_env() {
    if [[ ! -f "production.env" ]]; then
        info "Создание production.env файла..."
        if [[ ! -f "production.env.example" ]]; then
            error "production.env.example не найден!"
            exit 1
        fi

        cp production.env.example production.env

        # Настройка переменных для Linux с правильными путями
        sed -i 's|CHANGE_THIS_SECURE_DB_PASSWORD_2024|agb_prod_password_2024|g' production.env
        sed -i 's|CHANGE_THIS_SUPER_SECRET_KEY_IN_PRODUCTION_2024_MIN_32_CHARS_LONG|agb_production_secret_key_2024_secure_32_chars|g' production.env
        sed -i 's|CHANGE_THIS_ADMIN_PASSWORD_IMMEDIATELY_2024|admin_secure_2024|g' production.env
        sed -i 's|postgresql+asyncpg://felix_prod_user:CHANGE_THIS_SECURE_DB_PASSWORD_2024@postgres:5432/agb_felix_prod|postgresql+asyncpg://felix_prod_user:agb_prod_password_2024@postgres:5432/agb_felix_prod|g' production.env
        sed -i 's|http://localhost/api|http://localhost/api|g' production.env

        # Установка правильных путей для Linux
        echo "" >> production.env
        echo "# Linux specific paths" >> production.env
        echo "UPLOAD_DIR=/app/uploads" >> production.env
        echo "STATIC_DIR=/app/static" >> production.env

        success "production.env создан и настроен для Linux"
    else
        success "production.env уже существует"
    fi
}

# Создание необходимых директорий
create_directories() {
    info "Создание необходимых директорий..."
    mkdir -p uploads/documents uploads/portfolio uploads/profiles ssl backups
    chmod -R 755 uploads ssl backups
    success "Директории созданы"
}

# Очистка Docker
cleanup_docker() {
    info "Очистка Docker..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.prod.offline.yml down --remove-orphans 2>/dev/null || true
    docker system prune -af --volumes 2>/dev/null || true
    docker builder prune -af 2>/dev/null || true
    success "Docker очищен"
}

# Проверка авторизации Docker Hub
check_docker_auth() {
    if ! docker info | grep -q "Username:"; then
        warning "Вы не авторизованы в Docker Hub"
        warning "Рекомендуется авторизоваться для избежания лимитов:"
        echo "  docker login"
        echo ""
        info "Продолжаем с offline конфигурацией..."
        COMPOSE_FILE="docker-compose.prod.offline.yml"
    else
        USERNAME=$(docker info | grep "Username:" | awk '{print $2}')
        success "Авторизованы в Docker Hub как: $USERNAME"
        COMPOSE_FILE="docker-compose.prod.yml"
    fi
}

# Сборка и запуск
build_and_run() {
    info "Сборка и запуск сервисов..."
    info "Используется конфигурация: $COMPOSE_FILE"

    # Сборка образов
    info "Сборка Docker образов..."
    docker-compose -f $COMPOSE_FILE build --no-cache

    # Запуск сервисов
    info "Запуск сервисов..."
    docker-compose -f $COMPOSE_FILE up -d

    # Ожидание запуска
    info "Ожидание запуска сервисов (60 секунд)..."
    sleep 60
}

# Проверка статуса
check_status() {
    info "Проверка статуса сервисов..."
    echo ""
    docker-compose -f $COMPOSE_FILE ps

    echo ""
    info "Проверка доступности:"

    # Проверка Nginx
    if curl -f http://localhost >/dev/null 2>&1; then
        success "✅ Nginx доступен на порту 80"
    else
        warning "⚠️ Nginx недоступен на порту 80"
    fi

    # Проверка фронтенда
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        success "✅ Фронтенд доступен на порту 3000"
    else
        warning "⚠️ Фронтенд недоступен на порту 3000"
    fi

    # Проверка бекенда
    if curl -f http://localhost:8000/api/health >/dev/null 2>&1; then
        success "✅ Бекенд доступен на порту 8000"
    else
        warning "⚠️ Бекенд недоступен на порту 8000"
    fi
}

# Показать информацию о развертывании
show_info() {
    echo ""
    success "🎉 Развертывание завершено!"
    echo ""
    info "🌐 Доступ к приложению:"
    echo "  Основной сайт:     http://localhost"
    echo "  Фронтенд:         http://localhost:3000"
    echo "  API бекенда:      http://localhost:8000"
    echo "  Документация API: http://localhost:8000/docs"
    echo ""
    info "🔧 Управление сервисами:"
    echo "  Просмотр логов:   docker-compose -f $COMPOSE_FILE logs -f"
    echo "  Остановить:       docker-compose -f $COMPOSE_FILE down"
    echo "  Перезапустить:    docker-compose -f $COMPOSE_FILE restart"
    echo ""
    info "📊 Мониторинг:"
    echo "  Статус:           docker-compose -f $COMPOSE_FILE ps"
    echo "  Использование:    docker stats"
    echo ""
    info "🔐 Админ доступ:"
    echo "  Логин: admin"
    echo "  Пароль: admin_secure_2024"
    echo "  (Измените пароль после первого входа!)"
}

# Основная функция
main() {
    echo ""
    info "🚀 Начинаем развертывание AGB проекта на Linux сервере"
    echo "=================================================="
    echo ""

    # Проверки
    check_os
    check_docker

    # Подготовка
    setup_env
    create_directories

    # Очистка и авторизация
    cleanup_docker
    check_docker_auth

    # Развертывание
    build_and_run
    check_status

    # Информация
    show_info

    echo ""
    success "🎊 Проект успешно развернут и готов к работе!"
    echo ""
}

# Обработка аргументов
case "${1:-}" in
    "cleanup")
        info "Только очистка Docker..."
        cleanup_docker
        success "Очистка завершена"
        ;;
    "status")
        if [[ -f "production.env" ]]; then
            COMPOSE_FILE="docker-compose.prod.yml"
            check_status
        else
            error "production.env не найден. Сначала запустите развертывание"
        fi
        ;;
    "logs")
        if [[ -f "production.env" ]]; then
            COMPOSE_FILE="docker-compose.prod.yml"
            info "Просмотр логов всех сервисов..."
            docker-compose -f $COMPOSE_FILE logs -f
        else
            error "production.env не найден. Сначала запустите развертывание"
        fi
        ;;
    "stop")
        info "Остановка всех сервисов..."
        docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
        docker-compose -f docker-compose.prod.offline.yml down 2>/dev/null || true
        success "Сервисы остановлены"
        ;;
    *)
        main
        ;;
esac