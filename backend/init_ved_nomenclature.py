#!/usr/bin/env python3
"""
Скрипт для инициализации номенклатуры ВЭД при создании базы данных
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
import os

# Импортируем модели
from models import VEDNomenclature, Base
from database import DATABASE_URL

# Данные номенклатуры
VED_NOMENCLATURE_DATA = [
    # Коронки импрегнированные
    {"code_1c": "УТ-00047870", "name": "Коронка импрегнированная", "article": "3501040", "matrix": "NQ", "drilling_depth": "03-05", "height": "12 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047871", "name": "Коронка импрегнированная", "article": "3501041", "matrix": "NQ", "drilling_depth": "05-07", "height": "12 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047872", "name": "Коронка импрегнированная", "article": "3501042", "matrix": "NQ", "drilling_depth": "07-09", "height": "13 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047873", "name": "Коронка импрегнированная", "article": "3501043", "matrix": "NQ", "drilling_depth": "09-12", "height": "14 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047874", "name": "Коронка импрегнированная", "article": "3501044", "matrix": "HQ", "drilling_depth": "11-13", "height": "15 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047875", "name": "Коронка импрегнированная", "article": "3501045", "matrix": "HQ", "drilling_depth": "03-05", "height": "16 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047876", "name": "Коронка импрегнированная", "article": "3501046", "matrix": "HQ", "drilling_depth": "05-07", "height": "17 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047877", "name": "Коронка импрегнированная", "article": "3501047", "matrix": "HQ", "drilling_depth": "07-09", "height": "18 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047878", "name": "Коронка импрегнированная", "article": "3501048", "matrix": "HQ", "drilling_depth": "09-12", "height": "19 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047879", "name": "Коронка импрегнированная", "article": "3501049", "matrix": "HQ", "drilling_depth": "11-13", "height": "20 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047880", "name": "Коронка импрегнированная", "article": "3501050", "matrix": "PQ", "drilling_depth": "03-05", "height": "21 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047881", "name": "Коронка импрегнированная", "article": "3501051", "matrix": "PQ", "drilling_depth": "05-07", "height": "22 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047882", "name": "Коронка импрегнированная", "article": "3501052", "matrix": "PQ", "drilling_depth": "07-09", "height": "23 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047883", "name": "Коронка импрегнированная", "article": "3501053", "matrix": "PQ", "drilling_depth": "09-12", "height": "24 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00047884", "name": "Коронка импрегнированная", "article": "3501054", "matrix": "PQ", "drilling_depth": "11-13", "height": "25 мм", "thread": "", "product_type": "коронка"},
    {"code_1c": "УТ-00050693", "name": "Коронка импрегнированная", "article": "3501062", "matrix": "HQ3", "drilling_depth": "05-07", "height": "12", "thread": "", "product_type": "коронка"},

    # Расширители алмазные
    {"code_1c": "УТ-00047885", "name": "Расширитель алмазный", "article": "3501055", "matrix": "NQ", "drilling_depth": "", "height": "", "thread": "", "product_type": "расширитель"},
    {"code_1c": "УТ-00047886", "name": "Расширитель алмазный", "article": "3501056", "matrix": "HQ", "drilling_depth": "", "height": "", "thread": "", "product_type": "расширитель"},
    {"code_1c": "УТ-00047887", "name": "Расширитель алмазный", "article": "3501057", "matrix": "PQ", "drilling_depth": "", "height": "", "thread": "", "product_type": "расширитель"},

    # Башмаки обсадные
    {"code_1c": "УТ-00047888", "name": "Башмак обсадной", "article": "3501058", "matrix": "NW", "drilling_depth": "", "height": "", "thread": "W", "product_type": "башмак"},
    {"code_1c": "УТ-00047889", "name": "Башмак обсадной", "article": "3501059", "matrix": "HW", "drilling_depth": "", "height": "", "thread": "W", "product_type": "башмак"},
    {"code_1c": "УТ-00047890", "name": "Башмак обсадной", "article": "3501060", "matrix": "HWT", "drilling_depth": "", "height": "", "thread": "WT", "product_type": "башмак"},
    {"code_1c": "УТ-00047891", "name": "Башмак обсадной", "article": "3501061", "matrix": "PWT", "drilling_depth": "", "height": "", "thread": "WT", "product_type": "башмак"},
]


async def init_ved_nomenclature():
    """Инициализация номенклатуры ВЭД"""
    # Используем URL из переменной окружения или стандартный для контейнера
    database_url = DATABASE_URL

    # Создаем engine
    engine = create_async_engine(database_url, echo=False)

    # Создаем таблицы если они не существуют
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Создаем сессию
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        try:
            print("🔄 Начинаем инициализацию номенклатуры ВЭД...")

            # Проверяем, есть ли уже данные
            result = await session.execute(select(VEDNomenclature))
            existing_items = result.scalars().all()

            if existing_items:
                print(f"✅ Номенклатура ВЭД уже инициализирована ({len(existing_items)} элементов)")
                return

            # Добавляем данные номенклатуры
            for item_data in VED_NOMENCLATURE_DATA:
                nomenclature_item = VEDNomenclature(**item_data)
                session.add(nomenclature_item)

            await session.commit()
            print(f"✅ Успешно добавлено {len(VED_NOMENCLATURE_DATA)} элементов номенклатуры ВЭД")

        except Exception as e:
            print(f"❌ Ошибка при инициализации номенклатуры ВЭД: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def main():
    """Основная функция"""
    await init_ved_nomenclature()


if __name__ == "__main__":
    asyncio.run(main())
