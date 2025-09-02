#!/bin/bash

# Скрипт проверки системы перед развертыванием

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

echo ""
info "🔍 Проверка системы перед развертыванием AGB"
echo "=========================================="
echo ""

# Проверка ОС
info "1. Проверка операционной системы..."
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    success "✅ Linux система обнаружена"
    echo "   Дистрибутив: $(lsb_release -d | cut -f2)"
    echo "   Ядро: $(uname -r)"
else
    error "❌ Скрипт предназначен только для Linux систем"
    exit 1
fi

echo ""

# Проверка Docker
info "2. Проверка Docker..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    success "✅ Docker установлен: $DOCKER_VERSION"

    # Проверка статуса Docker
    if docker info &> /dev/null; then
        success "✅ Docker работает"
    else
        error "❌ Docker не запущен. Запустите: sudo systemctl start docker"
        exit 1
    fi
else
    error "❌ Docker не установлен"
    echo "   Установите Docker:"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh"
    exit 1
fi

echo ""

# Проверка Docker Compose
info "3. Проверка Docker Compose..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    success "✅ Docker Compose установлен: $COMPOSE_VERSION"
else
    error "❌ Docker Compose не установлен"
    echo "   Установите Docker Compose:"
    echo "   sudo curl -L \"https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "   sudo chmod +x /usr/local/bin/docker-compose"
    exit 1
fi

echo ""

# Проверка прав пользователя
info "4. Проверка прав пользователя..."
if groups $USER | grep -q docker; then
    success "✅ Пользователь $USER в группе docker"
else
    warning "⚠️ Пользователь $USER не в группе docker"
    echo "   Добавьте пользователя в группу:"
    echo "   sudo usermod -aG docker $USER"
    echo "   После этого перезайдите в систему"
fi

echo ""

# Проверка доступного места
info "5. Проверка доступного места на диске..."
DISK_SPACE=$(df / | tail -1 | awk '{print $4}')
DISK_SPACE_GB=$((DISK_SPACE / 1024 / 1024))

if [ $DISK_SPACE_GB -gt 10 ]; then
    success "✅ Доступно места: ${DISK_SPACE_GB}GB"
else
    warning "⚠️ Мало места на диске: ${DISK_SPACE_GB}GB"
    echo "   Рекомендуется минимум 20GB свободного места"
fi

echo ""

# Проверка памяти
info "6. Проверка оперативной памяти..."
MEM_TOTAL=$(free -m | grep '^Mem:' | awk '{print $2}')
MEM_AVAILABLE=$(free -m | grep '^Mem:' | awk '{print $7}')

if [ $MEM_TOTAL -gt 4000 ]; then
    success "✅ Память: ${MEM_TOTAL}MB total, ${MEM_AVAILABLE}MB available"
else
    warning "⚠️ Мало оперативной памяти: ${MEM_TOTAL}MB"
    echo "   Рекомендуется минимум 4GB RAM"
fi

echo ""

# Проверка портов
info "7. Проверка доступности портов..."
PORTS=(80 3000 8000 5432)

for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        warning "⚠️ Порт $port занят"
        PROCESS=$(lsof -Pi :$port -sTCP:LISTEN | tail -1 | awk '{print $1}')
        echo "   Процесс: $PROCESS"
    else
        success "✅ Порт $port свободен"
    fi
done

echo ""

# Проверка необходимых файлов
info "8. Проверка необходимых файлов..."
FILES=("docker-compose.prod.yml" "production.env.example" "deploy.sh")

for file in "${FILES[@]}"; do
    if [[ -f "$file" ]]; then
        success "✅ $file найден"
    else
        error "❌ $file не найден"
    fi
done

echo ""

# Финальные рекомендации
info "9. Рекомендации:"

if [[ "$OSTYPE" == "linux-gnu"* ]] && command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    success "🎉 Система готова к развертыванию!"
    echo ""
    info "Запустите развертывание:"
    echo "   ./deploy.sh"
else
    error "❌ Исправьте проблемы выше перед развертыванием"
    exit 1
fi

echo ""
info "📋 Быстрые команды:"
echo "   Проверка системы: ./check-system.sh"
echo "   Развертывание:     ./deploy.sh"
echo "   Статус:           ./deploy.sh status"
echo "   Логи:             ./deploy.sh logs"
echo "   Остановка:        ./deploy.sh stop"
