#!/bin/bash
# Полная диагностика проблемы с логином

echo "🔍 ПОЛНАЯ ДИАГНОСТИКА ПРОБЛЕМЫ С ЛОГИНОМ"
echo "========================================"

# 1. Проверяем статус контейнеров
echo -e "\n📋 1. Статус контейнеров:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. Проверяем логи backend
echo -e "\n📋 2. Последние логи backend:"
docker logs --tail 10 agb_backend

# 3. Проверяем логи nginx
echo -e "\n📋 3. Последние логи nginx:"
docker logs --tail 10 agb_nginx

# 4. Проверяем доступность backend из nginx
echo -e "\n📋 4. Проверяем доступность backend из nginx:"
docker exec agb_nginx curl -s http://backend:8000/api/health

# 5. Проверяем прямой доступ к backend
echo -e "\n📋 5. Проверяем прямой доступ к backend:"
curl -s http://localhost:8000/api/health

# 6. Проверяем доступ через nginx
echo -e "\n📋 6. Проверяем доступ через nginx:"
curl -s http://localhost/api/health

# 7. Тестируем логин через backend напрямую
echo -e "\n📋 7. Тестируем логин через backend напрямую:"
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq .

# 8. Тестируем логин через nginx
echo -e "\n📋 8. Тестируем логин через nginx:"
curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq .

# 9. Проверяем данные в базе
echo -e "\n📋 9. Проверяем админа в базе данных:"
docker exec agb_postgres psql -U felix_user -d agb_felix -c "
SELECT id, username, email, is_active, role,
       CASE WHEN hashed_password IS NOT NULL THEN 'HAS_HASH' ELSE 'NO_HASH' END as password_status
FROM users WHERE username = 'admin';"

# 10. Проверяем сетевые настройки
echo -e "\n📋 10. Проверяем сетевые настройки:"
docker network ls
docker network inspect agb_proj_app-network | grep -A 10 "Containers"

echo -e "\n✅ ДИАГНОСТИКА ЗАВЕРШЕНА!"
echo -e "\n💡 Возможные проблемы:"
echo "   - Nginx не может подключиться к backend"
echo "   - Проблема с CORS"
echo "   - Неправильный пароль в базе данных"
echo "   - Проблема с JWT токенами"
echo -e "\n🔧 Рекомендации:"
echo "   - Если backend напрямую работает, но через nginx нет - проблема в nginx"
echo "   - Если backend не работает - проверьте логи backend'а"
echo "   - Если пароль неправильный - пересоздайте админа"
