#!/bin/bash

# 🚀 AGB Project - Запуск бекенда локально
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

echo "🚀 AGB Project - Запуск бекенда локально"
echo "======================================"

# Переходим в папку бекенда
cd backend

# 1. Проверяем Python
log_info "Проверяем Python..."
if ! command -v python3 &> /dev/null; then
    log_error "Python3 не найден. Установите Python 3.8+"
    exit 1
fi

python_version=$(python3 --version)
log_success "Python: $python_version"

# 2. Проверяем pip
log_info "Проверяем pip..."
if ! command -v pip3 &> /dev/null; then
    log_error "pip3 не найден. Установите pip"
    exit 1
fi

# 3. Создаем виртуальное окружение если его нет
if [ ! -d "venv" ]; then
    log_info "Создаем виртуальное окружение..."
    python3 -m venv venv
    log_success "Виртуальное окружение создано"
fi

# 4. Активируем виртуальное окружение
log_info "Активируем виртуальное окружение..."
source venv/bin/activate

# 5. Обновляем pip
log_info "Обновляем pip..."
pip install --upgrade pip

# 6. Устанавливаем зависимости
log_info "Устанавливаем зависимости..."
pip install -r requirements.txt

# 7. Проверяем подключение к БД
log_info "Проверяем подключение к PostgreSQL..."
if docker ps | grep -q "agb_postgres_local"; then
    log_success "PostgreSQL контейнер запущен"
else
    log_warning "PostgreSQL контейнер не запущен. Запустите: ./start-local-dev.sh"
fi

# 8. Запускаем бекенд
log_info "Запускаем бекенд..."
log_info "Используем переменные окружения из config/env/local.env"

# Загружаем переменные окружения
export $(cat ../config/env/local.env | grep -v '^#' | xargs)

log_success "Бекенд запускается на http://localhost:8000"
echo ""
echo "🔧 Для остановки нажмите Ctrl+C"
echo ""

# Запускаем FastAPI
python main.py
