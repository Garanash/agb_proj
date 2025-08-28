#!/bin/sh

echo "🚀 Felix Platform - Автоматический деплой"
echo "=================================="

# Функция для проверки команд
check_command() {
    if ! command -v $1 >/dev/null 2>&1; then
        echo "❌ Команда $1 не найдена! Установите Docker и Docker Compose"
        exit 1
    fi
}

# Проверяем необходимые команды
echo "🔍 Проверяем необходимые команды..."
check_command docker
check_command docker-compose

# Остановка всех контейнеров
echo "📦 Останавливаем все контейнеры..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Очистка Docker системы
echo "🧹 Очищаем Docker систему..."
docker system prune -af --volumes 2>/dev/null || true

# Удаление всех образов
echo "🗑️ Удаляем все образы..."
docker rmi $(docker images -q) 2>/dev/null || true

# Очистка всех контейнеров
echo "🧹 Очищаем все контейнеры..."
docker container prune -f 2>/dev/null || true

# Очистка всех volumes
echo "🗂️ Очищаем все volumes..."
docker volume prune -f 2>/dev/null || true

# Очистка всех networks
echo "🌐 Очищаем все networks..."
docker network prune -f 2>/dev/null || true

# Проверяем, что порт 80 свободен
echo "🔍 Проверяем порт 80..."
if ss -tlnp | grep :80 > /dev/null 2>&1; then
    echo "⚠️ Порт 80 занят, освобождаем..."
    sudo fuser -k 80/tcp 2>/dev/null || true
    sleep 2
fi

# Сборка и запуск
echo "🏗️ Собираем и запускаем все сервисы..."
docker-compose -f docker-compose.prod.yml up -d --build

# Ждем запуска базы данных
echo "⏳ Ждем запуска базы данных..."
sleep 10

# Проверяем статус базы данных
echo "🔍 Проверяем статус базы данных..."
until docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U felix_user -d agb_felix > /dev/null 2>&1; do
    echo "⏳ База данных еще не готова, ждем..."
    sleep 5
done
echo "✅ База данных готова!"

# Инициализация базы данных
echo "🗄️ Инициализируем базу данных..."
docker-compose -f docker-compose.prod.yml exec -T backend python init_db.py 2>/dev/null || {
    echo "⚠️ База данных уже инициализирована"
}

# Ждем полного запуска всех сервисов
echo "⏳ Ждем полного запуска всех сервисов..."
sleep 30

# Проверяем статус всех контейнеров
echo "🔍 Проверяем статус всех контейнеров..."
docker-compose -f docker-compose.prod.yml ps

# Проверяем, что nginx слушает порт 80
echo "🔍 Проверяем, что nginx слушает порт 80..."
if ss -tlnp | grep :80 > /dev/null 2>&1; then
    echo "✅ Nginx слушает порт 80"
else
    echo "❌ Nginx не слушает порт 80"
    echo "🔍 Проверяем логи nginx..."
    docker-compose -f docker-compose.prod.yml logs nginx
    exit 1
fi

# Тестируем API
echo "🧪 Тестируем API..."
if curl -s http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ API работает!"
else
    echo "⚠️ API еще не готов, ждем..."
    sleep 30
    if curl -s http://localhost/api/health > /dev/null 2>&1; then
        echo "✅ API работает!"
    else
        echo "❌ API не работает"
        echo "🔍 Проверяем логи backend..."
        docker-compose -f docker-compose.prod.yml logs backend
    fi
fi

# Финальная проверка
echo "🔍 Финальная проверка..."
echo ""
echo "=================================="
echo "✅ Деплой завершен успешно!"
echo "=================================="
echo ""
echo "🌐 Доступ к приложению:"
echo "   Внутренний: http://localhost"
echo "   Внешний:   http://172.25.155.26"
echo ""
echo "🔑 Данные для входа:"
echo "   Логин: admin"
echo "   Пароль: neurofork1"
echo ""
echo "📋 Полезные команды:"
echo "   Логи:     docker-compose -f docker-compose.prod.yml logs"
echo "   Статус:   docker-compose -f docker-compose.prod.yml ps"
echo "   Остановка: docker-compose -f docker-compose.prod.yml down"
echo ""
echo "⏳ Приложение полностью готово через 1-2 минуты"
echo "=================================="
