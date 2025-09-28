#!/usr/bin/env python3
"""
Скрипт для создания таблиц поиска поставщиков
"""

import asyncio
import sys
import os
from pathlib import Path

# Добавляем корневую директорию в путь
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import text
from database import get_async_session
from models import Base, Supplier, SupplierArticle, ArticleSearchRequest, ArticleSearchResult, SupplierValidationLog


async def create_tables():
    """Создание таблиц для поиска поставщиков"""
    async with get_async_session() as session:
        try:
            # Создаем таблицы
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS suppliers (
                    id SERIAL PRIMARY KEY,
                    company_name VARCHAR NOT NULL,
                    contact_person VARCHAR,
                    email VARCHAR,
                    phone VARCHAR,
                    website VARCHAR,
                    address VARCHAR,
                    country VARCHAR,
                    city VARCHAR,
                    email_validated BOOLEAN DEFAULT FALSE,
                    website_validated BOOLEAN DEFAULT FALSE,
                    whois_data JSON,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    last_checked TIMESTAMP WITH TIME ZONE
                );
            """))
            
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON suppliers(company_name);
            """))
            
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
            """))
            
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS supplier_articles (
                    id SERIAL PRIMARY KEY,
                    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
                    article_code VARCHAR NOT NULL,
                    article_name VARCHAR NOT NULL,
                    description TEXT,
                    price FLOAT,
                    currency VARCHAR DEFAULT 'RUB',
                    unit VARCHAR DEFAULT 'шт',
                    min_order_quantity INTEGER,
                    availability VARCHAR,
                    agb_article VARCHAR,
                    bl_article VARCHAR,
                    nomenclature_id INTEGER REFERENCES ved_nomenclature(id),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    last_price_update TIMESTAMP WITH TIME ZONE
                );
            """))
            
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_supplier_articles_article_code ON supplier_articles(article_code);
            """))
            
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS article_search_requests (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    request_name VARCHAR,
                    articles JSON NOT NULL,
                    status VARCHAR DEFAULT 'pending',
                    total_articles INTEGER DEFAULT 0,
                    found_articles INTEGER DEFAULT 0,
                    total_suppliers INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    completed_at TIMESTAMP WITH TIME ZONE
                );
            """))
            
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS article_search_results (
                    id SERIAL PRIMARY KEY,
                    request_id INTEGER NOT NULL REFERENCES article_search_requests(id),
                    article_code VARCHAR NOT NULL,
                    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
                    supplier_article_id INTEGER NOT NULL REFERENCES supplier_articles(id),
                    confidence_score FLOAT DEFAULT 0.0,
                    match_type VARCHAR,
                    ai_analysis TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))
            
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS supplier_validation_logs (
                    id SERIAL PRIMARY KEY,
                    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
                    validation_type VARCHAR NOT NULL,
                    status VARCHAR NOT NULL,
                    message TEXT,
                    details JSON,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))
            
            await session.commit()
            print("✅ Таблицы для поиска поставщиков успешно созданы")
            
        except Exception as e:
            await session.rollback()
            print(f"❌ Ошибка создания таблиц: {e}")
            raise


async def main():
    """Основная функция"""
    print("🚀 Создание таблиц для поиска поставщиков...")
    await create_tables()
    print("✅ Готово!")


if __name__ == "__main__":
    asyncio.run(main())
