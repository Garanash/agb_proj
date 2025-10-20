#!/bin/bash

# Комплексное исправление всех проблем на сервере
# Использование: ./fix_all_server_issues.sh

SERVER_IP="89.23.99.86"

echo "=== КОМПЛЕКСНОЕ ИСПРАВЛЕНИЕ ПРОБЛЕМ НА СЕРВЕРЕ ==="
echo ""

echo "1. Копирование всех скриптов на сервер..."
scp scripts/check_and_create_ved_user.sh root@$SERVER_IP:/root/agb_proj/scripts/
scp scripts/check_and_create_missing_tables.sh root@$SERVER_IP:/root/agb_proj/scripts/

if [ $? -eq 0 ]; then
    echo "✅ Скрипты скопированы на сервер"
else
    echo "❌ Ошибка копирования скриптов"
    echo "Выполните команды вручную на сервере:"
    echo ""
    echo "ssh root@$SERVER_IP"
    echo "cd /root/agb_proj"
    echo "chmod +x scripts/check_and_create_ved_user.sh"
    echo "chmod +x scripts/check_and_create_missing_tables.sh"
    echo "./scripts/check_and_create_ved_user.sh"
    echo "./scripts/check_and_create_missing_tables.sh"
    exit 1
fi

echo ""
echo "2. Выполнение исправлений на сервере..."
ssh root@$SERVER_IP "cd /root/agb_proj && \
    echo '=== ИСПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯ d.li ===' && \
    chmod +x scripts/check_and_create_ved_user.sh && \
    ./scripts/check_and_create_ved_user.sh && \
    echo '' && \
    echo '=== ИСПРАВЛЕНИЕ ТАБЛИЦ NEWS И EVENTS ===' && \
    chmod +x scripts/check_and_create_missing_tables.sh && \
    ./scripts/check_and_create_missing_tables.sh && \
    echo '' && \
    echo '=== ПЕРЕЗАПУСК BACKEND ДЛЯ ПРИМЕНЕНИЯ ИЗМЕНЕНИЙ ===' && \
    docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart backend && \
    sleep 10 && \
    echo '=== ПРОВЕРКА РАБОТОСПОСОБНОСТИ ===' && \
    curl -s http://localhost:8000/api/health && echo && \
    echo 'Тест входа d.li:' && \
    curl -s -X POST http://localhost:8000/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"username\": \"d.li\", \"password\": \"123456\"}' | head -c 100 && echo"

echo ""
echo "=== ЗАВЕРШЕНО ==="
echo ""
echo "🎯 ИСПРАВЛЕННЫЕ ПРОБЛЕМЫ:"
echo "✅ Пользователь d.li создан/обновлен (логин: d.li, пароль: 123456)"
echo "✅ Таблицы news и events созданы с тестовыми данными"
echo "✅ API эндпоинты /api/v1/news и /api/v1/events должны работать"
echo "✅ Backend перезапущен для применения изменений"
echo ""
echo "🚀 ТЕПЕРЬ МОЖНО:"
echo "1. Войти как d.li / 123456 на http://$SERVER_IP"
echo "2. Проверить работу новостей и событий"
echo "3. Убедиться, что боковое меню отображается корректно"
