#!/usr/bin/env python3
"""
Скрипт для очистки всех найденных сопоставлений артикулов
"""

import asyncio
import sys
import os
from pathlib import Path

# Добавляем корневую директорию проекта в путь
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from database import get_db
from models import ArticleMapping
from sqlalchemy import delete

async def clear_article_mappings():
    """Очищает все записи из таблицы article_mappings"""
    
    print("🧹 Начинаем очистку найденных сопоставлений...")
    
    async for db in get_db():
        try:
            # Подсчитываем количество записей перед удалением
            from sqlalchemy import select, func
            count_result = await db.execute(select(func.count(ArticleMapping.id)))
            total_count = count_result.scalar()
            
            print(f"📊 Найдено записей для удаления: {total_count}")
            
            if total_count == 0:
                print("✅ Таблица уже пуста, нечего удалять")
                return
            
            # Удаляем все записи
            await db.execute(delete(ArticleMapping))
            await db.commit()
            
            print(f"✅ Успешно удалено {total_count} записей из таблицы article_mappings")
            
        except Exception as e:
            print(f"❌ Ошибка при очистке: {e}")
            await db.rollback()
            raise
        finally:
            await db.close()
        break

if __name__ == "__main__":
    asyncio.run(clear_article_mappings())
