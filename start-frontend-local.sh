#!/bin/bash

# 🚀 AGB Project - Запуск фронтенда локально
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

echo "🚀 AGB Project - Запуск фронтенда локально"
echo "========================================"

# Переходим в папку фронтенда
cd frontend

# 1. Проверяем Node.js
log_info "Проверяем Node.js..."
if ! command -v node &> /dev/null; then
    log_error "Node.js не найден. Установите Node.js 18+"
    exit 1
fi

node_version=$(node --version)
log_success "Node.js: $node_version"

# 2. Проверяем npm
log_info "Проверяем npm..."
if ! command -v npm &> /dev/null; then
    log_error "npm не найден. Установите npm"
    exit 1
fi

npm_version=$(npm --version)
log_success "npm: $npm_version"

# 3. Устанавливаем зависимости
log_info "Устанавливаем зависимости..."
npm install

# 4. Проверяем подключение к бекенду
log_info "Проверяем подключение к бекенду..."
if curl -f http://localhost:8000/api/health > /dev/null 2>&1; then
    log_success "Бекенд доступен на http://localhost:8000"
else
    log_warning "Бекенд недоступен. Запустите: ./start-backend-local.sh"
fi

# 5. Настраиваем переменные окружения
log_info "Настраиваем переменные окружения..."
export NEXT_PUBLIC_API_URL=http://localhost:8000/api

# 6. Запускаем фронтенд
log_info "Запускаем фронтенд в режиме разработки..."
log_success "Фронтенд запускается на http://localhost:3000"
echo ""
echo "🔧 Для остановки нажмите Ctrl+C"
echo ""

# Запускаем Next.js в режиме разработки
npm run dev
