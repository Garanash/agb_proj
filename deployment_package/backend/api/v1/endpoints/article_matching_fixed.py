from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import select, func, or_
from typing import List, Optional, Dict, Any
from datetime import datetime
import pandas as pd
import io
import re
import json
from pydantic import BaseModel

from database import get_db
from models import ArticleMatchingRequest, ArticleMatchingResult, OurDatabaseArticle, User, UserRole
from ..dependencies import get_current_user

router = APIRouter()


class MatchingResult(BaseModel):
    contractor_article: str
    contractor_description: str
    matched_article: Optional[str] = None
    matched_description: Optional[str] = None
    confidence: float = 0.0
    match_type: str = "no_match"


@router.get("/test-our-database")
def test_our_database(db: Session = Depends(get_db)):
    """Тестирование подключения к базе данных"""
    try:
        # Простой тест подключения
        result = db.execute(select(func.count()).select_from(ArticleMatchingRequest)).scalar()
        return {
            "status": "success",
            "message": "База данных доступна",
            "total_requests": result or 0,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении базы данных: {str(e)}"
        )


@router.get("/requests/")
def get_requests(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка запросов на сопоставление"""
    try:
        # Админы видят все запросы, остальные только свои
        if current_user.role == "admin":
            requests = db.query(ArticleMatchingRequest).offset(skip).limit(limit).all()
        else:
            requests = db.query(ArticleMatchingRequest).filter(
                ArticleMatchingRequest.user_id == current_user.id
            ).offset(skip).limit(limit).all()
        
        requests_list = []
        for req in requests:
            req_dict = {
                "id": req.id,
                "user_id": req.user_id,
                "filename": req.filename,
                "status": req.status,
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "updated_at": req.updated_at.isoformat() if req.updated_at else None
            }
            requests_list.append(req_dict)
        
        return {
            "requests": requests_list,
            "total": len(requests_list),
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении запросов: {str(e)}"
        )


@router.get("/requests/{request_id}")
def get_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение конкретного запроса на сопоставление"""
    try:
        request = db.query(ArticleMatchingRequest).filter(
            ArticleMatchingRequest.id == request_id
        ).first()
        
        if not request:
            raise HTTPException(
                status_code=404,
                detail="Запрос не найден"
            )
        
        # Проверяем права доступа
        if current_user.role != "admin" and request.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Недостаточно прав для просмотра этого запроса"
            )
        
        return {
            "id": request.id,
            "user_id": request.user_id,
            "filename": request.filename,
            "status": request.status,
            "created_at": request.created_at.isoformat() if request.created_at else None,
            "updated_at": request.updated_at.isoformat() if request.updated_at else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении запроса: {str(e)}"
        )


