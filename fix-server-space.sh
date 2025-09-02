#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SERVER_IP="37.252.20.46"
SERVER_USER="root"

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

log "🚀 Исправление проблемы с местом на сервере..."

# Проверяем подключение к серверу
log "🔍 Проверка подключения к серверу..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $SERVER_USER@$SERVER_IP "echo 'Подключение успешно'" 2>/dev/null; then
    error "Не удается подключиться к серверу $SERVER_IP"
    exit 1
fi

# Отправляем скрипт очистки на сервер
log "📤 Отправка скрипта очистки на сервер..."
scp cleanup-server.sh $SERVER_USER@$SERVER_IP:/root/

# Выполняем очистку на сервере
log "🧹 Выполнение очистки на сервере..."
ssh $SERVER_USER@$SERVER_IP "chmod +x /root/cleanup-server.sh && /root/cleanup-server.sh"

# Проверяем свободное место после очистки
log "📊 Проверка свободного места после очистки..."
ssh $SERVER_USER@$SERVER_IP "df -h"

# Отправляем оптимизированный Dockerfile
log "📤 Отправка оптимизированного Dockerfile..."
scp frontend/Dockerfile.prod.optimized $SERVER_USER@$SERVER_IP:/root/agb_proj/frontend/Dockerfile.prod

# Создаем .dockerignore для уменьшения размера контекста
log "📝 Создание .dockerignore для оптимизации..."
cat > .dockerignore << EOF
node_modules
npm-debug.log
.next
.git
.gitignore
README.md
.env
.env.local
.env.production.local
.env.development.local
.vercel
.DS_Store
*.log
coverage
.nyc_output
.cache
dist
build
EOF

# Отправляем .dockerignore
scp .dockerignore $SERVER_USER@$SERVER_IP:/root/agb_proj/frontend/

# Создаем скрипт для сборки с оптимизацией
log "📝 Создание скрипта оптимизированной сборки..."
cat > build-optimized.sh << 'EOF'
#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

log "🚀 Оптимизированная сборка приложения..."

# Останавливаем существующие контейнеры
log "🛑 Остановка существующих контейнеров..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Очищаем Docker cache
log "🧹 Очистка Docker cache..."
docker system prune -f
docker builder prune -f

# Собираем только backend сначала
log "🔨 Сборка backend..."
docker-compose -f docker-compose.prod.yml build --no-cache backend

# Собираем frontend с оптимизацией
log "🔨 Сборка frontend с оптимизацией..."
docker-compose -f docker-compose.prod.yml build --no-cache frontend

# Запускаем контейнеры
log "🚀 Запуск контейнеров..."
docker-compose -f docker-compose.prod.yml up -d

# Проверяем статус
log "📊 Проверка статуса контейнеров..."
docker-compose -f docker-compose.prod.yml ps

log "✅ Сборка завершена!"
EOF

# Отправляем скрипт сборки
scp build-optimized.sh $SERVER_USER@$SERVER_IP:/root/agb_proj/

# Выполняем оптимизированную сборку
log "🔨 Запуск оптимизированной сборки на сервере..."
ssh $SERVER_USER@$SERVER_IP "cd /root/agb_proj && chmod +x build-optimized.sh && ./build-optimized.sh"

# Проверяем результат
log "📊 Проверка результата..."
ssh $SERVER_USER@$SERVER_IP "cd /root/agb_proj && docker-compose -f docker-compose.prod.yml ps"

log "✅ Исправление завершено!"
info "💡 Если проблемы продолжаются, рассмотрите:"
echo "  - Увеличение диска сервера"
echo "  - Использование внешнего Docker registry"
echo "  - Оптимизацию размера образов"
