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
from models import ArticleMatchingRequest, ArticleMatchingResult, User, UserRole
from .auth import get_current_user

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


@router.get("/found-matches")
def get_found_matches(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получение найденных сопоставлений"""
    try:
        results = db.query(ArticleMatchingResult).offset(skip).limit(limit).all()
        
        matches = []
        for result in results:
            match_dict = {
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
            matches.append(match_dict)
        
        return {
            "matches": matches,
            "total": len(matches),
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении сопоставлений: {str(e)}"
        )


@router.post("/upload")
def upload_articles(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Загрузка файла с артикулами для сопоставления"""
    try:
        # Проверяем права пользователя
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
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
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при загрузке файла: {str(e)}"
        )


@router.get("/test-requests")
def test_requests(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка запросов на сопоставление (алиас для /requests)"""
    return get_requests(skip, limit, current_user, db)


@router.get("/saved-variants")
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


@router.get("/requests")
def get_requests(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка запросов на сопоставление"""
    try:
        # Админы видят все запросы, остальные только свои
        if current_user.role == UserRole.ADMIN:
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
        if current_user.role != UserRole.ADMIN and request.user_id != current_user.id:
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
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при получении запроса: {str(e)}"
        )
