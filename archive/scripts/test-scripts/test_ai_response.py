#!/usr/bin/env python3
import asyncio
import sys
import os

# Добавляем путь к backend
sys.path.append('/Users/andreydolgov/Desktop/programming/agb_proj/backend')

from database import get_db
from api.v1.endpoints.article_matching import get_ai_response, get_api_key

async def test_ai_response():
    """Тестируем ответ AI"""
    print("🔍 Тестируем ответ AI...")
    
    async for db in get_db():
        try:
            # Получаем API ключ
            decrypted_key = await get_api_key(db)
            
            if not decrypted_key:
                print("❌ Нет API ключа")
                return
            
            # Тестируем AI
            message = "Проанализируй этот текст и найди артикулы:\n\nОХКУ-000184 УБР - Кундуми Смазка антивибрационная GRIZZLY (ведро 17 кг.) 10 шт"
            ai_response = await get_ai_response(message, decrypted_key, 'polza')
            
            print(f"🔍 AI ответ: {ai_response}")
            
            # Пытаемся парсить JSON
            import json
            
            # Убираем markdown блоки если есть
            clean_response = ai_response
            if '```json' in clean_response:
                clean_response = clean_response.split('```json')[1].split('```')[0].strip()
            elif '```' in clean_response:
                clean_response = clean_response.split('```')[1].split('```')[0].strip()
            
            print(f"🔍 Очищенный ответ: {clean_response}")
            
            if clean_response.strip().startswith('[') and clean_response.strip().endswith(']'):
                articles = json.loads(clean_response)
                print(f"✅ Найден JSON с {len(articles)} артикулами: {articles}")
            else:
                print("❌ JSON не найден в ответе")
                
        except Exception as e:
            print(f"❌ Ошибка: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await db.close()
        break

if __name__ == "__main__":
    asyncio.run(test_ai_response())
