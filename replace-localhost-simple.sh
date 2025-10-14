#!/bin/bash

echo "🔧 AGB Project - Простая замена localhost:8000 на getApiUrl()"
echo "==========================================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. МАССОВАЯ ЗАМЕНА ВО ВСЕХ ФАЙЛАХ ==="

# Заменяем во всех .tsx и .ts файлах
echo "Заменяем localhost:8000 на getApiUrl() во всех файлах..."
find frontend -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|'http://localhost:8000/api|getApiUrl() + '/api|g"
find frontend -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|\`http://localhost:8000/api|\`\${getApiUrl()}/api|g"

echo ""
echo "=== 2. ДОБАВЛЕНИЕ ИМПОРТОВ getApiUrl ==="

# Список файлов для добавления импорта
files=(
  "frontend/app/article-matching/page.tsx"
  "frontend/app/admin/automation/page.tsx"
  "frontend/components/ApiKeysSettings.tsx"
  "frontend/app/ved-passports/article-matching/page.tsx"
  "frontend/app/admin-dashboard/page.tsx"
  "frontend/app/login-demo/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ] && ! grep -q "getApiUrl" "$file"; then
    echo "Добавляем импорт в $file"
    sed -i "1i import { getApiUrl } from '@/utils/api';" "$file"
  fi
done

echo ""
echo "=== 3. ПРОВЕРКА ИСПРАВЛЕНИЙ ==="
echo "Осталось файлов с localhost:8000:"
grep -r "localhost:8000" frontend/ --include="*.tsx" --include="*.ts" --include="*.js" | wc -l

echo ""
echo "=== 4. ОБНОВЛЕНИЕ PRODUCTION.ENV ==="
echo "Обновление NEXT_PUBLIC_API_URL..."
sed -i "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=http://$SERVER_IP/api|g" config/env/production.env

echo "Проверка обновления:"
grep "NEXT_PUBLIC_API_URL" config/env/production.env

echo ""
echo "=== 5. ПЕРЕСБОРКА FRONTEND ==="
echo "Остановка frontend..."
docker stop agb_frontend_prod
docker rm agb_frontend_prod

echo "Пересборка frontend..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build frontend

echo "Запуск frontend..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d frontend
sleep 15

echo ""
echo "=== 6. ПЕРЕЗАПУСК NGINX ==="
echo "Перезапуск nginx..."
docker restart agb_nginx_prod
sleep 5

echo ""
echo "=== 7. ПРОВЕРКА РЕЗУЛЬТАТА ==="
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
echo "=== 8. СТАТУС ВСЕХ КОНТЕЙНЕРОВ ==="
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
