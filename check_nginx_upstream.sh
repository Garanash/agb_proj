#!/bin/bash
# Проверка upstream серверов в nginx

echo "🔍 Проверка upstream серверов nginx..."

# Проверяем, доступен ли backend из nginx контейнера
echo -e "\n📊 Проверка доступности backend:8000 из nginx:"
docker exec agb_nginx curl -v --connect-timeout 5 http://backend:8000/api/health

# Проверяем, доступен ли frontend из nginx контейнера
echo -e "\n📊 Проверка доступности frontend:3000 из nginx:"
docker exec agb_nginx curl -v --connect-timeout 5 http://frontend:3000/

# Проверяем DNS разрешение в nginx контейнере
echo -e "\n📊 Проверка DNS в nginx контейнере:"
docker exec agb_nginx nslookup backend
docker exec agb_nginx nslookup frontend

# Проверяем сетевые подключения
echo -e "\n📊 Проверка сетевых подключений из nginx:"
docker exec agb_nginx ping -c 3 backend
docker exec agb_nginx ping -c 3 frontend

# Проверяем upstream статус
echo -e "\n📊 Проверка nginx upstream статуса:"
docker exec agb_nginx curl -s http://localhost/nginx_status

echo -e "\n✅ Проверка upstream завершена!"
