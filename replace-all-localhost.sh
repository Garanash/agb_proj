#!/bin/bash

echo "🔧 AGB Project - Массовая замена localhost:8000 на getApiUrl()"
echo "============================================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ПОИСК ВСЕХ ФАЙЛОВ С LOCALHOST:8000 ==="
echo "Найдено файлов с localhost:8000:"
grep -r "localhost:8000" frontend/ --include="*.tsx" --include="*.ts" --include="*.js" | wc -l

echo ""
echo "=== 2. ИСПРАВЛЕНИЕ ФАЙЛОВ ==="

# Исправляем article-matching/page.tsx
echo "Исправляем article-matching/page.tsx..."
sed -i "s|'http://localhost:8000/api|getApiUrl() + '/api|g" frontend/app/article-matching/page.tsx
sed -i "s|\`http://localhost:8000/api|\`\${getApiUrl()}/api|g" frontend/app/article-matching/page.tsx

# Исправляем ArticleSearchManager.tsx
echo "Исправляем ArticleSearchManager.tsx..."
sed -i "s|'http://localhost:8000/api|getApiUrl() + '/api|g" frontend/src/components/features/admin/ArticleSearchManager.tsx
sed -i "s|\`http://localhost:8000/api|\`\${getApiUrl()}/api|g" frontend/src/components/features/admin/ArticleSearchManager.tsx

# Исправляем AuthContext.tsx
echo "Исправляем AuthContext.tsx..."
sed -i "s|'http://localhost:8000/api|getApiUrl() + '/api|g" frontend/components/AuthContext.tsx
sed -i "s|\`http://localhost:8000/api|\`\${getApiUrl()}/api|g" frontend/components/AuthContext.tsx

# Исправляем automation/page.tsx
echo "Исправляем automation/page.tsx..."
sed -i "s|'http://localhost:8000/api|getApiUrl() + '/api|g" frontend/app/admin/automation/page.tsx
sed -i "s|\`http://localhost:8000/api|\`\${getApiUrl()}/api|g" frontend/app/admin/automation/page.tsx

# Исправляем ApiKeysSettings.tsx
echo "Исправляем ApiKeysSettings.tsx..."
sed -i "s|'http://localhost:8000/api|getApiUrl() + '/api|g" frontend/components/ApiKeysSettings.tsx
sed -i "s|\`http://localhost:8000/api|\`\${getApiUrl()}/api|g" frontend/components/ApiKeysSettings.tsx

# Исправляем ved-passports/article-matching/page.tsx
echo "Исправляем ved-passports/article-matching/page.tsx..."
sed -i "s|'http://localhost:8000/api|getApiUrl() + '/api|g" frontend/app/ved-passports/article-matching/page.tsx
sed -i "s|\`http://localhost:8000/api|\`\${getApiUrl()}/api|g" frontend/app/ved-passports/article-matching/page.tsx

# Исправляем admin-dashboard/page.tsx
echo "Исправляем admin-dashboard/page.tsx..."
sed -i "s|'http://localhost:8000/api|getApiUrl() + '/api|g" frontend/app/admin-dashboard/page.tsx
sed -i "s|\`http://localhost:8000/api|\`\${getApiUrl()}/api|g" frontend/app/admin-dashboard/page.tsx

# Исправляем login-demo/page.tsx
echo "Исправляем login-demo/page.tsx..."
sed -i "s|'http://localhost:8000/api|getApiUrl() + '/api|g" frontend/app/login-demo/page.tsx
sed -i "s|\`http://localhost:8000/api|\`\${getApiUrl()}/api|g" frontend/app/login-demo/page.tsx

echo ""
echo "=== 3. ДОБАВЛЕНИЕ ИМПОРТОВ getApiUrl ==="

# Добавляем импорт getApiUrl в файлы, где его нет
echo "Добавляем импорты getApiUrl..."

# Article-matching
if ! grep -q "getApiUrl" frontend/app/article-matching/page.tsx; then
  sed -i "1i import { getApiUrl } from '@/utils/api';" frontend/app/article-matching/page.tsx
