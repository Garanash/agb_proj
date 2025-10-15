#!/bin/bash

echo "📋 КОПИРОВАНИЕ ENVIRONMENT ФАЙЛА НА СЕРВЕР"
echo "========================================="

# Проверяем аргументы
if [ $# -eq 0 ]; then
    echo "❌ Не указан адрес сервера!"
    echo ""
    echo "Использование:"
    echo "  $0 <server_ip> [username] [path]"
    echo ""
    echo "Примеры:"
    echo "  $0 89.23.99.86"
    echo "  $0 89.23.99.86 root"
    echo "  $0 89.23.99.86 root /root/agb_proj"
    echo ""
    exit 1
fi

SERVER_IP=$1
USERNAME=${2:-root}
PROJECT_PATH=${3:-/root/agb_proj}

echo "🌐 Сервер: $SERVER_IP"
echo "👤 Пользователь: $USERNAME"
echo "📁 Путь: $PROJECT_PATH"

# Проверяем, что файл production.env существует
if [ ! -f "config/env/production.env" ]; then
    echo "❌ Файл config/env/production.env не найден!"
    echo "   Убедитесь, что вы находитесь в корневой директории проекта"
    exit 1
fi

echo "✅ Файл production.env найден"

# Проверяем подключение к серверу
echo ""
echo "🔍 Проверка подключения к серверу..."
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $USERNAME@$SERVER_IP "echo 'Подключение успешно'" 2>/dev/null; then
    echo "❌ Не удается подключиться к серверу $SERVER_IP"
    echo "   Проверьте:"
    echo "   - Доступность сервера"
    echo "   - SSH ключи"
    echo "   - Имя пользователя"
    exit 1
fi

echo "✅ Подключение к серверу успешно"

# Создаем директорию на сервере, если её нет
echo ""
echo "📁 Создание директории на сервере..."
ssh $USERNAME@$SERVER_IP "mkdir -p $PROJECT_PATH/config/env"

# Копируем файл
echo ""
echo "📤 Копирование production.env на сервер..."
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
ssh $USERNAME@$SERVER_IP "ls -la $PROJECT_PATH/config/env/production.env"

# Показываем содержимое скопированного файла
echo ""
echo "📄 Содержимое скопированного файла:"
ssh $USERNAME@$SERVER_IP "cat $PROJECT_PATH/config/env/production.env"

echo ""
echo "🎉 ENVIRONMENT ФАЙЛ УСПЕШНО СКОПИРОВАН НА СЕРВЕР!"
echo ""
echo "📋 Что было скопировано:"
echo "  - Файл: config/env/production.env"
echo "  - На сервер: $USERNAME@$SERVER_IP:$PROJECT_PATH/config/env/production.env"
echo ""
echo "🔧 Следующие шаги на сервере:"
echo "  1. Перейдите в директорию проекта:"
echo "     cd $PROJECT_PATH"
echo ""
echo "  2. Запустите развертывание:"
echo "     ./scripts/deploy_via_git.sh"
echo ""
echo "  3. Или перезапустите сервисы:"
echo "     docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart"
