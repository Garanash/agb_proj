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
# Удаляем старый volume Postgres (если используется volume docker-compose с именем)
# Попытка найти volume по имени проекта
PG_VOLUME=$(docker volume ls --format '{{.Name}}' | grep -E 'agb_proj.*postgres|postgres_data|agb_postgres' || true)
if [ -n "$PG_VOLUME" ]; then
  echo "Найден volume: $PG_VOLUME. Удаляю..."
  docker volume rm -f "$PG_VOLUME" || true
fi

# На всякий случай удалим контейнер Postgres
docker rm -f "$POSTGRES_CONTAINER" 2>/dev/null || true

echo "=== 3) РЕГЕНЕРАЦИЯ production.env ==="
cat > "$ENV_FILE" <<EOF
# Core
ENV=production

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

# Создаем пользователя/БД явно (на случай пустого кластера)
echo "Создание пользователя и БД, если их нет..."
docker exec -u postgres "$POSTGRES_CONTAINER" psql -v ON_ERROR_STOP=1 -c "DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
      CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASS';
   END IF;
END
$$;"

docker exec -u postgres "$POSTGRES_CONTAINER" psql -v ON_ERROR_STOP=1 -c "DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME') THEN
      CREATE DATABASE $DB_NAME OWNER $DB_USER;
   END IF;
END
$$;"

# Привилегии
docker exec -u postgres "$POSTGRES_CONTAINER" psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
docker exec -u postgres "$POSTGRES_CONTAINER" psql -v ON_ERROR_STOP=1 -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

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

# Применение миграций Alembic (если есть) и создание таблиц
echo "=== 6) МИГРАЦИИ И СОЗДАНИЕ ТАБЛИЦ ==="
if docker exec "$BACKEND_CONTAINER" sh -c "ls -1 alembic/versions/*.py 2>/dev/null | wc -l" | grep -vq '^0$'; then
  echo "Запуск alembic upgrade head..."
  docker exec "$BACKEND_CONTAINER" sh -c "/app/venv/bin/alembic upgrade head" || true
else
  echo "Миграций не найдено, пропускаю alembic"
fi

# create_all из моделей
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
cat > /tmp/seed_users.sql <<EOSQL
DO $$
BEGIN
   IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') THEN
      INSERT INTO users (username, email, hashed_password, first_name, last_name, role, is_active, is_password_changed, created_at)
      VALUES ('admin', '$ADMIN_EMAIL', '$ADMIN_HASH', 'Администратор', 'Системы', 'admin', true, true, NOW());
   ELSE
      UPDATE users SET email='$ADMIN_EMAIL', hashed_password='$ADMIN_HASH', is_active=true, is_password_changed=true, updated_at=NOW() WHERE username='admin';
   END IF;

   IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'd.li') THEN
      INSERT INTO users (username, email, hashed_password, first_name, last_name, role, is_active, is_password_changed, created_at)
      VALUES ('d.li', 'd.li@ved.ru', '$DLI_HASH', 'Дмитрий', 'Ли', 'ved', true, true, NOW());
   ELSE
      UPDATE users SET email='d.li@ved.ru', hashed_password='$DLI_HASH', is_active=true, is_password_changed=true, updated_at=NOW() WHERE username='d.li';
   END IF;
END
$$;
EOSQL

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


