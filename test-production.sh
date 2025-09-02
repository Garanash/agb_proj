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

# Создание тестового production.env
create_test_env() {
    log "Создание тестового production.env..."
    
    cat > production.env << EOF
# Тестовая конфигурация для проверки развертывания
POSTGRES_DB=agb_felix_test
POSTGRES_USER=felix_test_user
POSTGRES_PASSWORD=test_password_123
DATABASE_URL=postgresql+asyncpg://felix_test_user:test_password_123@postgres:5432/agb_felix_test

SECRET_KEY=test_secret_key_for_production_testing_2024_min_32_chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
PYTHONWARNINGS=ignore:Unverified HTTPS request
AUTO_INIT_DATA=true

NEXT_PUBLIC_API_URL=http://localhost/api
NODE_ENV=production

NGINX_PORT=80
NGINX_SSL_PORT=443

ADMIN_USERNAME=admin
ADMIN_PASSWORD=test_admin_123
ADMIN_EMAIL=admin@test.local
ADMIN_FIRST_NAME=Тестовый
ADMIN_LAST_NAME=Администратор

DOMAIN=localhost
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem

WATCHTOWER_CLEANUP=true
WATCHTOWER_POLL_INTERVAL=3600
EOF
    
    log "Тестовый production.env создан ✅"
}

# Тестирование API endpoints
test_api_endpoints() {
    log "Тестирование API endpoints..."
    
    local base_url="http://localhost/api"
    local endpoints=(
        "/health"
        "/auth/login"
        "/users/"
        "/ved-passports/nomenclature/"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local url="$base_url$endpoint"
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ $endpoint - OK"
        else
            echo "❌ $endpoint - FAILED"
        fi
    done
}

# Тестирование базы данных
test_database() {
    log "Тестирование базы данных..."
    
    # Проверка подключения
    if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U felix_test_user -d agb_felix_test > /dev/null 2>&1; then
        echo "✅ Подключение к БД - OK"
    else
        echo "❌ Подключение к БД - FAILED"
        return 1
    fi
    
    # Проверка таблиц
    local tables=("users" "ved_nomenclature" "ved_passports" "departments")
    for table in "${tables[@]}"; do
        if docker-compose -f docker-compose.prod.yml exec -T postgres psql -U felix_test_user -d agb_felix_test -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
            echo "✅ Таблица $table - OK"
        else
            echo "❌ Таблица $table - FAILED"
        fi
    done
}

# Тестирование номенклатуры
test_nomenclature() {
    log "Тестирование номенклатуры..."
    
    local count=$(docker-compose -f docker-compose.prod.yml exec -T postgres psql -U felix_test_user -d agb_felix_test -t -c "SELECT COUNT(*) FROM ved_nomenclature;" 2>/dev/null | tr -d ' ')
    
    if [ "$count" -gt 0 ]; then
        echo "✅ Номенклатура загружена: $count позиций"
    else
        echo "❌ Номенклатура не загружена"
        return 1
    fi
}

# Тестирование пользователей
test_users() {
    log "Тестирование пользователей..."
    
    local admin_count=$(docker-compose -f docker-compose.prod.yml exec -T postgres psql -U felix_test_user -d agb_felix_test -t -c "SELECT COUNT(*) FROM users WHERE username = 'admin';" 2>/dev/null | tr -d ' ')
    
    if [ "$admin_count" -gt 0 ]; then
        echo "✅ Администратор создан"
    else
        echo "❌ Администратор не создан"
        return 1
    fi
}

# Полный тест системы
full_test() {
    log "🧪 Запуск полного тестирования production системы"
    echo "=============================================="
    
    # Ждем полного запуска системы
    log "Ожидание запуска системы (60 секунд)..."
    sleep 60
    
    local all_tests_passed=true
    
    # Тест 1: Health checks
    log "Тест 1: Health checks"
    if ! ./monitor.sh health; then
        all_tests_passed=false
    fi
    echo ""
    
    # Тест 2: API endpoints
    log "Тест 2: API endpoints"
    test_api_endpoints
    echo ""
    
    # Тест 3: База данных
    log "Тест 3: База данных"
    if ! test_database; then
        all_tests_passed=false
    fi
    echo ""
    
    # Тест 4: Номенклатура
    log "Тест 4: Номенклатура"
    if ! test_nomenclature; then
        all_tests_passed=false
    fi
    echo ""
    
    # Тест 5: Пользователи
    log "Тест 5: Пользователи"
    if ! test_users; then
        all_tests_passed=false
    fi
    echo ""
    
    # Результат
    if [ "$all_tests_passed" = true ]; then
        log "🎉 Все тесты пройдены успешно!"
        log "✅ Система готова к работе"
        return 0
    else
        error "❌ Некоторые тесты не пройдены"
        error "Проверьте логи: ./monitor.sh logs"
        return 1
    fi
}

# Очистка тестовой среды
cleanup_test() {
    log "Очистка тестовой среды..."
    
    # Остановка контейнеров
    docker-compose -f docker-compose.prod.yml down -v
    
    # Удаление тестового env файла
    rm -f production.env
    
    # Очистка Docker
    docker system prune -f
    
    log "Тестовая среда очищена ✅"
}

# Основная функция
main() {
    case "${1:-full}" in
        "env")
            create_test_env
            ;;
        "api")
            test_api_endpoints
            ;;
        "db")
            test_database
            ;;
        "nomenclature")
            test_nomenclature
            ;;
        "users")
            test_users
            ;;
        "full")
            create_test_env
            ./deploy.sh
            full_test
            ;;
        "cleanup")
            cleanup_test
            ;;
        "help"|*)
            echo "AGB Production Test Suite"
            echo ""
            echo "Использование: $0 [команда]"
            echo ""
            echo "Команды:"
            echo "  env         - Создать тестовый production.env"
            echo "  api         - Тестировать API endpoints"
            echo "  db          - Тестировать базу данных"
            echo "  nomenclature - Тестировать номенклатуру"
            echo "  users       - Тестировать пользователей"
            echo "  full        - Полный тест (по умолчанию)"
            echo "  cleanup     - Очистить тестовую среду"
            echo "  help        - Показать эту справку"
            ;;
    esac
}

main "$@"
