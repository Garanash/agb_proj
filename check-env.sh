#!/bin/bash

# Проверка переменных окружения

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

info "🔍 Проверка переменных окружения..."

echo ""
info "Файл production.env:"
if [[ -f "production.env" ]]; then
    echo "========================================"
    cat production.env | grep -E "(DATABASE_URL|NEXT_PUBLIC_API_URL|POSTGRES_)" | head -10
    echo "========================================"
    success "✅ production.env найден"
else
    error "❌ production.env не найден!"
fi

echo ""
info "Docker Compose конфигурация:"
echo "========================================"
echo "PostgreSQL env_file: $(grep -A2 "postgres:" docker-compose.prod.yml | grep "env_file" | head -1)"
echo "Backend env_file: $(grep -A2 "backend:" docker-compose.prod.yml | grep "env_file" | head -1)"
echo "Frontend env_file: $(grep -A2 "frontend:" docker-compose.prod.yml | grep "env_file" | head -1)"
echo "========================================"

echo ""
info "Проверка переменных в контейнерах:"
if docker ps | grep -q "agb_postgres_prod"; then
    echo "PostgreSQL переменные:"
    docker exec agb_postgres_prod env | grep -E "POSTGRES_" | head -5
else
    warning "PostgreSQL контейнер не запущен"
fi

if docker ps | grep -q "agb_backend_prod"; then
    echo "Backend переменные:"
    docker exec agb_backend_prod env | grep -E "(DATABASE_URL|SECRET_KEY)" | head -5
else
    warning "Backend контейнер не запущен"
fi

if docker ps | grep -q "agb_frontend_prod"; then
    echo "Frontend переменные:"
    docker exec agb_frontend_prod env | grep -E "(NEXT_PUBLIC_API_URL|NODE_ENV)" | head -5
else
    warning "Frontend контейнер не запущен"
fi

echo ""
success "🎉 Проверка завершена!"
