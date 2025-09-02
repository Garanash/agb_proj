#!/bin/bash

# Скрипт для автоматической авторизации в Docker Hub
# Решает проблему с лимитами Docker Hub

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

info "🐳 Авторизация в Docker Hub..."

# Проверяем, авторизован ли уже пользователь
if docker info | grep -q "Username:"; then
    CURRENT_USER=$(docker info | grep "Username:" | awk '{print $2}')
    success "✅ Уже авторизован как: $CURRENT_USER"
    
    echo ""
    info "Хотите войти под другим пользователем? (y/n)"
    read -r response
    if [[ "$response" != "y" && "$response" != "Y" ]]; then
        info "Используем текущую авторизацию"
        exit 0
    fi
fi

echo ""
info "Для авторизации в Docker Hub нужен аккаунт."
info "Если у вас нет аккаунта, создайте его на: https://hub.docker.com"
echo ""

# Запрашиваем данные для входа
echo -n "Введите ваш Docker Hub username: "
read -r DOCKER_USERNAME

if [[ -z "$DOCKER_USERNAME" ]]; then
    error "Username не может быть пустым!"
    exit 1
fi

echo -n "Введите ваш Docker Hub password: "
read -s DOCKER_PASSWORD
echo ""

if [[ -z "$DOCKER_PASSWORD" ]]; then
    error "Password не может быть пустым!"
    exit 1
fi

# Пытаемся авторизоваться
info "Авторизация в Docker Hub..."
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

if [[ $? -eq 0 ]]; then
    success "✅ Успешная авторизация в Docker Hub!"
    success "Пользователь: $DOCKER_USERNAME"
    
    echo ""
    info "Теперь можете запустить развертывание:"
    echo "  ./fix-docker-limits.sh"
    echo "  или"
    echo "  ./fix-server-complete.sh"
    
    echo ""
    info "Проверка лимитов Docker Hub:"
    curl -I https://registry-1.docker.io/v2/ 2>/dev/null | grep -i "x-ratelimit" || echo "Лимиты не отображаются"
    
else
    error "❌ Ошибка авторизации в Docker Hub!"
    error "Проверьте:"
    error "  1. Правильность username и password"
    error "  2. Интернет соединение"
    error "  3. Существование аккаунта на hub.docker.com"
    
    echo ""
    info "Попробуйте:"
    info "  1. Создать аккаунт на https://hub.docker.com"
    info "  2. Проверить пароль"
    info "  3. Использовать VPN если есть проблемы с доступом"
    
    exit 1
fi

echo ""
success "🎉 Готово! Теперь можете развертывать приложение без ограничений Docker Hub."
