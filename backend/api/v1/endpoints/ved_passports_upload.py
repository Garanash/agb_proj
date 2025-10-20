"""
API endpoints для загрузки данных ВЭД паспортов
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
import time
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import pandas as pd
import io
import json
from datetime import datetime

from database import SessionLocal
from models import User, VedPassport
from .auth import get_current_user
from ..schemas import APIResponse

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload-ved-passports", response_model=APIResponse)
async def upload_ved_passports_data(
    file: UploadFile = File(...),
    description: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Загрузка данных ВЭД паспортов из CSV/Excel файла"""
    if current_user.role not in ["admin", "manager", "ved_passport", "ved"]:
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
        required_columns = ['passport_number', 'order_number']
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
                # Создаем ВЭД паспорт
                passport = VedPassport(
                    passport_number=str(row['passport_number']),
                    order_number=str(row['order_number']),
                    title=str(row.get('title', '')),
                    description=str(row.get('description', '')),
                    quantity=int(row.get('quantity', 1)),
                    status=str(row.get('status', 'active')),
                    created_by=current_user.id,
                    nomenclature_id=int(row.get('nomenclature_id', 1))  # По умолчанию 1
                )
                
                db.add(passport)
                uploaded_count += 1
                
            except Exception as e:
                errors.append(f"Строка {index + 1}: {str(e)}")
        
        db.commit()
        
        return APIResponse(
            success=True,
            message=f"Успешно загружено {uploaded_count} ВЭД паспортов",
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

@router.get("/ved-passports-history", response_model=APIResponse)
def get_ved_passports_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение истории загрузок ВЭД паспортов"""
    if current_user.role not in ["admin", "manager", "ved_passport", "ved"]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Получаем паспорта, созданные текущим пользователем
        passports = db.query(VedPassport).filter(
            VedPassport.created_by == current_user.id
        ).order_by(VedPassport.created_at.desc()).limit(50).all()
        
        history = []
        for passport in passports:
            history.append({
                "id": passport.id,
                "passport_number": passport.passport_number,
                "company_name": passport.company_name,
                "product_name": passport.product_name,
                "status": passport.status,
                "created_at": passport.created_at.isoformat(),
                "updated_at": passport.updated_at.isoformat() if passport.updated_at else None
            })
        
        return APIResponse(
            success=True,
            message="История загрузок ВЭД паспортов получена",
            data={"history": history}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения истории: {str(e)}")

@router.delete("/clear-ved-passports", response_model=APIResponse)
def clear_ved_passports_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Очистка загруженных ВЭД паспортов (только для админов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Удаляем ВЭД паспорта
        deleted_passports = db.query(VedPassport).delete()
        
        db.commit()
        
        return APIResponse(
            success=True,
            message="ВЭД паспорта успешно очищены",
            data={"deleted_passports": deleted_passports}
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка очистки данных: {str(e)}")

@router.post("/add-single-passport", response_model=APIResponse)
def add_single_passport(
    passport_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавление одного ВЭД паспорта"""
    if current_user.role not in ["admin", "manager", "ved_passport", "ved"]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        quantity = int(passport_data.get('quantity', 1))
        base_number = str(passport_data.get('passport_number', '')).strip()
        created = []
        
        for i in range(max(1, quantity)):
            if base_number:
                number = f"{base_number}-{i+1:03d}" if quantity > 1 else base_number
            else:
                number = f"VED-{int(time.time()*1000)}-{i+1:03d}"

            passport = VedPassport(
                passport_number=number,
                order_number=str(passport_data['order_number']),
                title=str(passport_data.get('title', '')),
                description=str(passport_data.get('description', '')),
                quantity=1,
                status=str(passport_data.get('status', 'active')),
                created_by=current_user.id,
                nomenclature_id=int(passport_data.get('nomenclature_id', 1))
            )
            db.add(passport)
            db.flush()
            created.append({
                "passport_id": passport.id,
                "passport_number": passport.passport_number
            })

        db.commit()

        return APIResponse(
            success=True,
            message=f"Создано паспортов: {len(created)}",
            data={"created": created}
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка добавления ВЭД паспорта: {str(e)}")

@router.get("/ved-passports-template", response_model=APIResponse)
def get_ved_passports_template():
    """Получение шаблона файла для загрузки ВЭД паспортов"""
    template_data = {
        "passport_number": "VED-2024-001",
        "order_number": "ORD-2024-001",
        "title": "Название паспорта",
        "description": "Описание паспорта",
        "quantity": 1,
        "status": "active",
        "nomenclature_id": 1
    }
    
    return APIResponse(
        success=True,
        message="Шаблон файла ВЭД паспортов",
        data={
            "template": template_data,
            "required_columns": ["passport_number", "order_number"],
            "optional_columns": [
                "title", "description", "quantity", "status", "nomenclature_id"
            ],
            "instructions": "Обязательные колонки: passport_number, order_number. Остальные колонки опциональны."
        }
    )
