#!/bin/bash
# Полное развертывание всех исправлений платформы

echo "🚀 ПОЛНОЕ РАЗВЕРТЫВАНИЕ ИСПРАВЛЕНИЙ ПЛАТФОРМЫ"
echo "============================================"

# Параметры сервера
SERVER_HOST=${1:-"ВАШ_IP_СЕРВЕРА"}
SERVER_USER=${2:-"root"}
PROJECT_DIR=${3:-"/root/agb_platform"}

echo "🎯 Сервер: $SERVER_HOST"
echo "👤 Пользователь: $SERVER_USER"
echo "📁 Директория проекта: $PROJECT_DIR"

# Шаг 1: Подготовка файлов
echo -e "\n📋 1. ПОДГОТОВКА ФАЙЛОВ..."

# Создаем временную директорию
TEMP_DIR="/tmp/platform_deployment_$(date +%s)"
mkdir -p "$TEMP_DIR"

# Копируем все исправленные файлы
echo "   Копирование frontend файлов..."
mkdir -p "$TEMP_DIR/frontend/utils"
mkdir -p "$TEMP_DIR/frontend/components"
mkdir -p "$TEMP_DIR/frontend/app/users"
mkdir -p "$TEMP_DIR/frontend/app/admin"
mkdir -p "$TEMP_DIR/frontend/app/ved-passports"

cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/utils/api.ts "$TEMP_DIR/frontend/utils/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/AuthContext.tsx "$TEMP_DIR/frontend/components/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/AddEventModal.tsx "$TEMP_DIR/frontend/components/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/AdvancedSearchFilters.tsx "$TEMP_DIR/frontend/components/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/ArchiveStats.tsx "$TEMP_DIR/frontend/components/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/CreateChatRoomModal.tsx "$TEMP_DIR/frontend/components/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/app/users/page.tsx "$TEMP_DIR/frontend/app/users/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/app/admin/bots/page.tsx "$TEMP_DIR/frontend/app/admin/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/app/ved-passports/page.tsx "$TEMP_DIR/frontend/app/ved-passports/"

echo "   Копирование backend файлов..."
mkdir -p "$TEMP_DIR/backend/routers"
mkdir -p "$TEMP_DIR/backend"

cp /Users/andreydolgov/Desktop/programming/agb_proj/backend/main.py "$TEMP_DIR/backend/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/backend/schemas.py "$TEMP_DIR/backend/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/backend/routers/chat.py "$TEMP_DIR/backend/routers/"

echo "   Копирование конфигурационных файлов..."
cp /Users/andreydolgov/Desktop/programming/agb_proj/docker-compose.yml "$TEMP_DIR/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/universal_deploy.sh "$TEMP_DIR/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/test_all_features.py "$TEMP_DIR/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/nginx/nginx.conf "$TEMP_DIR/nginx.conf"

echo "✅ Файлы подготовлены в: $TEMP_DIR"

# Шаг 2: Копирование на сервер
echo -e "\n📋 2. КОПИРОВАНИЕ НА СЕРВЕР..."

if [ "$SERVER_HOST" = "ВАШ_IP_СЕРВЕРА" ]; then
    echo "⚠️  Укажите IP адрес сервера в качестве первого параметра"
    echo "Пример: ./deploy_all_fixes.sh 123.456.789.0"
    exit 1
fi

echo "   Создание архива..."
cd "$TEMP_DIR"
tar -czf platform_fixes.tar.gz .

echo "   Копирование на сервер..."
scp platform_fixes.tar.gz "$SERVER_USER@$SERVER_HOST:/tmp/"

# Шаг 3: Установка на сервере
echo -e "\n📋 3. УСТАНОВКА НА СЕРВЕРЕ..."
ssh "$SERVER_USER@$SERVER_HOST" << EOF
    echo "📋 Извлечение файлов..."
    cd /tmp
    tar -xzf platform_fixes.tar.gz
    rm platform_fixes.tar.gz

    echo "📋 Копирование в проект..."
    cd /tmp
    cp -r frontend/* $PROJECT_DIR/frontend/
    cp -r backend/* $PROJECT_DIR/backend/
    cp docker-compose.yml $PROJECT_DIR/
    cp universal_deploy.sh $PROJECT_DIR/
    cp test_all_features.py $PROJECT_DIR/
    cp nginx.conf $PROJECT_DIR/nginx/

    echo "📋 Установка прав..."
    cd $PROJECT_DIR
    chmod +x *.sh
    chmod +x test_all_features.py

    echo "✅ Файлы установлены!"
EOF

# Шаг 4: Перезапуск сервисов
echo -e "\n📋 4. ПЕРЕЗАПУСК СЕРВИСОВ..."
ssh "$SERVER_USER@$SERVER_HOST" << EOF
    echo "📋 Остановка контейнеров..."
    cd $PROJECT_DIR
    docker-compose down

    echo "📋 Запуск сервисов..."
    ./universal_deploy.sh

    echo "✅ Сервисы перезапущены!"
EOF

# Шаг 5: Тестирование
echo -e "\n📋 5. ТЕСТИРОВАНИЕ..."
ssh "$SERVER_USER@$SERVER_HOST" << EOF
    echo "📋 Запуск комплексного тестирования..."
    cd $PROJECT_DIR
    python test_all_features.py http://localhost

    echo "✅ Тестирование завершено!"
EOF

# Шаг 6: Очистка
echo -e "\n📋 6. ОЧИСТКА..."
rm -rf "$TEMP_DIR"

echo -e "\n🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
echo "==============================="
echo "📊 ПРОВЕРЬТЕ РЕЗУЛЬТАТЫ:"
echo "   • Чаты создаются с участниками"
echo "   • Сотрудники добавляются в разделе 'О нас'"
echo "   • События создаются с участниками"
echo "   • Все роуты работают универсально"
echo ""
echo "🌐 ДОСТУП К ПЛАТФОРМЕ:"
echo "   URL: http://$SERVER_HOST"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""
echo "🧪 ЗАПУСТИТЬ ТЕСТ ВРУЧНУЮ:"
echo "   ssh $SERVER_USER@$SERVER_HOST"
echo "   cd $PROJECT_DIR"
echo "   python test_all_features.py http://localhost"
