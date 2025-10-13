#!/bin/bash

# 🚀 AGB Project - Полный скрипт развертывания на сервере
# Автор: AI Assistant
# Версия: 2.0

set -e  # Остановка при ошибке

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

# Проверка прав root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Этот скрипт должен быть запущен с правами root"
        exit 1
    fi
}

# Проверка Docker
check_docker() {
    log_info "Проверяем Docker..."
    if ! command -v docker &> /dev/null; then
        log_info "Устанавливаем Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        systemctl start docker
        systemctl enable docker
        rm get-docker.sh
        log_success "Docker установлен"
    else
        log_success "Docker уже установлен"
    fi
}

# Проверка Docker Compose
check_docker_compose() {
    log_info "Проверяем Docker Compose..."
    if ! command -v docker-compose &> /dev/null; then
        log_info "Устанавливаем Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
        ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
        log_success "Docker Compose установлен"
    else
        log_success "Docker Compose уже установлен"
    fi
}

# Создание production.env
create_production_env() {
    log_info "Создаем конфигурацию production.env..."
    
    # Генерируем случайные пароли
    POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    SECRET_KEY=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)
    N8N_DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    N8N_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)
    
    cat > config/env/production.env << EOF
# База данных
POSTGRES_DB=agb_felix_prod
POSTGRES_USER=felix_prod_user
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# URL базы данных
DATABASE_URL=postgresql://felix_prod_user:${POSTGRES_PASSWORD}@postgres:5432/agb_felix_prod

# Безопасность
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Администратор
ADMIN_USERNAME=admin
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_EMAIL=admin@localhost
ADMIN_FIRST_NAME=Администратор
ADMIN_LAST_NAME=Системы

# API ключи (ЗАМЕНИТЕ НА ВАШИ!)
OPENAI_API_KEY=your_openai_key_here
POLZA_API_KEY=your_polza_key_here

# Фронтенд
NEXT_PUBLIC_API_URL=http://localhost/api

# N8N
N8N_DB_NAME=n8n_prod
N8N_DB_USER=n8n_prod_user
N8N_DB_PASSWORD=${N8N_DB_PASSWORD}
N8N_USER=admin
N8N_PASSWORD=${N8N_PASSWORD}
N8N_HOST=localhost
N8N_PROTOCOL=http
N8N_WEBHOOK_URL=http://localhost:5678
N8N_LOG_LEVEL=info

# Nginx
NGINX_PORT=80
NGINX_SSL_PORT=443

# Домен
DOMAIN=localhost
FRONTEND_URL=http://localhost
BACKEND_URL=http://localhost/api

# SSL
SSL_EMAIL=admin@localhost
EOF

    log_success "Конфигурация создана в config/env/production.env"
    log_warning "НЕ ЗАБУДЬТЕ заменить API ключи в config/env/production.env!"
}

# Исправление OCR Dockerfile
fix_ocr_dockerfile() {
    log_info "Исправляем OCR Dockerfile..."
    
    cat > infrastructure/ocr/Dockerfile << 'EOF'
FROM python:3.11-slim

# Устанавливаем только необходимые зависимости
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-rus \
    tesseract-ocr-eng \
    libtesseract-dev \
    libglib2.0-0 \
    libgomp1 \
    libgcc-s1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем Python зависимости
COPY requirements.txt /app/
WORKDIR /app
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код приложения
COPY . /app/

# Создаем директории для загрузок
RUN mkdir -p /app/uploads/ai_processing

# Устанавливаем переменные окружения
ENV PYTHONPATH=/app
ENV TESSDATA_PREFIX=/usr/share/tesseract-ocr/4.00/tessdata

# Открываем порт
EXPOSE 8001

# Запускаем приложение
CMD ["python", "main.py"]
EOF

    log_success "OCR Dockerfile исправлен"
}

# Очистка старых контейнеров
cleanup_old_containers() {
    log_info "Очищаем старые контейнеры..."
    docker-compose down -v 2>/dev/null || true
    docker system prune -f
    log_success "Очистка завершена"
}

# Сборка и запуск
build_and_deploy() {
    log_info "Собираем и запускаем проект..."
    
    # Сборка образов
    log_info "Сборка Docker образов..."
    docker-compose build --no-cache
    
    # Запуск сервисов
    log_info "Запуск сервисов..."
    docker-compose up -d
    
    log_success "Проект запущен!"
}

# Проверка статуса
check_status() {
    log_info "Проверяем статус сервисов..."
    
    echo "📊 Статус контейнеров:"
    docker-compose ps
    
    echo ""
    echo "🔍 Проверка доступности сервисов:"
    
    # Проверка PostgreSQL
    if docker-compose exec -T postgres pg_isready -U felix_prod_user -d agb_felix_prod > /dev/null 2>&1; then
        log_success "PostgreSQL: ✅ Работает"
    else
        log_warning "PostgreSQL: ⚠️  Недоступен"
    fi
    
    # Проверка Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
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
    echo "   • Статус: docker-compose ps"
    echo "   • Логи: docker-compose logs -f"
    echo "   • Остановка: docker-compose down"
    echo "   • Перезапуск: docker-compose restart"
    echo ""
    echo "⚠️  ВАЖНО:"
    echo "   • Замените API ключи в config/env/production.env"
    echo "   • Настройте SSL для production"
    echo "   • Измените пароли администратора"
    echo ""
}

# Основная функция
main() {
    echo "🚀 AGB Project - Автоматическое развертывание"
    echo "=============================================="
    echo ""
    
    # Проверки
    check_root
    check_docker
    check_docker_compose
    
    # Подготовка
    create_production_env
    fix_ocr_dockerfile
    cleanup_old_containers
    
    # Развертывание
    build_and_deploy
    
    # Ожидание запуска
    log_info "Ожидаем запуска сервисов (60 секунд)..."
    sleep 60
    
    # Проверка
    check_status
    show_access_info
}

# Запуск
main "$@"
