#!/usr/bin/env python3
"""
Скрипт для обновления данных номенклатуры в базе данных
"""
import asyncio
import sys
import os

# Устанавливаем локальный URL базы данных
os.environ["DATABASE_URL"] = "postgresql+asyncpg://felix_user:felix_password_secure_2024@localhost:15432/agb_felix"

# Добавляем путь к backend для импорта модулей
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from database import AsyncSessionLocal
from models import VEDNomenclature, VedPassport

# Новые данные номенклатуры
nomenclature_data = [
    {
        "code_1c": "УТ-00047870",
        "name": "Коронка импрегнированная ALFA NQ 03-05 высота 12 мм",
        "article": "3501040",
        "matrix": "NQ",
        "drilling_depth": "03-05",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047871",
        "name": "Коронка импрегнированная ALFA NQ 05-07 высота 12 мм",
        "article": "3501041",
        "matrix": "NQ",
        "drilling_depth": "05-07",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047872",
        "name": "Коронка импрегнированная ALFA NQ 07-09 высота 12 мм",
        "article": "3501042",
        "matrix": "NQ",
        "drilling_depth": "07-09",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047873",
        "name": "Коронка импрегнированная ALFA NQ 09-12 высота 12 мм",
        "article": "3501043",
        "matrix": "NQ",
        "drilling_depth": "09-12",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047874",
        "name": "Коронка импрегнированная ALFA NQ 11-13 высота 12 мм",
        "article": "3501044",
        "matrix": "NQ",
        "drilling_depth": "11-13",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047875",
        "name": "Коронка импрегнированная ALFA HQ 03-05 высота 12 мм",
        "article": "3501045",
        "matrix": "HQ",
        "drilling_depth": "03-05",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047876",
        "name": "Коронка импрегнированная ALFA HQ 05-07 высота 12 мм",
        "article": "3501046",
        "matrix": "HQ",
        "drilling_depth": "05-07",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047877",
        "name": "Коронка импрегнированная ALFA HQ 07-09 высота 12 мм",
        "article": "3501047",
        "matrix": "HQ",
        "drilling_depth": "07-09",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047878",
        "name": "Коронка импрегнированная ALFA HQ 09-12 высота 12 мм",
        "article": "3501048",
        "matrix": "HQ",
        "drilling_depth": "09-12",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047879",
        "name": "Коронка импрегнированная ALFA HQ 11-13 высота 12 мм",
        "article": "3501049",
        "matrix": "HQ",
        "drilling_depth": "11-13",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047880",
        "name": "Коронка импрегнированная ALFA PQ 03-05 высота 12 мм",
        "article": "3501050",
        "matrix": "PQ",
        "drilling_depth": "03-05",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047881",
        "name": "Коронка импрегнированная ALFA PQ 05-07 высота 12 мм",
        "article": "3501051",
        "matrix": "PQ",
        "drilling_depth": "05-07",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047882",
        "name": "Коронка импрегнированная ALFA PQ 07-09 высота 12 мм",
        "article": "3501052",
        "matrix": "PQ",
        "drilling_depth": "07-09",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047883",
        "name": "Коронка импрегнированная ALFA PQ 09-12 высота 12 мм",
        "article": "3501053",
        "matrix": "PQ",
        "drilling_depth": "09-12",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047884",
        "name": "Коронка импрегнированная ALFA PQ 11-13 высота 12 мм",
        "article": "3501054",
        "matrix": "PQ",
        "drilling_depth": "11-13",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00047885",
        "name": "Расширитель алмазный ALFA NQ",
        "article": "3501055",
        "matrix": "NQ",
        "drilling_depth": None,
        "height": None,
        "thread": None,
        "product_type": "расширитель"
    },
    {
        "code_1c": "УТ-00047886",
        "name": "Расширитель алмазный ALFA HQ",
        "article": "3501056",
        "matrix": "HQ",
        "drilling_depth": None,
        "height": None,
        "thread": None,
        "product_type": "расширитель"
    },
    {
        "code_1c": "УТ-00047887",
        "name": "Расширитель алмазный ALFA PQ",
        "article": "3501057",
        "matrix": "PQ",
        "drilling_depth": None,
        "height": None,
        "thread": None,
        "product_type": "расширитель"
    },
    {
        "code_1c": "УТ-00047888",
        "name": "Башмак обсадной ALFA NW, резьба W",
        "article": "3501058",
        "matrix": "NW",
        "drilling_depth": None,
        "height": None,
        "thread": "W",
        "product_type": "башмак"
    },
    {
        "code_1c": "УТ-00047889",
        "name": "Башмак обсадной ALFA HW, резьба W",
        "article": "3501059",
        "matrix": "HW",
        "drilling_depth": None,
        "height": None,
        "thread": "W",
        "product_type": "башмак"
    },
    {
        "code_1c": "УТ-00047890",
        "name": "Башмак обсадной ALFA HWT, резьба WT",
        "article": "3501060",
        "matrix": "HWT",
        "drilling_depth": None,
        "height": None,
        "thread": "WT",
        "product_type": "башмак"
    },
    {
        "code_1c": "УТ-00047891",
        "name": "Башмак обсадной ALFA PWT, резьба WT",
        "article": "3501061",
        "matrix": "PWT",
        "drilling_depth": None,
        "height": None,
        "thread": "WT",
        "product_type": "башмак"
    },
    {
        "code_1c": "УТ-00050693",
        "name": "Коронка импрегнированная ALFA HQ3 05-07 высота 12 мм",
        "article": "3501062",
        "matrix": "HQ3",
        "drilling_depth": "05-07",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052789",
        "name": "Коронка импрегнированная ALFA NQ3 03-05 высота 12 мм",
        "article": "3501063",
        "matrix": "NQ3",
        "drilling_depth": "03-05",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052790",
        "name": "Коронка импрегнированная ALFA NQ3 05-07 высота 12 мм",
        "article": "3501064",
        "matrix": "NQ3",
        "drilling_depth": "05-07",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052791",
        "name": "Коронка импрегнированная ALFA NQ3 07-09 высота 12 мм",
        "article": "3501065",
        "matrix": "NQ3",
        "drilling_depth": "07-09",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052792",
        "name": "Коронка импрегнированная ALFA NQ3 09-12 высота 12 мм",
        "article": "3501066",
        "matrix": "NQ3",
        "drilling_depth": "09-12",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052793",
        "name": "Коронка импрегнированная ALFA NQ3 11-13 высота 12 мм",
        "article": "3501067",
        "matrix": "NQ3",
        "drilling_depth": "11-13",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052794",
        "name": "Коронка импрегнированная ALFA HQ3 03-05 высота 12 мм",
        "article": "3501068",
        "matrix": "HQ3",
        "drilling_depth": "03-05",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052795",
        "name": "Коронка импрегнированная ALFA HQ3 07-09 высота 12 мм",
        "article": "3501069",
        "matrix": "HQ3",
        "drilling_depth": "07-09",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052796",
        "name": "Коронка импрегнированная ALFA HQ3 09-12 высота 12 мм",
        "article": "3501070",
        "matrix": "HQ3",
        "drilling_depth": "09-12",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052797",
        "name": "Коронка импрегнированная ALFA HQ3 11-13 высота 12 мм",
        "article": "3501071",
        "matrix": "HQ3",
        "drilling_depth": "11-13",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052798",
        "name": "Коронка импрегнированная ALFA PQ3 03-05 высота 12 мм",
        "article": "3501072",
        "matrix": "PQ3",
        "drilling_depth": "03-05",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052799",
        "name": "Коронка импрегнированная ALFA PQ3 05-07 высота 12 мм",
        "article": "3501073",
        "matrix": "PQ3",
        "drilling_depth": "05-07",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052800",
        "name": "Коронка импрегнированная ALFA PQ3 07-09 высота 12 мм",
        "article": "3501074",
        "matrix": "PQ3",
        "drilling_depth": "07-09",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052801",
        "name": "Коронка импрегнированная ALFA PQ3 09-12 высота 12 мм",
        "article": "3501075",
        "matrix": "PQ3",
        "drilling_depth": "09-12",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    },
    {
        "code_1c": "УТ-00052802",
        "name": "Коронка импрегнированная ALFA PQ3 11-13 высота 12 мм",
        "article": "3501076",
        "matrix": "PQ3",
        "drilling_depth": "11-13",
        "height": "12 мм",
        "thread": None,
        "product_type": "коронка"
    }
]

