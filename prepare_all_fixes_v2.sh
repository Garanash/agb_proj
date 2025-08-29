#!/bin/bash
# Полная подготовка всех исправлений платформы v2

echo "🔧 ПОДГОТОВКА ВСЕХ ИСПРАВЛЕНИЙ ПЛАТФОРМЫ V2"
echo "=========================================="

# Создаем структуру директорий
TEMP_DIR="/tmp/platform_fixes_v2"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

echo "📋 1. КОПИРОВАНИЕ FRONTEND ФАЙЛОВ..."

# Frontend utils
mkdir -p "$TEMP_DIR/frontend/utils"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/utils/api.ts "$TEMP_DIR/frontend/utils/"

# Frontend components
mkdir -p "$TEMP_DIR/frontend/components"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/AuthContext.tsx "$TEMP_DIR/frontend/components/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/AddEventModal.tsx "$TEMP_DIR/frontend/components/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/AdvancedSearchFilters.tsx "$TEMP_DIR/frontend/components/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/ArchiveStats.tsx "$TEMP_DIR/frontend/components/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/CreateChatRoomModal.tsx "$TEMP_DIR/frontend/components/"

# Frontend app pages
mkdir -p "$TEMP_DIR/frontend/app/users"
mkdir -p "$TEMP_DIR/frontend/app/admin"
mkdir -p "$TEMP_DIR/frontend/app/ved-passports"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/app/users/page.tsx "$TEMP_DIR/frontend/app/users/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/app/admin/bots/page.tsx "$TEMP_DIR/frontend/app/admin/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/app/ved-passports/page.tsx "$TEMP_DIR/frontend/app/ved-passports/"

echo "📋 2. КОПИРОВАНИЕ BACKEND ФАЙЛОВ..."

# Backend main files
mkdir -p "$TEMP_DIR/backend"
cp /Users/andreydolgov/Desktop/programming/agb_proj/backend/main.py "$TEMP_DIR/backend/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/backend/schemas.py "$TEMP_DIR/backend/"

# Backend routers
mkdir -p "$TEMP_DIR/backend/routers"
cp /Users/andreydolgov/Desktop/programming/agb_proj/backend/routers/__init__.py "$TEMP_DIR/backend/routers/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/backend/routers/chat.py "$TEMP_DIR/backend/routers/"

echo "📋 3. КОПИРОВАНИЕ КОНФИГУРАЦИОННЫХ ФАЙЛОВ..."

# Docker and nginx
cp /Users/andreydolgov/Desktop/programming/agb_proj/docker-compose.yml "$TEMP_DIR/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/universal_deploy.sh "$TEMP_DIR/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/nginx/nginx.conf "$TEMP_DIR/nginx.conf"

# Test scripts
cp /Users/andreydolgov/Desktop/programming/agb_proj/test_all_features.py "$TEMP_DIR/"
cp /Users/andreydolgov/Desktop/programming/agb_proj/test_api_endpoints.py "$TEMP_DIR/"

echo "📋 4. СОЗДАНИЕ АРХИВА..."

cd /tmp
tar -czf platform_fixes_v2.tar.gz platform_fixes_v2

echo "📋 5. СОЗДАНИЕ ИНСТРУКЦИЙ..."

cat > /tmp/platform_fixes_v2/README.md << 'EOF'
# Платформа Алмазгеобур - Исправления v2

## 🚀 Быстрое развертывание

### 1. Копирование файлов на сервер
```bash
# На локальном компьютере
scp /tmp/platform_fixes_v2.tar.gz root@ВАШ_IP:/tmp/

# На сервере
cd /tmp
tar -xzf platform_fixes_v2.tar.gz
cd platform_fixes_v2
```

### 2. Применение исправлений
```bash
# Остановка сервисов
cd /root/agb_platform
docker-compose down

# Копирование исправлений
cp -r /tmp/platform_fixes_v2/frontend/* frontend/
cp -r /tmp/platform_fixes_v2/backend/* backend/
cp /tmp/platform_fixes_v2/docker-compose.yml .
cp /tmp/platform_fixes_v2/universal_deploy.sh .
cp /tmp/platform_fixes_v2/nginx.conf nginx/

# Запуск сервисов
./universal_deploy.sh
```

### 3. Тестирование
```bash
# Тест API endpoints
python test_api_endpoints.py

# Полный тест функций
python test_all_features.py http://localhost
```

## ✅ ИСПРАВЛЕННЫЕ ПРОБЛЕМЫ

### 1. Чаты создаются с участниками
- ✅ Включены чат роутеры в main.py
- ✅ Обновлена схема ChatRoomCreate для участников
- ✅ CreateChatRoomModal отправляет участников при создании

### 2. Сотрудники добавляются в разделе "О нас"
- ✅ CompanyEmployeeModal работает корректно
- ✅ API /api/company-employees/ функционирует
- ✅ Схемы CompanyEmployeeCreate правильные

### 3. События создаются с участниками
- ✅ AddEventModal отправляет участников
- ✅ API /api/events/ работает с участниками
- ✅ EventCreate схема поддерживает участников

### 4. Универсальные роуты
- ✅ getApiUrl() используется во всех компонентах
- ✅ Нет жестко заданных localhost URL
- ✅ Автоматическое определение API URL

## 🔧 ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Backend изменения:
- main.py: Включены чат роутеры
- schemas.py: Добавлены поля participants и bots в ChatRoomCreate
- chat.py: Логика создания чата с участниками

### Frontend изменения:
- CreateChatRoomModal: Отправка участников при создании
- api.ts: Универсальное определение URL
- Все компоненты: Использование getApiUrl()

## 📊 ПРОВЕРКА РАБОТОСПОСОБНОСТИ

После развертывания проверьте:
1. ✅ API здоровье: http://ВАШ_IP/api/health
2. ✅ Маршруты: http://ВАШ_IP/api/debug/routes
3. ✅ Создание чата с участниками
4. ✅ Добавление сотрудника в "О нас"
5. ✅ Создание события с участниками

## 🌐 ДОСТУП К ПЛАТФОРМЕ

- URL: http://ВАШ_IP/login
- Логин: admin
- Пароль: admin123
EOF

echo "✅ ПОДГОТОВКА ЗАВЕРШЕНА!"
echo ""
echo "📦 Архив создан: /tmp/platform_fixes_v2.tar.gz"
echo "📖 Инструкции: /tmp/platform_fixes_v2/README.md"
echo ""
echo "🚀 Для развертывания на сервере:"
echo "   scp /tmp/platform_fixes_v2.tar.gz root@ВАШ_IP:/tmp/"
echo "   # Затем следуйте инструкциям в README.md"
