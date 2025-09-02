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

log "🧹 Очистка места на сервере..."

# Проверяем использование диска
log "📊 Текущее использование диска:"
df -h

echo ""
log "🗑️  Очистка Docker..."

# Останавливаем все контейнеры
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Удаляем неиспользуемые образы
docker image prune -a -f

# Удаляем неиспользуемые volumes
docker volume prune -f

# Удаляем неиспользуемые сети
docker network prune -f

# Полная очистка системы Docker
docker system prune -a -f --volumes

echo ""
log "📦 Очистка кэша пакетов..."

# Очистка кэша apt
apt-get clean
apt-get autoclean
apt-get autoremove -y

# Очистка кэша snap
snap list --all | awk '/disabled/{print $1, $3}' | while read snapname revision; do
    snap remove "$snapname" --revision="$revision" 2>/dev/null || true
done

echo ""
log "📁 Очистка временных файлов..."

# Очистка временных файлов
rm -rf /tmp/*
rm -rf /var/tmp/*

# Очистка логов
find /var/log -type f -name "*.log" -exec truncate -s 0 {} \;
find /var/log -type f -name "*.gz" -delete 2>/dev/null || true

# Очистка кэша
rm -rf /var/cache/apt/archives/*
rm -rf /var/cache/apt/lists/*

echo ""
log "🐳 Очистка Docker build cache..."

# Очистка build cache
docker builder prune -a -f

echo ""
log "📊 Использование диска после очистки:"
df -h

echo ""
log "✅ Очистка завершена!"

# Показываем размеры основных директорий
log "📁 Размеры основных директорий:"
du -sh /var/lib/docker 2>/dev/null || echo "Docker не установлен"
du -sh /tmp 2>/dev/null || echo "Нет /tmp"
du -sh /var/log 2>/dev/null || echo "Нет /var/log"
du -sh /var/cache 2>/dev/null || echo "Нет /var/cache"

echo ""
info "💡 Рекомендации:"
echo "  - Если места все еще мало, рассмотрите увеличение диска"
echo "  - Настройте автоматическую очистку Docker: docker system prune -f"
echo "  - Используйте .dockerignore для уменьшения размера контекста сборки"
