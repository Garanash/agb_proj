#!/bin/sh
set -e

# Импорт номенклатуры ALFA в Postgres на сервере (через backend-контейнер)
# Использование:
#   ./scripts/import_alfa_to_server.sh \
#       "/root/agb_proj/Номенклатура алмазный инстурмент ALFA.xlsx" [Лист]

APP_DIR="/root/agb_proj"
BACKEND_CONTAINER="agb_backend_prod"

XLSX_PATH="${1:-}"
SHEET_NAME="${2:-}"

if [ -z "$XLSX_PATH" ]; then
  echo "Укажите путь к .xlsx файлу."
  echo "Пример: ./scripts/import_alfa_to_server.sh \"$APP_DIR/Номенклатура алмазный инстурмент ALFA.xlsx\""
  exit 1
fi

if [ ! -f "$XLSX_PATH" ]; then
  echo "❌ Файл не найден: $XLSX_PATH"
  exit 1
fi

echo "=== Копирую файл и скрипт в контейнер ... ==="
docker cp "$XLSX_PATH" "$BACKEND_CONTAINER":/tmp/alfa.xlsx
docker cp "$APP_DIR/backend/scripts/import_ved_nomenclature.py" "$BACKEND_CONTAINER":/app/scripts/import_ved_nomenclature.py

echo "=== Запускаю импорт ... ==="
if [ -n "$SHEET_NAME" ]; then
  docker exec -w /app "$BACKEND_CONTAINER" /app/venv/bin/python scripts/import_ved_nomenclature.py /tmp/alfa.xlsx "$SHEET_NAME"
else
  docker exec -w /app "$BACKEND_CONTAINER" /app/venv/bin/python scripts/import_ved_nomenclature.py /tmp/alfa.xlsx
fi

echo "=== Проверяю количество записей в ved_nomenclature ... ==="
docker exec -i agb_postgres_prod psql -U agb_user -d agb_backend_prod -c "SELECT COUNT(*) FROM ved_nomenclature;"

echo "Готово."


