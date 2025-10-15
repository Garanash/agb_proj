#!/usr/bin/env python3
"""
Скрипт для загрузки базы данных соответствий из Excel файла
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
from models import VEDNomenclature, ArticleMapping
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def load_matching_database():
    """Загружает базу данных соответствий из Excel файла"""
    
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
        logger.info(f"Колонки: {list(df.columns)}")
        
        # Показываем первые несколько строк для понимания структуры
        logger.info("Первые 5 строк:")
        print(df.head())
        
        # Получаем сессию базы данных
        async for db in get_db():
            try:
                # Очищаем существующие данные (опционально)
                # await db.execute("DELETE FROM article_mappings")
                # await db.execute("DELETE FROM ved_nomenclatures")
                # await db.commit()
                
                # Загружаем данные в базу
                await process_excel_data(df, db)
                
                logger.info("Данные успешно загружены в базу данных!")
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
    """Обрабатывает данные из Excel и загружает их в базу данных"""
    
    # Предполагаем, что в Excel есть колонки:
    # - Артикул АГБ
    # - Название
    # - Код 1С
    # - Артикул BL
    # - и другие поля
    
    # Маппинг колонок на основе изученной структуры файла
    column_mapping = {
        'article': 'Артикул АГБ',      # Артикул АГБ
        'name': 'Номенклатура АГБ',     # Название
        'code_1c': 'Код',              # Код (УТ-код)
        'bl_article': 'Артикул BL',    # Артикул BL
        'packaging': 'Фасовка для химии, кг.',  # Фасовка
        'unit': 'Ед.изм.',             # Единица измерения
        'variants': ['Вариант подбора 1', 'Вариант подбора 2', 'Вариант подбора 3', 
                    'Вариант подбора 4', 'Вариант подбора 5', 'Вариант подбора 6']
    }
    
    logger.info(f"Маппинг колонок: {column_mapping}")
    
    # Загружаем данные в VEDNomenclature
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
                select(VEDNomenclature).where(VEDNomenclature.article == article)
            )
            existing_nom = result.scalar_one_or_none()
            
            if existing_nom:
                # Обновляем существующую номенклатуру
                existing_nom.name = name or existing_nom.name
                existing_nom.code_1c = code_1c or existing_nom.code_1c
                nomenclatures_updated += 1
            else:
                # Создаем новую номенклатуру
                new_nom = VEDNomenclature(
                    article=article,
                    name=name or '',
                    code_1c=code_1c or ''
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
                        agb_article=article,
                        bl_article=bl_article,
                        match_confidence=100.0,  # Высокая уверенность для данных из базы
                        packaging_factor=float(packaging) if packaging else 1.0,
                        recalculated_quantity=1
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
    asyncio.run(load_matching_database())
