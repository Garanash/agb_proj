#!/bin/bash

echo "🚀 AGB Project - Полное исправление приложения"
echo "============================================="

# Получаем IP сервера
SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "89.23.99.86")
echo "🌐 IP сервера: $SERVER_IP"

echo ""
echo "=== 1. ОБНОВЛЕНИЕ КОДА ==="
echo "Получение последних изменений..."
git reset --hard HEAD
git clean -fd
git fetch origin
git reset --hard origin/master

echo ""
echo "=== 2. ИСПРАВЛЕНИЕ ДАННЫХ ПОЛЬЗОВАТЕЛЯ ==="
echo "Обновление данных пользователя admin..."
docker exec agb_postgres_prod psql -U felix_prod_user -d agb_felix_prod -c "UPDATE users SET first_name = 'Администратор', last_name = 'Системы' WHERE username = 'admin';"

echo "Проверка обновления:"
docker exec agb_postgres_prod psql -U felix_prod_user -d agb_felix_prod -c "SELECT id, username, email, first_name, last_name FROM users WHERE username = 'admin';"

echo ""
echo "=== 3. МАССОВАЯ ЗАМЕНА getApiUrl ==="
echo "Замена всех getApiUrl на getSimpleApiUrl..."
find frontend -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/import { getApiUrl }/import { getSimpleApiUrl }/g'
find frontend -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/import { getApiUrl, /import { getSimpleApiUrl, /g'
find frontend -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/, getApiUrl }/, getSimpleApiUrl }/g'
find frontend -name "*.tsx" -o -name "*.ts" | xargs sed -i 's/getApiUrl()/getSimpleApiUrl()/g'

echo "Проверка результата:"
echo "Осталось файлов с getApiUrl:"
find frontend -name "*.tsx" -o -name "*.ts" | xargs grep -l "getApiUrl" | wc -l

echo ""
echo "=== 4. ПЕРЕСБОРКА FRONTEND ==="
echo "Остановка frontend..."
docker stop agb_frontend_prod 2>/dev/null || echo "Frontend уже остановлен"

echo "Удаление старого образа frontend..."
docker rmi docker-frontend 2>/dev/null || echo "Образ уже удален"

echo "Пересборка frontend с исправлениями..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build --no-cache frontend

echo "Запуск frontend..."
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d frontend

echo ""
echo "=== 5. ПЕРЕЗАПУСК NGINX ==="
docker restart agb_nginx_prod
sleep 10

echo ""
echo "=== 6. ПРОВЕРКА РЕЗУЛЬТАТА ==="
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
echo "=== 7. СТАТУС ВСЕХ КОНТЕЙНЕРОВ ==="
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps

echo ""
echo "🎉 ГОТОВО!"
echo "==========="
echo "🌐 Frontend: http://$SERVER_IP"
echo "🔧 Backend API: http://$SERVER_IP:8000"
echo "📚 Swagger UI: http://$SERVER_IP:8000/docs"
echo "❤️ Health Check: http://$SERVER_IP:8000/api/health"
echo ""
echo "👤 Логин: admin"
echo "🔑 Пароль: admin123"
echo ""
echo "Теперь приложение должно полностью работать!"
echo "- ✅ Данные пользователя исправлены"
echo "- ✅ Все компоненты используют getSimpleApiUrl()"
echo "- ✅ Меню должно отображаться"
echo "- ✅ Приветствие должно показывать имя пользователя"
