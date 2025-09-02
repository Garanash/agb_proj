#!/bin/bash

# Полный скрипт исправления проблем на сервере
# Решает все проблемы: место на диске, переменные окружения, сборка фронтенда

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

# Проверяем, что мы в правильной директории
if [[ ! -f "docker-compose.prod.yml" ]]; then
    error "Файл docker-compose.prod.yml не найден!"
    error "Убедитесь, что вы находитесь в корневой директории проекта"
    exit 1
fi

info "🚀 Начинаем полное исправление проблем на сервере..."

# 1. Останавливаем все контейнеры
info "1. Останавливаем все контейнеры..."
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# 2. Очищаем Docker систему
info "2. Очищаем Docker систему..."
docker system prune -af --volumes 2>/dev/null || true
docker builder prune -af 2>/dev/null || true

# 3. Очищаем системные пакеты
info "3. Очищаем системные пакеты..."
apt-get clean 2>/dev/null || true
apt-get autoremove -y 2>/dev/null || true
apt-get autoclean 2>/dev/null || true

# 4. Очищаем логи
info "4. Очищаем логи..."
find /var/log -type f -name "*.log" -exec truncate -s 0 {} \; 2>/dev/null || true
find /var/log -type f -name "*.gz" -delete 2>/dev/null || true
journalctl --vacuum-time=1d 2>/dev/null || true

# 5. Проверяем свободное место
info "5. Проверяем свободное место на диске..."
df -h

# 6. Создаем production.env если его нет
info "6. Настраиваем переменные окружения..."
if [[ ! -f "production.env" ]]; then
    warning "Файл production.env не найден! Создаем из примера..."
    if [[ -f "production.env.example" ]]; then
        cp production.env.example production.env
        
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
else
    success "Файл production.env уже существует"
fi

# 7. Создаем необходимые директории
info "7. Создаем необходимые директории..."
mkdir -p uploads/documents uploads/portfolio uploads/profiles ssl backups
chown -R 1000:1000 uploads ssl backups 2>/dev/null || true

# 8. Запускаем контейнеры с пересборкой
info "8. Запускаем контейнеры с пересборкой..."
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate

# 9. Ждем запуска сервисов
info "9. Ждем запуска сервисов..."
sleep 45

# 10. Проверяем статус
info "10. Проверяем статус сервисов..."
docker-compose -f docker-compose.prod.yml ps

# 11. Проверяем логи фронтенда
info "11. Проверяем логи фронтенда..."
docker-compose -f docker-compose.prod.yml logs frontend --tail=20

# 12. Проверяем логи бекенда
info "12. Проверяем логи бекенда..."
docker-compose -f docker-compose.prod.yml logs backend --tail=20

# 13. Проверяем доступность сервисов
info "13. Проверяем доступность сервисов..."
sleep 10

# Проверяем фронтенд
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    success "✅ Фронтенд доступен на порту 3000"
else
    warning "⚠️ Фронтенд недоступен на порту 3000"
fi

# Проверяем бекенд
if curl -f http://localhost:8000/api/health >/dev/null 2>&1; then
    success "✅ Бекенд доступен на порту 8000"
else
    warning "⚠️ Бекенд недоступен на порту 8000"
fi

# Проверяем Nginx
if curl -f http://localhost >/dev/null 2>&1; then
    success "✅ Nginx доступен на порту 80"
else
    warning "⚠️ Nginx недоступен на порту 80"
fi

success "🎉 Полное исправление проблем завершено!"
echo ""
info "📋 Полезные команды для мониторинга:"
info "  - Статус: docker-compose -f docker-compose.prod.yml ps"
info "  - Логи: docker-compose -f docker-compose.prod.yml logs -f"
info "  - Перезапуск: docker-compose -f docker-compose.prod.yml restart"
info "  - Остановка: docker-compose -f docker-compose.prod.yml down"
echo ""
info "🌐 Доступ к приложению:"
info "  - Основной сайт: http://localhost"
info "  - Фронтенд: http://localhost:3000"
info "  - Бекенд API: http://localhost:8000"
