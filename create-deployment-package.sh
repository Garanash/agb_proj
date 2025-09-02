#!/bin/bash
set -e

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

# Создание архива для развертывания
create_deployment_package() {
    local package_name="agb-production-$(date +%Y%m%d_%H%M%S).tar.gz"
    
    log "Создание пакета для развертывания: $package_name"
    
    # Создаем временную директорию
    local temp_dir=$(mktemp -d)
    local package_dir="$temp_dir/agb-production"
    
    mkdir -p "$package_dir"
    
    # Копируем необходимые файлы
    log "Копирование файлов..."
    
    # Основные файлы
    cp -r backend "$package_dir/"
    cp -r frontend "$package_dir/"
    cp -r nginx "$package_dir/"
    cp -r scripts "$package_dir/"
    
    # Конфигурационные файлы
    cp docker-compose.prod.yml "$package_dir/"
    cp production.env.example "$package_dir/"
    cp env.example "$package_dir/"
    
    # Скрипты управления
    cp deploy.sh "$package_dir/"
    cp update.sh "$package_dir/"
    cp monitor.sh "$package_dir/"
    cp test-production.sh "$package_dir/"
    
    # Документация
    cp README_PRODUCTION.md "$package_dir/README.md"
    cp DEPLOYMENT.md "$package_dir/"
    cp README.md "$package_dir/README_ORIGINAL.md"
    
    # Создаем .gitignore для production
    cat > "$package_dir/.gitignore" << EOF
# Production ignores
production.env
*.log
backups/
ssl/
uploads/
node_modules/
__pycache__/
*.pyc
.env
.DS_Store
EOF
    
    # Создаем инструкцию по быстрому запуску
    cat > "$package_dir/QUICK_START.md" << EOF
# 🚀 Быстрый запуск AGB Production

## 1. Настройка конфигурации
\`\`\`bash
cp production.env.example production.env
nano production.env  # Измените пароли!
\`\`\`

## 2. Запуск системы
\`\`\`bash
./deploy.sh
\`\`\`

## 3. Проверка
\`\`\`bash
./monitor.sh health
\`\`\`

## 4. Доступ
- 🌐 Веб-интерфейс: http://localhost
- 👤 Админ: admin / (пароль из production.env)

## Полезные команды
\`\`\`bash
./monitor.sh status    # Статус
./monitor.sh logs      # Логи
./update.sh            # Обновление
./deploy.sh stop       # Остановка
\`\`\`

Подробная документация: [DEPLOYMENT.md](DEPLOYMENT.md)
EOF
    
    # Создаем директории
    mkdir -p "$package_dir/backups"
    mkdir -p "$package_dir/ssl"
    mkdir -p "$package_dir/uploads/documents"
    mkdir -p "$package_dir/uploads/portfolio"
    mkdir -p "$package_dir/uploads/profiles"
    
    # Устанавливаем права на скрипты
    chmod +x "$package_dir"/*.sh
    
    # Создаем архив
    log "Создание архива..."
    cd "$temp_dir"
    tar -czf "$package_name" agb-production/
    
    # Перемещаем архив в текущую директорию
    mv "$package_name" "$OLDPWD/"
    cd "$OLDPWD"
    
    # Очищаем временную директорию
    rm -rf "$temp_dir"
    
    log "✅ Пакет создан: $package_name"
    
    # Показываем информацию о пакете
    local package_size=$(du -h "$package_name" | cut -f1)
    info "Размер пакета: $package_size"
    
    echo ""
    log "📦 Содержимое пакета:"
    tar -tzf "$package_name" | head -20
    echo "..."
    
    echo ""
    log "🚀 Для развертывания на сервере:"
    echo "1. Загрузите архив на сервер"
    echo "2. Распакуйте: tar -xzf $package_name"
    echo "3. Перейдите в директорию: cd agb-production"
    echo "4. Следуйте инструкциям в QUICK_START.md"
}

# Создание Docker образов для офлайн развертывания
create_docker_images() {
    log "Создание Docker образов для офлайн развертывания..."
    
    local images_dir="docker-images-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$images_dir"
    
    # Собираем образы
    log "Сборка backend образа..."
    docker build -f backend/Dockerfile.prod -t agb-backend:latest ./backend
    
    log "Сборка frontend образа..."
    docker build -f frontend/Dockerfile.prod -t agb-frontend:latest ./frontend
    
    log "Сборка nginx образа..."
    docker build -f nginx/Dockerfile.prod -t agb-nginx:latest ./nginx
    
    # Сохраняем образы
    log "Сохранение образов..."
    docker save agb-backend:latest | gzip > "$images_dir/agb-backend.tar.gz"
    docker save agb-frontend:latest | gzip > "$images_dir/agb-frontend.tar.gz"
    docker save agb-nginx:latest | gzip > "$images_dir/agb-nginx.tar.gz"
    docker save postgres:15-alpine | gzip > "$images_dir/postgres.tar.gz"
    
    # Создаем скрипт загрузки образов
    cat > "$images_dir/load-images.sh" << 'EOF'
#!/bin/bash
echo "Загрузка Docker образов..."
docker load < agb-backend.tar.gz
docker load < agb-frontend.tar.gz
docker load < agb-nginx.tar.gz
docker load < postgres.tar.gz
echo "Образы загружены!"
EOF
    
    chmod +x "$images_dir/load-images.sh"
    
    # Создаем архив с образами
    local images_archive="docker-images-$(date +%Y%m%d_%H%M%S).tar.gz"
    tar -czf "$images_archive" "$images_dir/"
    rm -rf "$images_dir"
    
    log "✅ Docker образы сохранены: $images_archive"
}

# Основная функция
main() {
    case "${1:-package}" in
        "package")
            create_deployment_package
            ;;
        "images")
            create_docker_images
            ;;
        "both")
            create_deployment_package
            create_docker_images
            ;;
        "help"|*)
            echo "AGB Production Package Creator"
            echo ""
            echo "Использование: $0 [команда]"
            echo ""
            echo "Команды:"
            echo "  package  - Создать пакет для развертывания (по умолчанию)"
            echo "  images   - Создать Docker образы для офлайн развертывания"
            echo "  both     - Создать и пакет, и образы"
            echo "  help     - Показать эту справку"
            ;;
    esac
}

main "$@"
