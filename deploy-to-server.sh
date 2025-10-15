#!/bin/bash

echo "=== ДЕПЛОЙ НА СЕРВЕР ==="
echo "IP сервера: 89.23.99.86"
echo ""

echo "1. Обновление кода на сервере:"
ssh root@89.23.99.86 "cd agb_proj && git pull"

echo ""
echo "2. Перезапуск всех сервисов:"
ssh root@89.23.99.86 "cd agb_proj && docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart"

echo ""
echo "3. Ожидание запуска сервисов:"
sleep 30

echo ""
echo "4. Проверка статуса контейнеров:"
ssh root@89.23.99.86 "docker ps | grep agb"

echo ""
echo "5. Проверка health backend:"
ssh root@89.23.99.86 "curl -s http://89.23.99.86:8000/api/health"

echo ""
echo "6. Проверка frontend:"
ssh root@89.23.99.86 "curl -s http://89.23.99.86 | head -3"

echo ""
echo "7. Исправление флага смены пароля:"
ssh root@89.23.99.86 "docker exec agb_postgres_prod psql -U felix_prod_user -d agb_felix_prod -c \"UPDATE users SET is_password_changed = true WHERE username = 'admin';\""

echo ""
echo "8. Проверка пользователя admin:"
ssh root@89.23.99.86 "docker exec agb_postgres_prod psql -U felix_prod_user -d agb_felix_prod -c \"SELECT username, email, is_password_changed, is_active FROM users WHERE username = 'admin';\""

echo ""
echo "9. Тест логина:"
ssh root@89.23.99.86 "curl -X POST http://89.23.99.86:8000/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"username\": \"admin\", \"password\": \"admin123\"}' -s"

echo ""
echo "=== ДЕПЛОЙ ЗАВЕРШЕН ==="
echo "✅ Приложение доступно по адресу: http://89.23.99.86"
echo "✅ Backend API: http://89.23.99.86:8000"
echo "✅ Логин: admin / admin123"
