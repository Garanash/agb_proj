#!/usr/bin/env python3
"""
Скрипт для добавления новых моделей ИИ в базу данных
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from models import Base, ApiKey, AiProcessingLog
from database import get_database_url

def add_ai_models():
    """Добавить таблицы для ИИ функциональности"""
    try:
        # Создаем подключение к базе данных
        engine = create_engine(get_database_url())
        
        print("🔧 Создание таблиц для ИИ функциональности...")
        
        # Создаем таблицы
        Base.metadata.create_all(bind=engine)
        
        print("✅ Таблицы успешно созданы:")
        print("   - api_keys (API ключи)")
        print("   - ai_processing_logs (логи ИИ обработки)")
        
        # Проверяем, что таблицы созданы
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('api_keys', 'ai_processing_logs')
            """))
            
            tables = [row[0] for row in result]
            print(f"📊 Созданные таблицы: {', '.join(tables)}")
        
        print("🎉 Миграция завершена успешно!")
        
    except Exception as e:
        print(f"❌ Ошибка при создании таблиц: {e}")
        sys.exit(1)

if __name__ == "__main__":
    add_ai_models()
