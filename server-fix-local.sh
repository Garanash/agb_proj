#!/bin/bash

# Скрипт для исправления проблем на сервере (запуск непосредственно на сервере)
# Исправляет все проблемы с местом на диске и запускает систему

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функции для логирования
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

log "🚀 Запуск исправления проблем на сервере..."

# Проверяем, что мы в правильной директории
if [[ ! -f "docker-compose.prod.yml" ]]; then
    error "Файл docker-compose.prod.yml не найден!"
    error "Убедитесь, что вы находитесь в директории проекта (/root/agb_proj)"
    exit 1
fi

log "✅ Находимся в правильной директории"

# Останавливаем все контейнеры
info "Останавливаем все контейнеры..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Очищаем Docker кэш и неиспользуемые ресурсы
info "Очищаем Docker кэш и неиспользуемые ресурсы..."
docker system prune -a -f --volumes

# Очищаем системные кэши
info "Очищаем системные кэши apt..."
apt-get clean && apt-get autoremove -y

# Очищаем логи
info "Очищаем логи..."
journalctl --vacuum-time=1d

# Проверяем доступное место на диске
info "Проверяем доступное место на диске..."
df -h

# Создаем необходимые директории
info "Создаем необходимые директории..."
mkdir -p uploads ssl backups
chown -R 1000:1000 uploads ssl backups

# Создаем production.env если его нет
if [[ ! -f "production.env" ]]; then
    warning "Файл production.env не найден! Создаем из примера..."
    if [[ -f "production.env.example" ]]; then
        cp production.env.example production.env
        warning "ВАЖНО: Отредактируйте файл production.env и измените пароли!"
        warning "Особенно измените:"
        warning "  - POSTGRES_PASSWORD"
        warning "  - SECRET_KEY"
        warning "  - ADMIN_PASSWORD"
        warning "  - DATABASE_URL"
        warning "  - NEXT_PUBLIC_API_URL"
        
        # Устанавливаем базовые значения для тестирования
        sed -i 's/CHANGE_THIS_SECURE_DB_PASSWORD_2024/felix_password_secure_2024/g' production.env
        sed -i 's/CHANGE_THIS_SUPER_SECRET_KEY_IN_PRODUCTION_2024_MIN_32_CHARS_LONG/your_super_secret_key_here_32_chars_long_2024/g' production.env
        sed -i 's/CHANGE_THIS_ADMIN_PASSWORD_IMMEDIATELY_2024/admin_password_2024/g' production.env
        sed -i 's|postgresql+asyncpg://felix_prod_user:CHANGE_THIS_SECURE_DB_PASSWORD_2024@postgres:5432/agb_felix_prod|postgresql+asyncpg://felix_prod_user:felix_password_secure_2024@postgres:5432/agb_felix_prod|g' production.env
        sed -i 's|http://localhost/api|http://localhost/api|g' production.env
        
        success "Файл production.env создан с базовыми значениями"
    else
        error "Файл production.env.example не найден!"
        exit 1
    fi
fi

# Запускаем контейнеры
info "Запускаем контейнеры..."
docker-compose -f docker-compose.prod.yml up -d --build

# Ждем запуска сервисов
info "Ждем запуска сервисов..."
sleep 30

# Исправляем права доступа для Docker volumes
info "Исправляем права доступа для Docker volumes..."
docker-compose -f docker-compose.prod.yml exec -T backend chown -R 1000:1000 /app/uploads 2>/dev/null || true
docker-compose -f docker-compose.prod.yml exec -T postgres chown -R 999:999 /var/lib/postgresql/data 2>/dev/null || true

# Проверяем статус сервисов
info "Проверяем статус сервисов..."
docker-compose -f docker-compose.prod.yml ps

log "🎉 Исправление всех проблем завершено!"
info "Проверьте доступность приложения:"
info "  - Фронтенд: http://localhost:3000"
info "  - Бекенд: http://localhost:8000"
info "  - Nginx: http://localhost"
echo ""
info "Полезные команды для мониторинга:"
info "  - Логи: docker-compose -f docker-compose.prod.yml logs -f"
info "  - Статус: docker-compose -f docker-compose.prod.yml ps"
info "  - Перезапуск: docker-compose -f docker-compose.prod.yml restart"
