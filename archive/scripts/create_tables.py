#!/usr/bin/env python3
"""
Скрипт для создания таблиц в базе данных
"""

import sys
from pathlib import Path

# Добавляем путь к проекту
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from database import engine, Base
from models import *  # Импортируем все модели

def create_tables():
    """Создание всех таблиц в базе данных"""
    try:
        print("🔄 Создание таблиц в базе данных...")
        Base.metadata.create_all(bind=engine)
        print("✅ Таблицы успешно созданы!")
        return True
    except Exception as e:
        print(f"❌ Ошибка при создании таблиц: {e}")
        return False

if __name__ == "__main__":
    create_tables()
