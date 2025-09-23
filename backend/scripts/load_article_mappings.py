#!/usr/bin/env python3
"""
Скрипт для загрузки базы данных соответствий артикулов из Excel файла
"""

import asyncio
import pandas as pd
import sys
import os
from pathlib import Path

# Добавляем путь к проекту
sys.path.append(str(Path(__file__).parent.parent))

from database import async_session
from models import ArticleMapping, VEDNomenclature
from sqlalchemy import select


async def load_article_mappings_from_excel(excel_path: str):
    """Загружает соответствия артикулов из Excel файла"""
    
    print(f"📁 Загружаем файл: {excel_path}")
    
    try:
        # Читаем Excel файл
        df = pd.read_excel(excel_path)
        print(f"📊 Найдено {len(df)} строк в файле")
        print(f"📋 Колонки: {list(df.columns)}")
        
        # Показываем первые несколько строк для понимания структуры
        print("\n🔍 Первые 5 строк файла:")
        print(df.head())
        
    except Exception as e:
        print(f"❌ Ошибка при чтении файла: {e}")
        return
    
    async with async_session() as db:
        try:
            # Получаем всю номенклатуру для сопоставления
            nomenclature_result = await db.execute(
                select(VEDNomenclature).where(VEDNomenclature.is_active == True)
            )
            nomenclature_list = nomenclature_result.scalars().all()
            
            print(f"📦 Найдено {len(nomenclature_list)} активных позиций номенклатуры")
            
            # Создаем словарь для быстрого поиска по артикулу
            nomenclature_by_article = {n.article: n for n in nomenclature_list}
            nomenclature_by_code = {n.code_1c: n for n in nomenclature_list}
            
            loaded_count = 0
            skipped_count = 0
            errors = []
            
            # Обрабатываем каждую строку
            for index, row in df.iterrows():
                try:
                    # Извлекаем данные из строки
                    # Адаптируем под структуру файла "База данных соответствий.xlsx"
                    contractor_article = str(row.get('Артикул контрагента', row.get('Артикул', ''))).strip()
                    contractor_description = str(row.get('Описание контрагента', row.get('Описание', ''))).strip()
                    agb_article = str(row.get('Артикул АГБ', row.get('АГБ', ''))).strip()
                    agb_description = str(row.get('Описание АГБ', row.get('Описание АГБ', ''))).strip()
                    bl_article = str(row.get('Артикул BL', row.get('BL', ''))).strip() if pd.notna(row.get('Артикул BL', row.get('BL', ''))) else None
                    bl_description = str(row.get('Описание BL', row.get('Описание BL', ''))).strip() if pd.notna(row.get('Описание BL', row.get('BL', ''))) else None
                    packaging_factor = int(row.get('Коэффициент фасовки', row.get('Фасовка', 1))) if pd.notna(row.get('Коэффициент фасовки', row.get('Фасовка', 1))) else 1
                    unit = str(row.get('Единица', row.get('Ед.', 'шт'))).strip()
                    
                    # Пропускаем пустые строки
                    if not contractor_article or not agb_article:
                        skipped_count += 1
                        continue
                    
                    # Ищем соответствующую номенклатуру
                    nomenclature = None
                    if agb_article in nomenclature_by_article:
                        nomenclature = nomenclature_by_article[agb_article]
                    elif agb_article in nomenclature_by_code:
                        nomenclature = nomenclature_by_code[agb_article]
                    
                    # Проверяем, не существует ли уже такое соответствие
                    existing = await db.execute(
                        select(ArticleMapping).where(
                            ArticleMapping.contractor_article == contractor_article,
                            ArticleMapping.agb_article == agb_article
                        )
                    )
                    if existing.scalar_one_or_none():
                        skipped_count += 1
                        continue
                    
                    # Создаем новое соответствие
                    new_mapping = ArticleMapping(
                        contractor_article=contractor_article,
                        contractor_description=contractor_description,
                        agb_article=agb_article,
                        agb_description=agb_description,
                        bl_article=bl_article if bl_article and bl_article != 'nan' else None,
                        bl_description=bl_description if bl_description and bl_description != 'nan' else None,
                        packaging_factor=packaging_factor,
                        unit=unit,
                        nomenclature_id=nomenclature.id if nomenclature else None
                    )
                    
                    db.add(new_mapping)
                    loaded_count += 1
                    
                    if loaded_count % 100 == 0:
                        print(f"📝 Обработано {loaded_count} записей...")
                    
                except Exception as e:
                    errors.append(f"Строка {index + 1}: {str(e)}")
                    continue
            
            # Сохраняем изменения
            await db.commit()
            
            print(f"\n✅ Загрузка завершена!")
            print(f"📊 Загружено: {loaded_count} соответствий")
            print(f"⏭️ Пропущено: {skipped_count} записей")
            print(f"❌ Ошибок: {len(errors)}")
            
            if errors:
                print("\n🔍 Ошибки:")
                for error in errors[:10]:  # Показываем первые 10 ошибок
                    print(f"  - {error}")
                if len(errors) > 10:
                    print(f"  ... и еще {len(errors) - 10} ошибок")
            
        except Exception as e:
            await db.rollback()
            print(f"❌ Ошибка при загрузке в базу данных: {e}")
            raise


async def main():
    """Основная функция"""
    excel_path = "/Users/andreydolgov/Downloads/База данных соответствий.xlsx"
    
    if not os.path.exists(excel_path):
        print(f"❌ Файл не найден: {excel_path}")
        print("📝 Убедитесь, что файл 'База данных соответствий.xlsx' находится в папке Downloads")
        return
    
    print("🚀 Начинаем загрузку базы данных соответствий артикулов")
    print("=" * 60)
    
    await load_article_mappings_from_excel(excel_path)
    
    print("=" * 60)
    print("🎉 Загрузка завершена!")


if __name__ == "__main__":
    asyncio.run(main())



