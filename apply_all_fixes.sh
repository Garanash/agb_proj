#!/bin/bash
# Полное применение всех исправлений платформы

echo "🔧 ПРИМЕНЕНИЕ ВСЕХ ИСПРАВЛЕНИЙ ПЛАТФОРМЫ"
echo "======================================="

# Шаг 1: Копирование исправленных файлов
echo "📋 1. Копирование исправленных файлов..."

# Создаем структуру директорий
mkdir -p /tmp/platform_fixes/frontend/utils
mkdir -p /tmp/platform_fixes/frontend/components
mkdir -p /tmp/platform_fixes/frontend/app/admin
mkdir -p /tmp/platform_fixes/frontend/app/ved-passports
mkdir -p /tmp/platform_fixes/backend
mkdir -p /tmp/platform_fixes/nginx

# Копируем все исправленные файлы
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/utils/api.ts /tmp/platform_fixes/frontend/utils/
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/AuthContext.tsx /tmp/platform_fixes/frontend/components/
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/AddEventModal.tsx /tmp/platform_fixes/frontend/components/
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/app/ved-passports/page.tsx /tmp/platform_fixes/frontend/app/ved-passports/
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/app/admin/bots/page.tsx /tmp/platform_fixes/frontend/app/admin/
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/ArchiveStats.tsx /tmp/platform_fixes/frontend/components/
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/AdvancedSearchFilters.tsx /tmp/platform_fixes/frontend/components/
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/app/users/page.tsx /tmp/platform_fixes/frontend/app/
cp /Users/andreydolgov/Desktop/programming/agb_proj/backend/main.py /tmp/platform_fixes/backend/
cp /Users/andreydolgov/Desktop/programming/agb_proj/nginx/nginx.conf /tmp/platform_fixes/nginx/
cp /Users/andreydolgov/Desktop/programming/agb_proj/docker-compose.yml /tmp/platform_fixes/
cp /Users/andreydolgov/Desktop/programming/agb_proj/universal_deploy.sh /tmp/platform_fixes/

echo "✅ Файлы подготовлены в /tmp/platform_fixes/"

# Шаг 2: Инструкции по копированию
echo -e "\n📋 2. КОПИРОВАНИЕ НА СЕРВЕР:"
echo "Выполните на сервере:"
echo "sudo scp -r root@ВАШ_ЛОКАЛЬНЫЙ_IP:/tmp/platform_fixes/* /root/agb_platform/"
echo ""
echo "Или если файлы уже на сервере:"
echo "cp -r /tmp/platform_fixes/* /root/agb_platform/"

# Шаг 3: Применение исправлений
echo -e "\n📋 3. ПРИМЕНЕНИЕ ИСПРАВЛЕНИЙ:"
echo "На сервере выполните:"
echo "cd /root/agb_platform"
echo "chmod +x *.sh"
echo "./universal_deploy.sh"

# Шаг 4: Что исправлено
echo -e "\n📋 4. ЧТО ИСПРАВЛЕНО:"
echo "✅ Роуты логина - универсальное определение URL"
echo "✅ Роли пользователей - поддержка ved_passport"
echo "✅ CORS ошибки - исправлены дублированные заголовки"
echo "✅ API пользователей для чата - работает корректно"
echo "✅ API отделов - загружается правильно"
echo "✅ API сотрудников - создаются корректно"
echo "✅ События с участниками - можно добавлять пользователей"
echo "✅ Чат-комнаты - API работает"
echo "✅ Боты - API доступно"

# Шаг 5: Тестирование
echo -e "\n📋 5. ТЕСТИРОВАНИЕ:"
echo "После применения запустите комплексный тест:"
echo "python test_all_features.py http://ВАШ_IP_СЕРВЕРА"
echo ""
echo "Или протестируйте вручную:"
echo "curl http://ВАШ_IP/api/health"
echo "curl -X POST http://ВАШ_IP/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"admin123\"}'"

echo -e "\n🎯 ГОТОВО К РАЗВЕРТЫВАНИЮ!"
echo "Файлы подготовлены в /tmp/platform_fixes/"
echo "Следуйте инструкциям выше для применения на сервере."
