#!/bin/bash
# Отладка роутинга на сервере

echo "🔧 Отладка роутинга на сервере..."

# Проверяем статус контейнеров
echo -e "\n📋 Статус контейнеров:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Проверяем логи nginx
echo -e "\n📋 Последние логи nginx (последние 20 строк):"
docker logs --tail 20 agb_nginx

# Проверяем логи backend
echo -e "\n📋 Последние логи backend (последние 20 строк):"
docker logs --tail 20 agb_backend

# Проверяем конфигурацию nginx
echo -e "\n📋 Конфигурация nginx:"
docker exec agb_nginx cat /etc/nginx/nginx.conf

# Проверяем, слушает ли backend порт 8000
echo -e "\n📋 Проверка, что backend слушает порт 8000:"
docker exec agb_backend netstat -tlnp | grep :8000

# Проверяем доступность backend из nginx контейнера
echo -e "\n📋 Проверка доступности backend из nginx:"
docker exec agb_nginx curl -v http://backend:8000/api/health

# Тестируем простой запрос через nginx
echo -e "\n📋 Тест простого запроса через nginx:"
curl -v http://localhost/api/health

echo -e "\n✅ Отладка завершена!"
