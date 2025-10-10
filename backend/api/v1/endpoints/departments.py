from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from database import get_db
from models import Department, User, UserRole
from ..schemas import Department as DepartmentSchema, DepartmentList
from .auth import get_current_user

router = APIRouter()


def check_admin(current_user: User):
    """Проверка прав администратора"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения этой операции"
        )


@router.get("/raw")
def get_raw_departments(db: Session = Depends(get_db)):
    """Получение отделов через raw SQL"""
    try:
        query = "SELECT id, name, description, head_id, is_active, sort_order, created_at FROM departments WHERE is_active = true ORDER BY sort_order ASC, id ASC"
        
        result = db.execute(text(query)).fetchall()
        
        departments_list = []
        for row in result:
            dept_dict = {
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "head_id": row[3],
                "head_name": None,
                "is_active": row[4],
                "sort_order": row[5],
                "created_at": row[6].isoformat() if row[6] else None,
                "updated_at": None,
                "employee_count": 0
            }
            departments_list.append(dept_dict)
        
        return departments_list
    except Exception as e:
        return {"error": str(e)}


@router.get("/count")
def count_departments(db: Session = Depends(get_db)):
    """Подсчет отделов в базе"""
    try:
        count = db.execute(text("SELECT COUNT(*) FROM departments")).scalar()
        return {"count": count}
    except Exception as e:
        return {"error": str(e)}


@router.get("/list", response_model=DepartmentList)
def get_departments(
    db: Session = Depends(get_db)
):
    """Получение списка отделов"""
    try:
        # Используем raw SQL для получения отделов
        query = "SELECT id, name, description, head_id, is_active, sort_order, created_at FROM departments WHERE is_active = true ORDER BY sort_order ASC, id ASC"
        
        result = db.execute(text(query)).fetchall()
        
        departments_list = []
        for row in result:
            dept_dict = {
                "id": row[0],
                "name": row[1],
                "description": row[2],
                "head_id": row[3],
                "head_name": None,  # Пока не получаем имя руководителя
                "is_active": row[4],
                "sort_order": row[5],
                "created_at": row[6].isoformat() if row[6] else None,
                "updated_at": None,  # Пока не получаем updated_at
                "employee_count": 0  # Пока не считаем сотрудников
            }
            departments_list.append(dept_dict)
        
        return DepartmentList(departments=departments_list, total=len(departments_list))
    except Exception as e:
        print(f"Ошибка в get_departments: {e}")
        return DepartmentList(departments=[], total=0)


@router.get("/", response_model=DepartmentList)
def get_departments_root(
    db: Session = Depends(get_db)
):
    """Получение списка отделов (корневой endpoint)"""
    return get_departments(db)


@router.get("/{department_id}", response_model=DepartmentSchema)
def get_department(
    department_id: int,
    db: Session = Depends(get_db)
):
    """Получение отдела по ID"""
    department = db.query(Department).filter(Department.id == department_id).first()
    
    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отдел не найден"
        )
    
    return DepartmentSchema(
        id=department.id,
        name=department.name,
        description=department.description,
        head_id=department.head_id,
        is_active=department.is_active,
        sort_order=department.sort_order,
        created_at=department.created_at.isoformat() if department.created_at else None,
        updated_at=department.updated_at.isoformat() if department.updated_at else None
    )