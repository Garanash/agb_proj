#!/usr/bin/env python3
"""
Простой скрипт для загрузки данных из Excel в SQLite базу данных
"""
import pandas as pd
import sqlite3
import os
from pathlib import Path

def load_data_to_sqlite():
    """Загружает данные из Excel в SQLite базу данных"""
    
    # Путь к файлу
    excel_file = "/Users/andreydolgov/Downloads/База данных соответствий.xlsx"
    
    if not os.path.exists(excel_file):
        print(f"Файл не найден: {excel_file}")
        return
    
    # Путь к SQLite базе данных
    db_path = "/Users/andreydolgov/Desktop/programming/agb_proj/backend/test.db"
    
    try:
        # Читаем Excel файл
        print("Читаем Excel файл...")
        df = pd.read_excel(excel_file)
        
        print(f"Загружено {len(df)} строк из Excel файла")
        
        # Подключаемся к SQLite базе данных
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Удаляем существующие таблицы и создаем заново
        cursor.execute('DROP TABLE IF EXISTS article_mappings')
        cursor.execute('DROP TABLE IF EXISTS ved_nomenclatures')
        
        # Создаем таблицы с правильной структурой
        cursor.execute('''
            CREATE TABLE ved_nomenclatures (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                code_1c TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE article_mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contractor_article TEXT NOT NULL,
                contractor_description TEXT NOT NULL,
                agb_article TEXT NOT NULL,
                agb_description TEXT NOT NULL,
                bl_article TEXT,
                bl_description TEXT,
                packaging_factor INTEGER DEFAULT 1,
                unit TEXT NOT NULL DEFAULT 'шт',
                is_active BOOLEAN DEFAULT 1,
                nomenclature_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (nomenclature_id) REFERENCES ved_nomenclatures (id)
            )
        ''')
        
        # Загружаем данные
        nomenclatures_created = 0
        nomenclatures_updated = 0
        mappings_created = 0
        
        for index, row in df.iterrows():
            try:
                # Извлекаем данные из строки
                article = str(row['Артикул АГБ']).strip() if pd.notna(row['Артикул АГБ']) else None
                name = str(row['Номенклатура АГБ']).strip() if pd.notna(row['Номенклатура АГБ']) else None
                code_1c = str(row['Код']).strip() if pd.notna(row['Код']) else None
                bl_article = str(row['Артикул BL']).strip() if pd.notna(row['Артикул BL']) else None
                packaging = row['Фасовка для химии, кг.'] if pd.notna(row['Фасовка для химии, кг.']) else None
                
                # Пропускаем пустые строки
                if not article or article == 'nan':
                    continue
                
                # Проверяем, существует ли уже такая номенклатура
                cursor.execute("SELECT id FROM ved_nomenclatures WHERE article = ?", (article,))
                existing_nom = cursor.fetchone()
                
                if existing_nom:
                    # Обновляем существующую номенклатуру
                    cursor.execute("""
                        UPDATE ved_nomenclatures 
                        SET name = ?, code_1c = ?
                        WHERE article = ?
                    """, (name or '', code_1c or '', article))
                    nomenclatures_updated += 1
                else:
                    # Создаем новую номенклатуру
                    cursor.execute("""
                        INSERT INTO ved_nomenclatures (article, name, code_1c)
                        VALUES (?, ?, ?)
                    """, (article, name or '', code_1c or ''))
                    nomenclatures_created += 1
                
                # Если есть BL артикул, создаем запись сопоставления
                if bl_article and bl_article != 'nan':
                    # Проверяем, не существует ли уже такое сопоставление
                    cursor.execute("""
                        SELECT id FROM article_mappings 
                        WHERE agb_article = ? AND bl_article = ?
                    """, (article, bl_article))
                    
                    if not cursor.fetchone():
                        # Создаем запись сопоставления
                        cursor.execute("""
                            INSERT INTO article_mappings 
                            (contractor_article, contractor_description, agb_article, agb_description, 
                             bl_article, bl_description, packaging_factor, unit, nomenclature_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (
                            article,  # contractor_article
                            name or '',  # contractor_description
                            article,  # agb_article
                            name or '',  # agb_description
                            bl_article,  # bl_article
                            '',  # bl_description
                            int(packaging) if packaging else 1,  # packaging_factor
                            'шт',  # unit
                            None  # nomenclature_id (будет заполнено позже)
                        ))
                        mappings_created += 1
                
                # Коммитим каждые 100 записей
                if (index + 1) % 100 == 0:
                    conn.commit()
                    print(f"Обработано {index + 1} записей...")
                    
            except Exception as e:
                print(f"Ошибка при обработке строки {index}: {e}")
                continue
        
        # Финальный коммит
        conn.commit()
        
        print(f"Загрузка завершена:")
        print(f"  - Создано номенклатур: {nomenclatures_created}")
        print(f"  - Обновлено номенклатур: {nomenclatures_updated}")
        print(f"  - Создано сопоставлений: {mappings_created}")
        print(f"  - Всего обработано строк: {len(df)}")
        
        # Показываем статистику
        cursor.execute("SELECT COUNT(*) FROM ved_nomenclatures")
        total_noms = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM article_mappings")
        total_mappings = cursor.fetchone()[0]
        
        print(f"\nСтатистика базы данных:")
        print(f"  - Всего номенклатур в БД: {total_noms}")
        print(f"  - Всего сопоставлений в БД: {total_mappings}")
        
        conn.close()
        
    except Exception as e:
        print(f"Ошибка при загрузке данных: {e}")

if __name__ == "__main__":
    load_data_to_sqlite()
