"""
API endpoints для загрузки данных сопоставления статей
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import pandas as pd
import io
import json
from datetime import datetime

from database import SessionLocal
from models import User, ArticleSearchRequest, ArticleSearchResult
from .auth import get_current_user
from ..schemas import APIResponse

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload-articles", response_model=APIResponse)
async def upload_articles_data(
    file: UploadFile = File(...),
    description: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Загрузка данных статей для сопоставления из CSV/Excel файла"""
    if current_user.role not in ["admin", "manager", "employee"]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Проверяем тип файла
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Поддерживаются только файлы CSV и Excel")
        
        # Читаем файл
        contents = await file.read()
        
        # Определяем тип файла и читаем данные
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        else:  # Excel файл
            df = pd.read_excel(io.BytesIO(contents))
        
        # Проверяем обязательные колонки
        required_columns = ['article_name', 'description', 'category']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Отсутствуют обязательные колонки: {', '.join(missing_columns)}"
            )
        
        # Обрабатываем данные
        uploaded_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Создаем запрос на поиск
                search_request = ArticleSearchRequest(
                    user_id=current_user.id,
                    search_query=str(row['article_name']),
                    search_type='article',
                    status='completed',
                    completed_at=datetime.now()
                )
                
                db.add(search_request)
                db.flush()  # Получаем ID
                
                # Создаем результат поиска (моковые данные)
                search_result = ArticleSearchResult(
                    request_id=search_request.id,
                    article=str(row['article_name']),
                    company_name=f"Поставщик {index + 1}",
                    contact_person=f"Контактное лицо {index + 1}",
                    email=f"supplier{index + 1}@example.com",
                    phone="+7 (999) 123-45-67",
                    website=f"https://supplier{index + 1}.com",
                    address=f"Адрес поставщика {index + 1}",
                    country="Россия",
                    city="Москва",
                    price=float(row.get('price', 1000.0)),
                    currency=str(row.get('currency', 'RUB')),
                    min_order_quantity=int(row.get('min_order_quantity', 1)),
                    availability=str(row.get('availability', 'В наличии')),
                    confidence_score=float(row.get('confidence_score', 0.85))
                )
                
                db.add(search_result)
                uploaded_count += 1
                
            except Exception as e:
                errors.append(f"Строка {index + 1}: {str(e)}")
        
        db.commit()
        
        return APIResponse(
            success=True,
            message=f"Успешно загружено {uploaded_count} статей",
            data={
                "uploaded_count": uploaded_count,
                "total_rows": len(df),
                "errors": errors[:10],  # Показываем только первые 10 ошибок
                "file_name": file.filename,
                "description": description
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка обработки файла: {str(e)}")

@router.get("/upload-history", response_model=APIResponse)
def get_upload_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение истории загрузок"""
    if current_user.role not in ["admin", "manager", "employee"]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Получаем запросы, созданные текущим пользователем
        requests = db.query(ArticleSearchRequest).filter(
            ArticleSearchRequest.user_id == current_user.id
        ).order_by(ArticleSearchRequest.created_at.desc()).limit(50).all()
        
        history = []
        for request in requests:
            history.append({
                "id": request.id,
                "request_name": request.request_name,
                "article_name": request.article_name,
                "status": request.status,
                "created_at": request.created_at.isoformat(),
                "completed_at": request.completed_at.isoformat() if request.completed_at else None,
                "results_count": len(request.results) if hasattr(request, 'results') else 0
            })
        
        return APIResponse(
            success=True,
            message="История загрузок получена",
            data={"history": history}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения истории: {str(e)}")

@router.delete("/clear-data", response_model=APIResponse)
def clear_uploaded_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Очистка загруженных данных (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Удаляем результаты поиска
        deleted_results = db.query(ArticleSearchResult).delete()
        
        # Удаляем запросы поиска
        deleted_requests = db.query(ArticleSearchRequest).delete()
        
        db.commit()
        
        return APIResponse(
            success=True,
            message="Данные успешно очищены",
            data={
                "deleted_requests": deleted_requests,
                "deleted_results": deleted_results
            }
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка очистки данных: {str(e)}")

@router.post("/add-single-article", response_model=APIResponse)
def add_single_article(
    article_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавление одной статьи для сопоставления"""
    if current_user.role not in ["admin", "manager", "employee"]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Создаем запрос на поиск
        search_request = ArticleSearchRequest(
            user_id=current_user.id,
            search_query=str(article_data['article_name']),
            search_type='article',
            status='completed',
            completed_at=datetime.now()
        )
        
        db.add(search_request)
        db.flush()  # Получаем ID
        
        # Создаем результат поиска (моковые данные)
        search_result = ArticleSearchResult(
            request_id=search_request.id,
            article=str(article_data['article_name']),
            company_name="Поставщик",
            contact_person="Контактное лицо",
            email="supplier@example.com",
            phone="+7 (999) 123-45-67",
            website="https://supplier.com",
            address="Адрес поставщика",
            country="Россия",
            city="Москва",
            price=float(article_data.get('price', 1000.0)),
            currency=str(article_data.get('currency', 'RUB')),
            min_order_quantity=int(article_data.get('min_order_quantity', 1)),
            availability=str(article_data.get('availability', 'В наличии')),
            confidence_score=float(article_data.get('confidence_score', 0.85))
        )
        
        db.add(search_result)
        db.commit()
        
        return APIResponse(
            success=True,
            message="Статья успешно добавлена",
            data={
                "request_id": search_request.id,
                "result_id": search_result.id,
                "article_name": article_data['article_name']
            }
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка добавления статьи: {str(e)}")

@router.get("/template", response_model=APIResponse)
def get_upload_template():
    """Получение шаблона файла для загрузки"""
    template_data = {
        "article_name": "Название статьи",
        "description": "Описание статьи",
        "category": "Категория",
        "additional_criteria": "Дополнительные критерии",
        "price": 1000.0,
        "currency": "RUB",
        "min_order_quantity": 1,
        "availability": "В наличии",
        "confidence_score": 0.85
    }
    
    return APIResponse(
        success=True,
        message="Шаблон файла",
        data={
            "template": template_data,
            "required_columns": ["article_name", "description", "category"],
            "optional_columns": ["additional_criteria", "price", "currency", "min_order_quantity", "availability", "confidence_score"],
            "instructions": "Обязательные колонки: article_name, description, category. Остальные колонки опциональны."
        }
    )
