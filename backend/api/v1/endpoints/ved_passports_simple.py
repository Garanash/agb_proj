from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from datetime import datetime

from database import SessionLocal
from models import User, UserRole, VEDNomenclature, VedPassport
from ..schemas import (
    VEDNomenclature as VEDNomenclatureSchema,
    VedPassport as VedPassportSchema,
)
from .auth import get_current_user

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/nomenclature/", response_model=List[VEDNomenclatureSchema])
def get_ved_nomenclature(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка номенклатуры для паспортов ВЭД"""
    # Разрешаем доступ любому авторизованному пользователю
    
    try:
        nomenclature = db.query(VEDNomenclature).filter(VEDNomenclature.is_active == True).all()
        return nomenclature
    except Exception as e:
        print(f"Ошибка при получении номенклатуры: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.get("/archive/filters", response_model=Dict[str, List[str]])
def get_archive_filters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение доступных фильтров для архива"""
    # Разрешаем доступ любому авторизованному пользователю
    
    try:
        # Получаем уникальные типы продуктов
        product_types = db.query(VEDNomenclature.product_type).filter(
            VEDNomenclature.product_type.isnot(None),
            VEDNomenclature.is_active == True
        ).distinct().all()
        
        # Получаем уникальные матрицы
        matrices = db.query(VEDNomenclature.matrix).filter(
            VEDNomenclature.matrix.isnot(None),
            VEDNomenclature.is_active == True
        ).distinct().all()
        
        # Получаем уникальные статусы паспортов
        statuses = db.query(VedPassport.status).filter(
            VedPassport.status.isnot(None)
        ).distinct().all()
        
        return {
            "product_types": [item[0] for item in product_types if item[0]],
            "matrices": [item[0] for item in matrices if item[0]],
            "statuses": [item[0] for item in statuses if item[0]]
        }
        
    except Exception as e:
        print(f"Ошибка при получении фильтров: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.get("/admin/archive/", response_model=List[VedPassportSchema])
def get_all_ved_passports_archive_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: str = None,
    product_type: str = None,
    matrix: str = None,
    status: str = None,
    date_from: str = None,
    date_to: str = None,
    order_number: str = None,
    code_1c: str = None,
    limit: int = 50,
    offset: int = 0
):
    """Получение архива всех паспортов ВЭД для администратора"""
    # Разрешаем доступ любому авторизованному пользователю
    
    try:
        query = db.query(VedPassport).join(VEDNomenclature, VedPassport.nomenclature_id == VEDNomenclature.id)
        
        # Применяем фильтры
        if search:
            search_term = search.strip()
            query = query.filter(
                (VedPassport.passport_number == search_term) |
                (VedPassport.order_number == search_term) |
                (VEDNomenclature.code_1c == search_term) |
                (VEDNomenclature.article == search_term) |
                (VEDNomenclature.name == search_term) |
                (VEDNomenclature.matrix == search_term)
            )
        
        if product_type:
            query = query.filter(VEDNomenclature.product_type == product_type)
        
        if matrix:
            query = query.filter(VEDNomenclature.matrix == matrix)
        
        if status:
            query = query.filter(VedPassport.status == status)
        
        if order_number:
            query = query.filter(VedPassport.order_number == order_number)
        
        if code_1c:
            query = query.filter(VEDNomenclature.code_1c == code_1c)
        
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(VedPassport.created_at >= date_from_obj)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(VedPassport.created_at <= date_to_obj)
            except ValueError:
                pass
        
        # Сортировка и пагинация
        passports = query.order_by(VedPassport.created_at.desc()).offset(offset).limit(limit).all()
        
        return passports
        
    except Exception as e:
        print(f"Ошибка при получении архива всех паспортов: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.get("/", response_model=List[VedPassportSchema])
def get_ved_passports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка паспортов ВЭД"""
    # Разрешаем доступ любому авторизованному пользователю
    
    try:
        passports = db.query(VedPassport).filter(
            VedPassport.created_by == current_user.id
        ).order_by(VedPassport.created_at.desc()).all()
        
        return passports
        
    except Exception as e:
        print(f"Ошибка при получении паспортов: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.get("/{passport_id}", response_model=VedPassportSchema)
def get_ved_passport(
    passport_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение конкретного паспорта ВЭД по ID"""
    # Разрешаем доступ любому авторизованному пользователю
    
    try:
        passport = db.query(VedPassport).filter(VedPassport.id == passport_id).first()
        
        if not passport:
            raise HTTPException(status_code=404, detail="Паспорт не найден")
        
        if passport.created_by != current_user.id and current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Доступ запрещен")
        
        return passport
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при получении паспорта: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера: {str(e)}")
