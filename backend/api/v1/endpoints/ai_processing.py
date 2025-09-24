from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
import json
import uuid
import time
import asyncio
from pathlib import Path

# Импорты для обработки файлов
import pandas as pd
import PyPDF2
from PIL import Image
import pytesseract
import openai
import requests

from ..dependencies import get_db, get_current_user
from models import ApiKey, AiProcessingLog, User, MatchingNomenclature
from ..schemas import AIMatchingResponse, MatchingResult

router = APIRouter()

# Настройки для обработки файлов
UPLOAD_DIR = Path("uploads/ai_processing")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    'pdf': ['.pdf'],
    'excel': ['.xlsx', '.xls', '.csv'],
    'images': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp']
}

def get_file_extension(filename: str) -> str:
    """Получить расширение файла"""
    return Path(filename).suffix.lower()

def is_allowed_file(filename: str) -> bool:
    """Проверить, разрешен ли тип файла"""
    ext = get_file_extension(filename)
    return any(ext in extensions for extensions in ALLOWED_EXTENSIONS.values())

async def extract_text_from_pdf(file_path: str) -> str:
    """Извлечь текст из PDF файла"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        raise Exception(f"Ошибка извлечения текста из PDF: {str(e)}")

async def extract_text_from_excel(file_path: str) -> str:
    """Извлечь текст из Excel файла"""
    try:
        ext = get_file_extension(file_path)
        if ext == '.csv':
            df = pd.read_csv(file_path, encoding='utf-8')
        else:
            df = pd.read_excel(file_path)
        
        # Преобразуем DataFrame в текст
        text = ""
        for column in df.columns:
            text += f"{column}: "
            text += " ".join([str(val) for val in df[column].dropna().tolist()]) + "\n"
        
        return text
    except Exception as e:
        raise Exception(f"Ошибка извлечения текста из Excel: {str(e)}")

async def extract_text_from_image(file_path: str) -> str:
    """Извлечь текст из изображения с помощью OCR сервиса"""
    try:
        # Используем OCR сервис
        ocr_url = os.getenv('OCR_SERVICE_URL', 'http://localhost:8001')
        
        with open(file_path, 'rb') as f:
            files = {'file': f}
            response = requests.post(f"{ocr_url}/ocr/", files=files)
            response.raise_for_status()
            
        result = response.json()
        if result.get('success'):
            return result.get('text', '')
        else:
            raise Exception("OCR сервис вернул ошибку")
            
    except requests.RequestException as e:
        # Fallback на локальный Tesseract если OCR сервис недоступен
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image, lang='rus+eng')
            return text
        except Exception as fallback_error:
            raise Exception(f"Ошибка OCR обработки: {str(e)}, Fallback: {str(fallback_error)}")
    except Exception as e:
        raise Exception(f"Ошибка OCR обработки: {str(e)}")

async def extract_text_from_file(file_path: str, filename: str) -> str:
    """Извлечь текст из файла в зависимости от его типа"""
    ext = get_file_extension(filename)
    
    if ext in ALLOWED_EXTENSIONS['pdf']:
        return await extract_text_from_pdf(file_path)
    elif ext in ALLOWED_EXTENSIONS['excel']:
        return await extract_text_from_excel(file_path)
    elif ext in ALLOWED_EXTENSIONS['images']:
        return await extract_text_from_image(file_path)
    else:
        raise Exception(f"Неподдерживаемый тип файла: {ext}")

async def get_ai_response(text: str, api_key: str, provider: str) -> str:
    """Получить ответ от ИИ"""
    try:
        if provider == 'openai':
            openai.api_key = api_key
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """Ты - эксперт по сопоставлению артикулов. 
                        Проанализируй предоставленный текст и найди все артикулы, описания товаров и количества.
                        Верни результат в формате JSON с полями:
                        - contractor_article: артикул контрагента
                        - description: описание товара
                        - quantity: количество
                        - unit: единица измерения
                        
                        Пример ответа:
                        [
                            {
                                "contractor_article": "12345",
                                "description": "Болт М8х20",
                                "quantity": 100,
                                "unit": "шт"
                            }
                        ]"""
                    },
                    {
                        "role": "user",
                        "content": f"Проанализируй этот текст и найди артикулы:\n\n{text}"
                    }
                ]
            )
            return response.choices[0].message.content
        elif provider == 'polza':
            # Интеграция с Polza.ai
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            data = {
                'text': text,
                'task': 'extract_articles'
            }
            response = requests.post('https://api.polza.ai/v1/analyze', headers=headers, json=data)
            response.raise_for_status()
            return response.json()
        else:
            raise Exception(f"Неподдерживаемый провайдер: {provider}")
    except Exception as e:
        raise Exception(f"Ошибка получения ответа от ИИ: {str(e)}")

async def match_articles_with_database(articles: List[dict], db: Session) -> List[MatchingResult]:
    """Сопоставить найденные артикулы с базой данных"""
    results = []
    
    for article in articles:
        contractor_article = article.get('contractor_article', '')
        description = article.get('description', '')
        
        # Поиск в базе данных по артикулу
        nomenclature = db.query(MatchingNomenclature).filter(
            MatchingNomenclature.agb_article.ilike(f"%{contractor_article}%")
        ).first()
        
        if not nomenclature:
            # Поиск по описанию
            nomenclature = db.query(MatchingNomenclature).filter(
                MatchingNomenclature.name.ilike(f"%{description}%")
            ).first()
        
        if nomenclature:
            # Вычисляем уверенность сопоставления
            confidence = 0
            if contractor_article.lower() in nomenclature.agb_article.lower():
                confidence += 50
            if any(word in nomenclature.name.lower() for word in description.lower().split()):
                confidence += 30
            if nomenclature.bl_article and contractor_article.lower() in nomenclature.bl_article.lower():
                confidence += 20
            
            confidence = min(confidence, 100)
            
            results.append(MatchingResult(
                id=str(uuid.uuid4()),
                contractor_article=contractor_article,
                description=description,
                matched=True,
                agb_article=nomenclature.agb_article,
                bl_article=nomenclature.bl_article,
                match_confidence=confidence,
                packaging_factor=nomenclature.packaging or 1.0,
                recalculated_quantity=article.get('quantity', 0) * (nomenclature.packaging or 1.0),
                nomenclature={
                    'id': nomenclature.id,
                    'name': nomenclature.name,
                    'code_1c': nomenclature.code_1c,
                    'article': nomenclature.agb_article
                }
            ))
        else:
            results.append(MatchingResult(
                id=str(uuid.uuid4()),
                contractor_article=contractor_article,
                description=description,
                matched=False,
                match_confidence=0
            ))
    
    return results

@router.post("/ai-process/", response_model=AIMatchingResponse)
async def process_ai_request(
    message: str = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обработать запрос к ИИ-агенту"""
    start_time = time.time()
    
    # Получаем активный API ключ
    api_key_obj = db.query(ApiKey).filter(
        ApiKey.is_active == True,
        ApiKey.provider.in_(['openai', 'polza'])
    ).first()
    
    if not api_key_obj:
        raise HTTPException(status_code=400, detail="Нет активного API ключа для ИИ-сервиса")
    
    # Расшифровываем ключ
    try:
        from cryptography.fernet import Fernet
        encryption_key = os.getenv('API_KEY_ENCRYPTION_KEY', Fernet.generate_key())
        cipher_suite = Fernet(encryption_key)
        decrypted_key = cipher_suite.decrypt(api_key_obj.key.encode()).decode()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Ошибка расшифровки API ключа")
    
    # Создаем лог обработки
    log = AiProcessingLog(
        user_id=current_user.id,
        api_key_id=api_key_obj.id,
        request_type='file_upload' if files else 'text_input',
        input_text=message,
        status='processing'
    )
    db.add(log)
    db.commit()
    
    try:
        # Обрабатываем файлы
        extracted_text = message
        file_paths = []
        
        for file in files:
            if not is_allowed_file(file.filename):
                raise HTTPException(status_code=400, detail=f"Неподдерживаемый тип файла: {file.filename}")
            
            # Сохраняем файл
            file_id = str(uuid.uuid4())
            file_path = UPLOAD_DIR / f"{file_id}_{file.filename}"
            
            with open(file_path, "wb") as buffer:
                content = await file.read()
                buffer.write(content)
            
            file_paths.append(str(file_path))
            
            # Извлекаем текст из файла
            try:
                file_text = await extract_text_from_file(str(file_path), file.filename)
                extracted_text += f"\n\n--- Содержимое файла {file.filename} ---\n{file_text}"
            except Exception as e:
                print(f"Ошибка обработки файла {file.filename}: {str(e)}")
                continue
        
        # Получаем ответ от ИИ
        ai_response = await get_ai_response(extracted_text, decrypted_key, api_key_obj.provider)
        
        # Парсим ответ ИИ
        try:
            if api_key_obj.provider == 'openai':
                articles = json.loads(ai_response)
            else:
                articles = ai_response.get('articles', [])
        except json.JSONDecodeError:
            # Если не удалось распарсить JSON, создаем простой ответ
            articles = [{
                'contractor_article': 'Не удалось извлечь',
                'description': 'Ошибка парсинга ответа ИИ',
                'quantity': 0,
                'unit': 'шт'
            }]
        
        # Сопоставляем с базой данных
        matching_results = await match_articles_with_database(articles, db)
        
        # Обновляем лог
        processing_time = time.time() - start_time
        log.status = 'success'
        log.ai_response = json.dumps(ai_response)
        log.processing_time = processing_time
        log.file_path = ','.join(file_paths) if file_paths else None
        db.commit()
        
        # Обновляем время последнего использования API ключа
        api_key_obj.last_used = datetime.utcnow()
        db.commit()
        
        return AIMatchingResponse(
            message=f"Обработано {len(articles)} позиций. Найдено совпадений: {len([r for r in matching_results if r.matched])}",
            matching_results=matching_results,
            processing_time=processing_time,
            status='success'
        )
        
    except Exception as e:
        # Обновляем лог с ошибкой
        log.status = 'error'
        log.error_message = str(e)
        log.processing_time = time.time() - start_time
        db.commit()
        
        raise HTTPException(status_code=500, detail=f"Ошибка обработки: {str(e)}")

@router.get("/ai-logs/")
async def get_ai_logs(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить логи ИИ обработки"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    logs = db.query(AiProcessingLog).offset(offset).limit(limit).all()
    return logs
