#!/bin/sh
set -e

# Авто-фикс проблем с NEXT_PUBLIC_API_URL и пересборка фронтенда
# Использование:
#   ./scripts/fix_next_public_api_url.sh [BASE_URL]
# Примеры:
#   ./scripts/fix_next_public_api_url.sh http://89.23.99.86
#   ./scripts/fix_next_public_api_url.sh https://portal.company.ru

APP_DIR="/root/agb_proj"
ENV_FILE="$APP_DIR/config/env/production.env"
COMPOSE_FILE="$APP_DIR/config/docker/docker-compose.prod.yml"

# 1) Определяем BASE_URL
BASE_URL="$1"

# Если не передали — попытаемся определить по публичному IP
if [ -z "$BASE_URL" ]; then
  if command -v curl >/dev/null 2>&1; then
    IP=$(curl -s ifconfig.me || true)
    if [ -n "$IP" ]; then
      BASE_URL="http://$IP"
    fi
  fi
fi

if [ -z "$BASE_URL" ]; then
  echo "❌ Не удалось определить BASE_URL. Укажите вручную:"
  echo "   ./scripts/fix_next_public_api_url.sh http://89.23.99.86"
  exit 1
fi

echo "=== 🛠 ФИКС NEXT_PUBLIC_API_URL ==="
echo "Используем BASE_URL: $BASE_URL"

# 2) Обновляем production.env
echo "Обновляю $ENV_FILE ..."
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Файл $ENV_FILE не найден"
  exit 1
fi

# Обновить/добавить строку NEXT_PUBLIC_API_URL
if grep -q '^NEXT_PUBLIC_API_URL=' "$ENV_FILE"; then
  sed -i "s|^NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$BASE_URL|" "$ENV_FILE"
else
  echo "NEXT_PUBLIC_API_URL=$BASE_URL" >> "$ENV_FILE"
fi

echo "Текущее значение:" && grep '^NEXT_PUBLIC_API_URL=' "$ENV_FILE" || true

# 3) Пересборка фронтенда с новым env и запуск
echo "Пересобираю frontend с --no-cache ..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache frontend

echo "Запускаю frontend ..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d frontend

# 4) Перезапустим nginx (на случай кеша)
echo "Перезапуск nginx ..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart nginx || true

# 5) Проверки
echo "=== Проверки ==="
echo "Переменные окружения внутри frontend-контейнера:"
docker exec agb_frontend_prod env | grep NEXT_PUBLIC_API_URL || true

echo "Проверка root страницы frontend (первые 100 символов):"
curl -s http://localhost:3000 | head -c 100 || echo "⚠️ Не удалось получить ответ от frontend на 3000"
echo

echo "Проверка health backend:"
curl -s http://localhost:8000/api/health || echo "⚠️ Backend health недоступен"
echo

echo "Готово. Обновите страницу в браузере c очисткой кэша (Cmd/Ctrl+Shift+R)."