fi

# ArticleSearchManager
if ! grep -q "getApiUrl" frontend/src/components/features/admin/ArticleSearchManager.tsx; then
  sed -i "1i import { getApiUrl } from '@/utils/api';" frontend/src/components/features/admin/ArticleSearchManager.tsx
fi

# AuthContext
if ! grep -q "getApiUrl" frontend/components/AuthContext.tsx; then
  sed -i "1i import { getApiUrl } from '@/utils/api';" frontend/components/AuthContext.tsx
fi

# Automation
if ! grep -q "getApiUrl" frontend/app/admin/automation/page.tsx; then
  sed -i "1i import { getApiUrl } from '@/utils/api';" frontend/app/admin/automation/page.tsx
fi

# ApiKeysSettings
if ! grep -q "getApiUrl" frontend/components/ApiKeysSettings.tsx; then
  sed -i "1i import { getApiUrl } from '@/utils/api';" frontend/components/ApiKeysSettings.tsx
fi

# Ved-passports article-matching
if ! grep -q "getApiUrl" frontend/app/ved-passports/article-matching/page.tsx; then
  sed -i "1i import { getApiUrl } from '@/utils/api';" frontend/app/ved-passports/article-matching/page.tsx
fi

# Admin-dashboard
if ! grep -q "getApiUrl" frontend/app/admin-dashboard/page.tsx; then
  sed -i "1i import { getApiUrl } from '@/utils/api';" frontend/app/admin-dashboard/page.tsx
fi

# Login-demo
if ! grep -q "getApiUrl" frontend/app/login-demo/page.tsx; then
  sed -i "1i import { getApiUrl } from '@/utils/api';" frontend/app/login-demo/page.tsx
fi

echo ""
echo "=== 4. ПРОВЕРКА ИСПРАВЛЕНИЙ ==="
echo "Осталось файлов с localhost:8000:"
grep -r "localhost:8000" frontend/ --include="*.tsx" --include="*.ts" --include="*.js" | wc -l

echo ""
echo "=== 5. ОБНОВЛЕНИЕ PRODUCTION.ENV ==="
echo "Обновление NEXT_PUBLIC_API_URL..."
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP/api|g" config/env/production.env

echo "Проверка обновления:"
grep "NEXT_PUBLIC_API_URL" config/env/production.env

echo ""
echo "=== 6. ПЕРЕСБОРКА FRONTEND ==="
echo "Остановка frontend..."
docker stop agb_frontend_prod
docker rm agb_frontend_prod

echo "Пересборка frontend..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build frontend

echo "Запуск frontend..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d frontend
sleep 15

echo ""
echo "=== 7. ПЕРЕЗАПУСК NGINX ==="
echo "Перезапуск nginx..."
docker restart agb_nginx_prod
sleep 5

echo ""
echo "=== 8. ПРОВЕРКА РЕЗУЛЬТАТА ==="
echo "Статус frontend:"
docker ps | grep frontend

echo ""
echo "Проверка frontend:"
curl -s http://$SERVER_IP | head -1

echo ""
echo "Проверка backend API:"
curl -s http://$SERVER_IP:8000/api/health | head -1

echo ""
echo "Тест входа:"
curl -X POST http://$SERVER_IP:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://$SERVER_IP" \
  -d '{"username": "admin", "password": "admin123"}' \
  -s | head -1

echo ""
echo "=== 9. СТАТУС ВСЕХ КОНТЕЙНЕРОВ ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

echo ""
echo "🎉 МАССОВАЯ ЗАМЕНА ЗАВЕРШЕНА!"
echo "============================="
echo "🌐 Frontend: http://$SERVER_IP"
echo "🔧 Backend API: http://$SERVER_IP:8000"
echo "📚 Swagger UI: http://$SERVER_IP:8000/docs"
echo "❤️ Health Check: http://$SERVER_IP:8000/api/health"
echo ""
echo "👤 Логин: admin"
echo "🔑 Пароль: admin123"
echo ""
echo "Теперь все файлы используют getApiUrl() вместо хардкода!"
