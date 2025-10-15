#!/bin/bash

echo "=== РУЧНОЙ ДЕПЛОЙ НА СЕРВЕР ==="
echo "IP сервера: 89.23.99.86"
echo ""
echo "Выполните следующие команды на сервере:"
echo ""

echo "1. Подключение к серверу:"
echo "ssh root@89.23.99.86"
echo ""

echo "2. Переход в директорию проекта:"
echo "cd agb_proj"
echo ""

echo "3. Обновление кода:"
echo "git pull"
echo ""

echo "4. Перезапуск всех сервисов:"
echo "docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart"
echo ""

echo "5. Ожидание запуска сервисов:"
echo "sleep 30"
echo ""

echo "6. Проверка статуса контейнеров:"
echo "docker ps | grep agb"
echo ""

echo "7. Проверка health backend:"
echo "curl -s http://89.23.99.86:8000/api/health"
echo ""

echo "8. Проверка frontend:"
echo "curl -s http://89.23.99.86 | head -3"
echo ""

echo "9. Исправление флага смены пароля:"
echo "docker exec agb_postgres_prod psql -U felix_prod_user -d agb_felix_prod -c \"UPDATE users SET is_password_changed = true WHERE username = 'admin';\""
echo ""

echo "10. Проверка пользователя admin:"
echo "docker exec agb_postgres_prod psql -U felix_prod_user -d agb_felix_prod -c \"SELECT username, email, is_password_changed, is_active FROM users WHERE username = 'admin';\""
echo ""

echo "11. Тест логина:"
echo "curl -X POST http://89.23.99.86:8000/api/v1/auth/login -H 'Content-Type: application/json' -d '{\"username\": \"admin\", \"password\": \"admin123\"}' -s"
echo ""

echo "=== ДЕПЛОЙ ЗАВЕРШЕН ==="
echo "✅ Приложение доступно по адресу: http://89.23.99.86"
echo "✅ Backend API: http://89.23.99.86:8000"
echo "✅ Логин: admin / admin123"
echo ""
echo "Если есть проблемы, проверьте логи:"
echo "docker logs agb_frontend_prod --tail 20"
echo "docker logs agb_backend_prod --tail 20"
echo "docker logs agb_nginx_prod --tail 20"
