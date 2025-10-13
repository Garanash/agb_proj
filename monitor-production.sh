#!/bin/bash

# 📊 AGB Project - Мониторинг продакшн среды
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

echo "📊 AGB Project - Мониторинг продакшн среды"
echo "======================================="

# Получаем IP сервера
SERVER_IP=$(curl -s -4 ifconfig.me || curl -s -4 ipinfo.io/ip || curl -s -4 icanhazip.com || echo "localhost")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
log_info "Статус контейнеров"
echo "------------------"

# Показываем статус всех контейнеров
docker-compose -f config/docker/docker-compose.prod.yml ps

echo ""
log_info "Использование ресурсов"
echo "----------------------"

# Показываем использование ресурсов
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

echo ""
log_info "Проверка доступности сервисов"
echo "-------------------------------"

# Проверяем доступность сервисов
check_service() {
    local url=$1
    local service=$2
    local response_time=$(curl -s -o /dev/null -w "%{time_total}" --connect-timeout 10 "$url" 2>/dev/null || echo "timeout")
    
    if [ "$response_time" != "timeout" ]; then
        log_success "$service доступен (${response_time}s): $url"
    else
        log_error "$service недоступен: $url"
    fi
}

check_service "http://$SERVER_IP" "Frontend (через nginx)"
check_service "http://$SERVER_IP:8000/docs" "Backend API"
check_service "http://$SERVER_IP/api/health" "Backend Health"

echo ""
log_info "Проверка портов"
echo "---------------"

# Проверяем открытые порты
check_port() {
    local port=$1
    local service=$2
    if ss -tuln | grep -q ":$port " || lsof -i :$port >/dev/null 2>&1; then
        log_success "Порт $port ($service) - открыт"
    else
        log_error "Порт $port ($service) - закрыт"
    fi
}

check_port 80 "Nginx"
check_port 443 "Nginx SSL"
check_port 8000 "Backend"
check_port 3000 "Frontend"

echo ""
log_info "Логи ошибок (последние 10 строк)"
echo "--------------------------------"

# Показываем последние ошибки из логов
echo "Backend ошибки:"
docker-compose -f config/docker/docker-compose.prod.yml logs --tail=10 backend 2>/dev/null | grep -i error || echo "Ошибок не найдено"

echo ""
echo "Frontend ошибки:"
docker-compose -f config/docker/docker-compose.prod.yml logs --tail=10 frontend 2>/dev/null | grep -i error || echo "Ошибок не найдено"

echo ""
echo "Nginx ошибки:"
docker-compose -f config/docker/docker-compose.prod.yml logs --tail=10 nginx 2>/dev/null | grep -i error || echo "Ошибок не найдено"

echo ""
log_info "Информация о системе"
echo "-------------------"

# Показываем информацию о системе
echo "💾 Использование диска:"
df -h | grep -E "(Filesystem|/dev/)"

echo ""
echo "🧠 Использование памяти:"
free -h

echo ""
echo "⚡ Загрузка системы:"
uptime

echo ""
log_info "Быстрые команды"
echo "--------------"

echo "• Перезапустить все сервисы: docker-compose -f config/docker/docker-compose.prod.yml restart"
echo "• Перезапустить backend: docker-compose -f config/docker/docker-compose.prod.yml restart backend"
echo "• Перезапустить frontend: docker-compose -f config/docker/docker-compose.prod.yml restart frontend"
echo "• Перезапустить nginx: docker-compose -f config/docker/docker-compose.prod.yml restart nginx"
echo "• Посмотреть логи: docker-compose -f config/docker/docker-compose.prod.yml logs -f"
echo "• Остановить все: docker-compose -f config/docker/docker-compose.prod.yml down"
echo "• Обновить и перезапустить: docker-compose -f config/docker/docker-compose.prod.yml pull && docker-compose -f config/docker/docker-compose.prod.yml up -d"
