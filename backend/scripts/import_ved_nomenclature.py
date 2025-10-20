import asyncio
import sys
from typing import Dict, Any, Optional

from openpyxl import load_workbook

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

# Используем объекты приложения
from database import async_engine
from models import VEDNomenclature


HEADER_ALIASES: Dict[str, str] = {
    "код": "code_1c",
    "код 1с": "code_1c",
    "code": "code_1c",
    "1c": "code_1c",

    "артикул": "article",
    "article": "article",

    "наименование": "name",
    "наименование товара": "name",
    "name": "name",

    "матрица": "matrix",
    "matrix": "matrix",

    "глубина бурения": "drilling_depth",
    "depth": "drilling_depth",

    "высота": "height",
    "height": "height",

    "резьба": "thread",
    "thread": "thread",

    "тип продукта": "product_type",
    "тип": "product_type",
    "product_type": "product_type",
}


def normalize(s: Optional[str]) -> str:
    return (s or "").strip()


def map_header(name: Any) -> Optional[str]:
    if name is None:
        return None
    key = str(name).strip().lower()
    return HEADER_ALIASES.get(key)


async def upsert_row(db: AsyncSession, row: Dict[str, Any]) -> None:
    code = normalize(row.get("code_1c"))
    article = normalize(row.get("article"))
    name = normalize(row.get("name"))
    matrix = normalize(row.get("matrix"))
    drilling_depth = normalize(row.get("drilling_depth"))
    height = normalize(row.get("height"))
    thread = normalize(row.get("thread"))
    product_type = normalize(row.get("product_type") or "коронка")

    if not code and not article:
        return  # пропускаем пустые строки
    if not name or not matrix:
        return

    # Ищем по code_1c, если есть, иначе по article
    stmt = None
    if code:
        stmt = select(VEDNomenclature).where(VEDNomenclature.code_1c == code)
    else:
        stmt = select(VEDNomenclature).where(VEDNomenclature.article == article)

    result = await db.execute(stmt)
    entity: Optional[VEDNomenclature] = result.scalar_one_or_none()

    if entity is None:
        entity = VEDNomenclature(
            code_1c=code or f"ART-{article}",
            name=name,
            article=article or code,
            matrix=matrix,
            drilling_depth=drilling_depth or None,
            height=height or None,
            thread=thread or None,
            product_type=product_type or "коронка",
            is_active=True,
        )
        db.add(entity)
    else:
        # Обновляем поля
        entity.name = name or entity.name
        entity.article = (article or entity.article)
        entity.matrix = matrix or entity.matrix
        entity.drilling_depth = drilling_depth or entity.drilling_depth
        entity.height = height or entity.height
        entity.thread = thread or entity.thread
        entity.product_type = product_type or entity.product_type


async def import_file(path: str, sheet: Optional[str] = None) -> None:
    wb = load_workbook(filename=path, data_only=True)
    ws = wb[sheet] if sheet else wb.active

    # Читаем заголовки
    headers = [map_header(cell.value) for cell in next(ws.iter_rows(min_row=1, max_row=1))[0:]]
    indices = {i: h for i, h in enumerate(headers) if h}

    total = 0
    created_or_updated = 0

    async with async_engine.begin() as conn:
        async with AsyncSession(async_engine, expire_on_commit=False) as db:
            for row in ws.iter_rows(min_row=2):
                total += 1
                data: Dict[str, Any] = {}
                empty = True
                for idx, cell in enumerate(row):
                    key = indices.get(idx)
                    if not key:
                        continue
                    value = cell.value
                    if isinstance(value, str):
                        value = value.strip()
                    if value not in (None, ""):
                        empty = False
                    data[key] = value
                if empty:
                    continue
                await upsert_row(db, data)
                created_or_updated += 1
            await db.commit()

    print(f"Импорт завершен. Обработано строк: {total}, записей создано/обновлено: {created_or_updated}")


def main():
    if len(sys.argv) < 2:
        print("Использование: python scripts/import_ved_nomenclature.py <path_to_xlsx> [sheet_name]")
        sys.exit(1)
    path = sys.argv[1]
    sheet = sys.argv[2] if len(sys.argv) > 2 else None
    asyncio.run(import_file(path, sheet))


if __name__ == "__main__":
    main()


