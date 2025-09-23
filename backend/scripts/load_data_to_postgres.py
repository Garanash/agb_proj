#!/usr/bin/env python3
"""
Скрипт для загрузки данных из Excel файла в PostgreSQL
"""
import pandas as pd
import asyncio
import sys
import os
from pathlib import Path

# Добавляем корневую директорию проекта в путь
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from database import get_db
from models import MatchingNomenclature, ArticleMapping
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def load_data_to_postgres():
    """Загружает данные из Excel файла в PostgreSQL"""
    
    # Путь к файлу
    excel_file = "/Users/andreydolgov/Downloads/База данных соответствий.xlsx"
    
    if not os.path.exists(excel_file):
        logger.error(f"Файл не найден: {excel_file}")
        return
    
    try:
        # Читаем Excel файл
        logger.info("Читаем Excel файл...")
        df = pd.read_excel(excel_file)
        
        logger.info(f"Загружено {len(df)} строк из Excel файла")
        
        # Получаем сессию базы данных
        async for db in get_db():
            try:
                # Не удаляем существующие данные, чтобы не нарушить внешние ключи
                # Просто добавляем новые данные
                
                # Загружаем данные в базу
                await process_excel_data(df, db)
                
                logger.info("Данные успешно загружены в PostgreSQL!")
                break
                
            except Exception as e:
                logger.error(f"Ошибка при загрузке в базу данных: {e}")
                await db.rollback()
                raise
            finally:
                await db.close()
                
    except Exception as e:
        logger.error(f"Ошибка при чтении Excel файла: {e}")

async def process_excel_data(df: pd.DataFrame, db: AsyncSession):
    """Обрабатывает данные из Excel и загружает их в PostgreSQL"""
    
    # Маппинг колонок на основе изученной структуры файла
    column_mapping = {
        'article': 'Артикул АГБ',      # Артикул АГБ
        'name': 'Номенклатура АГБ',     # Название
        'code_1c': 'Код',              # Код (УТ-код)
        'bl_article': 'Артикул BL',    # Артикул BL
        'packaging': 'Фасовка для химии, кг.',  # Фасовка
        'unit': 'Ед.изм.',             # Единица измерения
    }
    
    logger.info(f"Маппинг колонок: {column_mapping}")
    
    # Загружаем данные в MatchingNomenclature
    nomenclatures_created = 0
    nomenclatures_updated = 0
    mappings_created = 0
    
    for index, row in df.iterrows():
        try:
            # Извлекаем данные из строки
            article = str(row[column_mapping['article']]).strip() if pd.notna(row[column_mapping['article']]) else None
            name = str(row[column_mapping['name']]).strip() if pd.notna(row[column_mapping['name']]) else None
            code_1c = str(row[column_mapping['code_1c']]).strip() if pd.notna(row[column_mapping['code_1c']]) else None
            bl_article = str(row[column_mapping['bl_article']]).strip() if pd.notna(row[column_mapping['bl_article']]) else None
            packaging = row[column_mapping['packaging']] if pd.notna(row[column_mapping['packaging']]) else None
            unit = str(row[column_mapping['unit']]).strip() if pd.notna(row[column_mapping['unit']]) else None
            
            # Пропускаем пустые строки
            if not article or article == 'nan':
                continue
            
            # Проверяем, существует ли уже такая номенклатура
            result = await db.execute(
                select(MatchingNomenclature).where(MatchingNomenclature.agb_article == article)
            )
            existing_nom = result.scalar_one_or_none()
            
            if existing_nom:
                # Обновляем существующую номенклатуру
                existing_nom.name = name or existing_nom.name
                existing_nom.code_1c = code_1c or existing_nom.code_1c
                existing_nom.bl_article = bl_article or existing_nom.bl_article
                existing_nom.packaging = packaging or existing_nom.packaging
                existing_nom.unit = unit or existing_nom.unit
                nomenclatures_updated += 1
            else:
                # Создаем новую номенклатуру
                new_nom = MatchingNomenclature(
                    agb_article=article,
                    name=name or '',
                    code_1c=code_1c or '',
                    bl_article=bl_article,
                    packaging=packaging,
                    unit=unit or 'шт'
                )
                db.add(new_nom)
                nomenclatures_created += 1
            
            # Если есть BL артикул, создаем запись сопоставления
            if bl_article and bl_article != 'nan':
                # Проверяем, не существует ли уже такое сопоставление
                existing_mapping = await db.execute(
                    select(ArticleMapping).where(
                        ArticleMapping.agb_article == article,
                        ArticleMapping.bl_article == bl_article
                    )
                )
                
                if not existing_mapping.scalar_one_or_none():
                    # Создаем запись сопоставления
                    mapping = ArticleMapping(
                        contractor_article=article,
                        contractor_description=name or '',
                        agb_article=article,
                        agb_description=name or '',
                        bl_article=bl_article,
                        bl_description='',
                        packaging_factor=int(packaging) if packaging else 1,
                        unit=unit or 'шт'
                    )
                    db.add(mapping)
                    mappings_created += 1
            
            # Коммитим каждые 100 записей
            if (index + 1) % 100 == 0:
                await db.commit()
                logger.info(f"Обработано {index + 1} записей...")
                
        except Exception as e:
            logger.error(f"Ошибка при обработке строки {index}: {e}")
            continue
    
    # Финальный коммит
    await db.commit()
    
    logger.info(f"Загрузка завершена:")
    logger.info(f"  - Создано номенклатур: {nomenclatures_created}")
    logger.info(f"  - Обновлено номенклатур: {nomenclatures_updated}")
    logger.info(f"  - Создано сопоставлений: {mappings_created}")
    logger.info(f"  - Всего обработано строк: {len(df)}")

if __name__ == "__main__":
    asyncio.run(load_data_to_postgres())
