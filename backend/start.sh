#!/bin/bash

echo "Waiting for database..."
while ! pg_isready -h postgres -U felix_user -d agb_felix; do
  sleep 2
done
echo "Database is ready!"

echo "Applying migrations..."
python create_tables.py

echo "Starting application..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
