#!/bin/bash

# 🚀 AGB Project - Быстрый запуск продакшн среды
# Автор: AI Assistant
# Версия: 1.0

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

echo "🚀 AGB Project - Быстрый запуск продакшн среды"
echo "============================================="

# Получаем IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
log_info "Шаг 1: Проверка конфигурации"
echo "-----------------------------"

# Проверяем наличие файла конфигурации
if [ ! -f "config/env/production.env" ]; then
    log_error "Файл config/env/production.env не найден!"
    log_info "Запустите сначала: ./setup-production.sh"
    exit 1
fi

log_success "Конфигурация найдена"

echo ""
log_info "Шаг 2: Остановка существующих сервисов"
echo "---------------------------------------"

# Останавливаем все контейнеры
log_info "Остановка контейнеров..."
docker-compose -f config/docker/docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

echo ""
log_info "Шаг 3: Запуск всех сервисов"
echo "----------------------------"

# Запускаем все сервисы
log_info "Запуск всех сервисов..."
docker-compose -f config/docker/docker-compose.prod.yml up -d

echo ""
log_info "Шаг 4: Ожидание готовности сервисов"
echo "------------------------------------"

# Ждем готовности сервисов
log_info "Ожидание готовности сервисов (180 секунд)..."
sleep 180

echo ""
log_info "Шаг 5: Проверка статуса"
echo "------------------------"

# Проверяем статус контейнеров
docker-compose -f config/docker/docker-compose.prod.yml ps

echo ""
log_info "Шаг 6: Проверка доступности"
echo "---------------------------"

# Проверяем доступность сервисов
check_service() {
    local url=$1
    local service=$2
    if curl -s --connect-timeout 10 "$url" > /dev/null; then
        log_success "$service доступен: $url"
    else
        log_error "$service недоступен: $url"
    fi
}

check_service "http://$SERVER_IP" "Frontend (через nginx)"
check_service "http://$SERVER_IP:8000/docs" "Backend API"
check_service "http://$SERVER_IP/api/health" "Backend Health"

echo ""
log_success "🎉 Продакшн среда запущена!"
echo ""
echo "📋 Доступные сервисы:"
echo "• Главная страница: http://$SERVER_IP"
echo "• Backend API: http://$SERVER_IP:8000"
echo "• Swagger UI: http://$SERVER_IP:8000/docs"
echo "• Health Check: http://$SERVER_IP/api/health"
echo ""
echo "📋 Учетные данные администратора:"
echo "• Логин: admin"
echo "• Пароль: $(grep ADMIN_PASSWORD config/env/production.env | cut -d'=' -f2)"
echo ""
echo "🔧 Полезные команды:"
echo "• Логи всех сервисов: docker-compose -f config/docker/docker-compose.prod.yml logs -f"
echo "• Логи backend: docker-compose -f config/docker/docker-compose.prod.yml logs -f backend"
echo "• Логи frontend: docker-compose -f config/docker/docker-compose.prod.yml logs -f frontend"
echo "• Логи nginx: docker-compose -f config/docker/docker-compose.prod.yml logs -f nginx"
echo "• Перезапуск сервиса: docker-compose -f config/docker/docker-compose.prod.yml restart [service_name]"
echo "• Остановка: docker-compose -f config/docker/docker-compose.prod.yml down"