async def update_nomenclature():
    """Обновляет данные номенклатуры в базе данных"""
    print("🔄 Начинаем обновление номенклатуры...")
    
    async with AsyncSessionLocal() as db:
        try:
            # Сначала удаляем все связанные ВЭД паспорта
            print("🗑️ Удаляем старые ВЭД паспорта...")
            await db.execute(delete(VedPassport))
            
            # Затем удаляем все существующие данные номенклатуры
            print("🗑️ Удаляем старые данные номенклатуры...")
            await db.execute(delete(VEDNomenclature))
            await db.commit()
            
            # Добавляем новые данные
            print(f"➕ Добавляем {len(nomenclature_data)} новых позиций номенклатуры...")
            
            for nom_data in nomenclature_data:
                nomenclature = VEDNomenclature(**nom_data)
                db.add(nomenclature)
            
            await db.commit()
            
            print("✅ Номенклатура успешно обновлена!")
            print(f"📊 Добавлено {len(nomenclature_data)} позиций:")
            
            # Группируем по типам продуктов для статистики
            stats = {}
            for nom in nomenclature_data:
                product_type = nom["product_type"]
                if product_type not in stats:
                    stats[product_type] = 0
                stats[product_type] += 1
            
            for product_type, count in stats.items():
                print(f"   • {product_type}: {count} позиций")
                
        except Exception as e:
            print(f"❌ Ошибка при обновлении номенклатуры: {e}")
            await db.rollback()
            raise

if __name__ == "__main__":
    asyncio.run(update_nomenclature())
