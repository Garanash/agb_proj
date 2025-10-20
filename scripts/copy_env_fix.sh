#!/bin/bash

echo "📤 КОПИРОВАНИЕ ИСПРАВЛЕННОГО ENVIRONMENT ФАЙЛА НА СЕРВЕР"
echo "==================================================="

# Проверяем аргументы
if [ $# -eq 0 ]; then
    echo "❌ Не указан адрес сервера!"
    echo ""
    echo "Использование:"
    echo "  $0 <server_ip> [username]"
    echo ""
    echo "Примеры:"
    echo "  $0 89.23.99.86"
    echo "  $0 89.23.99.86 root"
    echo ""
    exit 1
fi

SERVER_IP=$1
USERNAME=${2:-root}
PROJECT_PATH="/root/agb_proj"

echo "🌐 Сервер: $SERVER_IP"
echo "👤 Пользователь: $USERNAME"
echo "📁 Путь: $PROJECT_PATH"

# Проверяем подключение к серверу
echo ""
echo "🔍 Проверка подключения к серверу..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $USERNAME@$SERVER_IP "echo 'Подключение успешно'" 2>/dev/null; then
    echo "❌ Не удается подключиться к серверу $SERVER_IP"
    exit 1
fi

echo "✅ Подключение к серверу успешно"

# Исправляем переменную окружения локально
echo ""
echo "🔧 Исправление переменной окружения локально..."
sed -i 's|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://'"$SERVER_IP"'|' config/env/production.env

# Показываем что изменилось
echo ""
echo "📋 Изменения в production.env:"
echo "   Старая строка: NEXT_PUBLIC_API_URL=http://89.23.99.86/api"
echo "   Новая строка:  NEXT_PUBLIC_API_URL=http://$SERVER_IP"

# Копируем исправленный файл на сервер
echo ""
echo "📤 Копирование исправленного файла на сервер..."
scp config/env/production.env $USERNAME@$SERVER_IP:$PROJECT_PATH/config/env/production.env

if [ $? -eq 0 ]; then
    echo "✅ Файл успешно скопирован"
else
    echo "❌ Ошибка при копировании файла"
    exit 1
fi

# Проверяем, что файл скопировался
echo ""
echo "🔍 Проверка файла на сервере..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && grep 'NEXT_PUBLIC_API_URL' config/env/production.env"

# Перезапускаем frontend контейнер
echo ""
echo "🔄 Перезапуск frontend контейнера..."
ssh $USERNAME@$SERVER_IP "cd $PROJECT_PATH && docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart frontend"

# Ждем запуска
echo ""
echo "⏳ Ожидание запуска frontend (20 секунд)..."
sleep 20

echo ""
echo "🎉 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo ""
echo "🌐 Проверьте приложение:"
echo "  - Frontend: http://$SERVER_IP"
echo "  - Backend API: http://$SERVER_IP:8000"
echo ""
echo "📋 Что было исправлено:"
echo "  1. Исправлена переменная NEXT_PUBLIC_API_URL"
echo "  2. Скопирован исправленный файл на сервер"
echo "  3. Перезапущен frontend контейнер"
echo ""
echo "🔧 Переменная окружения теперь:"
echo "   NEXT_PUBLIC_API_URL=http://$SERVER_IP"
