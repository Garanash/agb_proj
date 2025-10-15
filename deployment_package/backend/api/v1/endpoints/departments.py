from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from database import get_db
from models import Department, User, UserRole
from ..schemas import Department as DepartmentSchema, DepartmentList, DepartmentCreate, DepartmentUpdate
from .auth import get_current_user
from ..dependencies import get_current_user_optional

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


@router.post("/", response_model=DepartmentSchema)
def create_department(
    department_data: DepartmentCreate,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Создание нового отдела"""
    try:
        # Проверяем права доступа
        if not current_user:
            raise HTTPException(status_code=401, detail="Требуется аутентификация")
        
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
            raise HTTPException(status_code=403, detail="Недостаточно прав для создания отдела")
        
        # Создаем новый отдел
        department = Department(
            name=department_data.name,
            description=department_data.description,
            head_id=getattr(department_data, 'head_id', None),
            is_active=True,  # По умолчанию активен
            sort_order=getattr(department_data, 'sort_order', 0)
        )
        
        db.add(department)
        db.commit()
        db.refresh(department)
        
        return department
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при создании отдела: {str(e)}")


@router.put("/{department_id}", response_model=DepartmentSchema)
def update_department(
    department_id: int,
    department_data: DepartmentUpdate,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Обновление отдела"""
    try:
        # Проверяем права доступа
        if not current_user:
            raise HTTPException(status_code=401, detail="Требуется аутентификация")
        
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
            raise HTTPException(status_code=403, detail="Недостаточно прав для обновления отдела")
        
        # Находим отдел
        department = db.query(Department).filter(Department.id == department_id).first()
        if not department:
            raise HTTPException(status_code=404, detail="Отдел не найден")
        
        # Обновляем поля
        if department_data.name is not None:
            department.name = department_data.name
        if department_data.description is not None:
            department.description = department_data.description
        if department_data.head_id is not None:
            department.head_id = department_data.head_id
        if department_data.is_active is not None:
            department.is_active = department_data.is_active
        if department_data.sort_order is not None:
            department.sort_order = department_data.sort_order
        
        db.commit()
        db.refresh(department)
        
        return department
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении отдела: {str(e)}")


@router.delete("/{department_id}")
def delete_department(
    department_id: int,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Удаление отдела"""
    try:
        # Проверяем права доступа
        if not current_user:
            raise HTTPException(status_code=401, detail="Требуется аутентификация")
        
        if current_user.role not in [UserRole.ADMIN]:
            raise HTTPException(status_code=403, detail="Недостаточно прав для удаления отдела")
        
        # Находим отдел
        department = db.query(Department).filter(Department.id == department_id).first()
        if not department:
            raise HTTPException(status_code=404, detail="Отдел не найден")
        
        db.delete(department)
        db.commit()
        
        return {"message": "Отдел успешно удален"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении отдела: {str(e)}")