@router.get("/results/")
def get_results(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение результатов сопоставления"""
    try:
        # Админы видят все результаты, остальные только свои
        if current_user.role == "admin":
            results = db.query(ArticleMatchingResult).offset(skip).limit(limit).all()
        else:
            # Получаем результаты через запросы пользователя
            user_requests = db.query(ArticleMatchingRequest).filter(
                ArticleMatchingRequest.user_id == current_user.id
            ).all()
            request_ids = [req.id for req in user_requests]
            
            if request_ids:
                results = db.query(ArticleMatchingResult).filter(
                    ArticleMatchingResult.request_id.in_(request_ids)
                ).offset(skip).limit(limit).all()
            else:
                results = []
        
        results_list = []
        for result in results:
            result_dict = {
                "id": result.id,
                "request_id": result.request_id,
                "contractor_article": result.contractor_article,
                "contractor_description": result.contractor_description,
                "matched_article": result.matched_article,
                "matched_description": result.matched_description,
                "confidence": result.confidence,
                "match_type": result.match_type,
                "created_at": result.created_at.isoformat() if result.created_at else None
            }
            results_list.append(result_dict)
        
        return {
            "results": results_list,
            "total": len(results_list),
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении результатов: {str(e)}"
        )


@router.get("/our-database/")
def get_our_database_articles(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение статей из нашей базы данных"""
    try:
        query = db.query(OurDatabaseArticle)
        
        # Поиск по артикулу или описанию
        if search:
            search_filter = or_(
                OurDatabaseArticle.article.ilike(f"%{search}%"),
                OurDatabaseArticle.description.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        articles = query.offset(skip).limit(limit).all()
        
        articles_list = []
        for article in articles:
            article_dict = {
                "id": article.id,
                "article": article.article,
                "description": article.description,
                "category": article.category,
                "price": float(article.price) if article.price else None,
                "is_active": article.is_active,
                "created_at": article.created_at.isoformat() if article.created_at else None
            }
            articles_list.append(article_dict)
        
        return {
            "articles": articles_list,
            "total": len(articles_list),
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении статей: {str(e)}"
        )


@router.post("/upload/")
def upload_articles(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Загрузка файла с артикулами для сопоставления"""
    try:
        # Проверяем права пользователя
        if current_user.role not in ["admin", "manager"]:
            raise HTTPException(
                status_code=403,
                detail="Недостаточно прав для загрузки файлов"
            )
        
        # Читаем файл
        content = file.file.read()
        
        # Создаем запрос на сопоставление
        request = ArticleMatchingRequest(
            user_id=current_user.id,
            filename=file.filename,
            status="uploaded",
            created_at=datetime.now()
        )
        db.add(request)
        db.commit()
        db.refresh(request)
        
        return {
            "status": "success",
            "message": "Файл успешно загружен",
            "request_id": request.id,
            "filename": file.filename
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при загрузке файла: {str(e)}"
        )


@router.post("/match/")
def match_articles(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Запуск процесса сопоставления артикулов"""
    try:
        # Проверяем права пользователя
        if current_user.role not in ["admin", "manager"]:
            raise HTTPException(
                status_code=403,
                detail="Недостаточно прав для запуска сопоставления"
            )
        
        # Получаем запрос
        request = db.query(ArticleMatchingRequest).filter(
            ArticleMatchingRequest.id == request_id
        ).first()
        
        if not request:
            raise HTTPException(
                status_code=404,
                detail="Запрос не найден"
            )
        
        # Проверяем права доступа
        if current_user.role != "admin" and request.user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Недостаточно прав для этого запроса"
            )
        
        # Обновляем статус запроса
        request.status = "processing"
        request.updated_at = datetime.now()
        db.commit()
        
        # Здесь должна быть логика сопоставления
        # Пока создаем тестовые результаты
        test_results = [
            {
                "contractor_article": "TEST001",
                "contractor_description": "Тестовый артикул 1",
                "matched_article": "AGB001",
                "matched_description": "Сопоставленный артикул 1",
                "confidence": 0.95,
                "match_type": "exact_match"
            },
            {
                "contractor_article": "TEST002",
                "contractor_description": "Тестовый артикул 2",
                "matched_article": None,
                "matched_description": None,
                "confidence": 0.0,
                "match_type": "no_match"
            }
        ]
        
        # Сохраняем результаты
        for result_data in test_results:
            result = ArticleMatchingResult(
                request_id=request_id,
                contractor_article=result_data["contractor_article"],
                contractor_description=result_data["contractor_description"],
                matched_article=result_data["matched_article"],
                matched_description=result_data["matched_description"],
                confidence=result_data["confidence"],
                match_type=result_data["match_type"],
                created_at=datetime.now()
            )
            db.add(result)
        
        # Обновляем статус запроса
        request.status = "completed"
        request.updated_at = datetime.now()
        db.commit()
        
        return {
            "status": "success",
            "message": "Сопоставление завершено",
            "request_id": request_id,
            "results_count": len(test_results)
        }
    except HTTPException:
        raise
    except Exception as e:
        # Обновляем статус запроса на ошибку
        if 'request' in locals():
            request.status = "error"
            request.updated_at = datetime.now()
            db.commit()
        
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при сопоставлении: {str(e)}"
        )


@router.get("/found-matches/")
def get_found_matches(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение найденных сопоставлений (алиас для /results)"""
    return get_results(skip, limit, current_user, db)


@router.get("/test-requests/")
def test_requests(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка запросов на сопоставление (алиас для /requests)"""
    return get_requests(skip, limit, current_user, db)


@router.get("/saved-variants/")
def get_saved_variants(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение сохраненных вариантов сопоставления"""
    try:
        # Пока возвращаем пустой список, так как функционал еще не реализован
        return {
            "variants": [],
            "total": 0,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении сохраненных вариантов: {str(e)}"
        )
