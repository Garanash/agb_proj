#!/bin/bash

# Скрипт инициализации базы данных для продакшена
# Запускается при первом деплое

set -e

echo "🗄️ Инициализация базы данных для продакшена..."

# Ждем запуска PostgreSQL
echo "⏳ Ждем запуска PostgreSQL..."
sleep 15

# Проверяем подключение к базе данных
echo "🔍 Проверяем подключение к PostgreSQL..."
until docker-compose exec -T postgres pg_isready -U felix_user -d agb_felix; do
  echo "PostgreSQL не готов, ждем..."
  sleep 5
done

echo "✅ PostgreSQL готов!"

# Создаем таблицы
echo "📋 Создаем таблицы..."
docker-compose exec -T backend python -c "
import asyncio
from database import engine
from models import Base

async def create_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print('✅ Таблицы созданы!')

asyncio.run(create_tables())
"

# Создаем администратора
echo "👤 Создаем администратора..."
docker-compose exec -T backend python init_db.py

# Проверяем, что администратор создан
echo "🔍 Проверяем создание администратора..."
docker-compose exec -T backend python -c "
import asyncio
from database import get_db_url
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check_admin():
    engine = create_async_engine(get_db_url())
    async with engine.connect() as conn:
        result = await conn.execute(text('SELECT COUNT(*) FROM users WHERE role = \"admin\"'))
        count = result.scalar()
        if count > 0:
            print('✅ Администратор создан!')
        else:
            print('❌ Администратор не найден')
    await engine.dispose()

asyncio.run(check_admin())
"

# Загружаем номенклатуру ВЭД
echo "📦 Загружаем номенклатуру ВЭД..."
docker-compose exec -T backend python init_ved_nomenclature.py

# Проверяем загрузку номенклатуры
echo "🔍 Проверяем загрузку номенклатуры..."
docker-compose exec -T backend python -c "
import asyncio
from database import get_db_url
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def check_nomenclature():
    engine = create_async_engine(get_db_url())
    async with engine.connect() as conn:
        result = await conn.execute(text('SELECT COUNT(*) FROM ved_nomenclature'))
        count = result.scalar()
        print(f'✅ Загружено {count} позиций номенклатуры ВЭД')
    await engine.dispose()

asyncio.run(check_nomenclature())
"

echo "✅ Инициализация базы данных завершена!"
echo ""
echo "📊 Статистика инициализации:"
echo "- ✅ Таблицы созданы"
echo "- ✅ Администратор создан (admin/admin123)"
echo "- ✅ Номенклатура ВЭД загружена"
echo ""
echo "🚀 Приложение готово к работе!"
