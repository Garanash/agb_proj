#!/bin/bash
set -e

# Полный сброс и восстановление окружения на сервере (выполнять НА СЕРВЕРЕ)
# Предполагается структура /root/agb_proj и docker-compose.prod.yml

APP_DIR="/root/agb_proj"
ENV_FILE="$APP_DIR/config/env/production.env"
COMPOSE_FILE="$APP_DIR/config/docker/docker-compose.prod.yml"
POSTGRES_CONTAINER="agb_postgres_prod"
BACKEND_CONTAINER="agb_backend_prod"

# Значения по умолчанию (можно переопределить переменными окружения)
export DB_NAME=${DB_NAME:-"agb_backend_prod"}
export DB_USER=${DB_USER:-"agb_user"}
export DB_PASS=${DB_PASS:-"secure_password_2024"}
export DB_HOST=${DB_HOST:-"postgres"}
export DB_PORT=${DB_PORT:-"5432"}
export NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-"http://89.23.99.86"}
export ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@local"}
export ADMIN_PASSWORD=${ADMIN_PASSWORD:-"admin123"}

cd "$APP_DIR"

echo "=== 1) ОСТАНОВКА СЕРВИСОВ ==="
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down || true

echo "=== 2) ЧИСТКА ДАННЫХ POSTGRES (drop volumes) ==="
# Удаляем все volumes связанные с проектом
echo "Удаление всех volumes проекта..."
docker volume ls --format '{{.Name}}' | grep -E 'agb_proj|postgres_data|redis_data|uploads_data' | while read volume; do
  echo "Удаляю volume: $volume"
  docker volume rm -f "$volume" || true
done

# На всякий случай удалим контейнер Postgres
docker rm -f "$POSTGRES_CONTAINER" 2>/dev/null || true

echo "=== 3) РЕГЕНЕРАЦИЯ production.env ==="
cat > "$ENV_FILE" <<EOF
# Core
ENV=production
SECRET_KEY=your-secret-key-change-in-production

# API конфигурация
NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Database (для backend)
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASS
POSTGRES_HOST=$DB_HOST
POSTGRES_PORT=$DB_PORT
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME

# Admin
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

# Misc
REDIS_HOST=redis
REDIS_PORT=6379
EOF

echo "production.env пересоздан:"
grep -E 'NEXT_PUBLIC_API_URL|DATABASE_URL|ADMIN_EMAIL' "$ENV_FILE" || true

echo "=== 4) ЗАПУСК И ИНИЦИАЛИЗАЦИЯ СЕРВИСОВ ==="
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d postgres redis

# Ждем готовность Postgres
echo "Ожидание готовности Postgres..."
for i in {1..30}; do
  if docker exec "$POSTGRES_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
    echo "Postgres готов"
    break
  fi
  sleep 2
done

# PostgreSQL контейнер автоматически создаст пользователя и БД из переменных окружения
echo "PostgreSQL контейнер создаст пользователя $DB_USER и БД $DB_NAME автоматически"
sleep 10

echo "=== 5) ЗАПУСК BACKEND/FRONTEND/NGINX ==="
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d backend frontend nginx

# Ждем backend
echo "Ожидание готовности backend..."
for i in {1..30}; do
  if curl -sf http://localhost:8000/api/health >/dev/null; then
    echo "Backend готов"
    break
  fi
  sleep 2
done

# Создание таблиц через Base.metadata.create_all (пропускаем Alembic)
echo "=== 6) СОЗДАНИЕ ТАБЛИЦ ==="
echo "Создание всех таблиц через Base.metadata.create_all..."
docker exec "$BACKEND_CONTAINER" python3 -c "
from database import async_engine, Base
import asyncio

async def main():
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
asyncio.run(main())
print('✅ Все таблицы созданы через Base.metadata.create_all')
"

# Сидинг данных: админ и d.li
echo "=== 7) СОЗДАНИЕ ПОЛЬЗОВАТЕЛЕЙ ==="
# Получаем хеши паролей внутри backend-контейнера
ADMIN_HASH=$(docker exec "$BACKEND_CONTAINER" python3 -c "
from passlib.context import CryptContext
print(CryptContext(schemes=['bcrypt'], deprecated='auto').hash('$ADMIN_PASSWORD'))
")

DLI_HASH=$(docker exec "$BACKEND_CONTAINER" python3 -c "
from passlib.context import CryptContext
print(CryptContext(schemes=['bcrypt'], deprecated='auto').hash('123456'))
")

# Вставка/обновление пользователей
cat > /tmp/seed_users.sql <<'EOSQL'
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') THEN
      INSERT INTO users (username, email, hashed_password, first_name, last_name, role, is_active, is_password_changed, created_at)
      VALUES ('admin', 'admin@local', 'ADMIN_HASH_PLACEHOLDER', 'Администратор', 'Системы', 'admin', true, true, NOW());
   ELSE
      UPDATE users SET email='admin@local', hashed_password='ADMIN_HASH_PLACEHOLDER', is_active=true, is_password_changed=true, updated_at=NOW() WHERE username='admin';
   END IF;

   IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'd.li') THEN
      INSERT INTO users (username, email, hashed_password, first_name, last_name, role, is_active, is_password_changed, created_at)
      VALUES ('d.li', 'd.li@ved.ru', 'DLI_HASH_PLACEHOLDER', 'Дмитрий', 'Ли', 'ved', true, true, NOW());
   ELSE
      UPDATE users SET email='d.li@ved.ru', hashed_password='DLI_HASH_PLACEHOLDER', is_active=true, is_password_changed=true, updated_at=NOW() WHERE username='d.li';
   END IF;
END
$$;
EOSQL

# Заменяем плейсхолдеры на реальные хеши
sed -i "s/ADMIN_HASH_PLACEHOLDER/$ADMIN_HASH/g" /tmp/seed_users.sql
sed -i "s/DLI_HASH_PLACEHOLDER/$DLI_HASH/g" /tmp/seed_users.sql

docker cp /tmp/seed_users.sql "$POSTGRES_CONTAINER":/tmp/seed_users.sql
rm -f /tmp/seed_users.sql

docker exec "$POSTGRES_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/seed_users.sql

echo "=== 8) ПРОВЕРКИ ==="
# Health
curl -s http://localhost:8000/api/health || true

# Тест логина
echo
echo "Тест входа admin..."
curl -s -X POST http://localhost:8000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"'"$ADMIN_PASSWORD"'"}' | head -c 200; echo

echo "Тест входа d.li..."
curl -s -X POST http://localhost:8000/api/v1/auth/login -H 'Content-Type: application/json' -d '{"username":"d.li","password":"123456"}' | head -c 200; echo

echo "=== ГОТОВО ==="


