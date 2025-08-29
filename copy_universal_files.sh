#!/bin/bash
# Универсальное копирование всех исправленных файлов

echo "🔧 ПОДГОТОВКА УНИВЕРСАЛЬНЫХ ФАЙЛОВ"
echo "==================================="

# Создаем директории
mkdir -p /tmp/universal_deploy/frontend/utils
mkdir -p /tmp/universal_deploy/frontend/components
mkdir -p /tmp/universal_deploy/frontend/app/admin
mkdir -p /tmp/universal_deploy/frontend/app/ved-passports
mkdir -p /tmp/universal_deploy/nginx
mkdir -p /tmp/universal_deploy/backend

# Копируем основные файлы развертывания
cp /Users/andreydolgov/Desktop/programming/agb_proj/universal_deploy.sh /tmp/universal_deploy/
cp /Users/andreydolgov/Desktop/programming/agb_proj/docker-compose.yml /tmp/universal_deploy/
cp /Users/andreydolgov/Desktop/programming/agb_proj/env.example /tmp/universal_deploy/
cp /Users/andreydolgov/Desktop/programming/agb_proj/UNIVERSAL_DEPLOY_README.md /tmp/universal_deploy/

# Копируем исправленные компоненты frontend
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/utils/api.ts /tmp/universal_deploy/frontend/utils/
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/AuthContext.tsx /tmp/universal_deploy/frontend/components/
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/AddEventModal.tsx /tmp/universal_deploy/frontend/components/
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/app/ved-passports/page.tsx /tmp/universal_deploy/frontend/app/ved-passports/
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/app/admin/bots/page.tsx /tmp/universal_deploy/frontend/app/admin/
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/ArchiveStats.tsx /tmp/universal_deploy/frontend/components/
cp /Users/andreydolgov/Desktop/programming/agb_proj/frontend/components/AdvancedSearchFilters.tsx /tmp/universal_deploy/frontend/components/

# Копируем исправленные backend файлы
cp /Users/andreydolgov/Desktop/programming/agb_proj/backend/main.py /tmp/universal_deploy/backend/

# Копируем исправленный nginx
cp /Users/andreydolgov/Desktop/programming/agb_proj/nginx/nginx.conf /tmp/universal_deploy/nginx/

echo "✅ Все файлы подготовлены в /tmp/universal_deploy/"
echo ""
echo "📋 Структура файлов:"
find /tmp/universal_deploy -type f -name "*.sh" -o -name "*.yml" -o -name "*.ts" -o -name "*.tsx" -o -name "*.py" -o -name "*.conf" -o -name "*.md" | sort
echo ""
echo "🔧 Команды для копирования на сервер:"
echo "scp -r /tmp/universal_deploy/* root@ВАШ_IP:/root/agb_platform/"
echo ""
echo "📝 Пример для вашего сервера:"
echo "scp -r /tmp/universal_deploy/* root@37.252.20.46:/root/agb_platform/"
echo ""
echo "🎯 После копирования запустите:"
echo "cd /root/agb_platform"
echo "./universal_deploy.sh"
