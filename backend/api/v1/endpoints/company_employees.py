from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from database import get_db
from models import CompanyEmployee, User, UserRole
from .auth import get_current_user

router = APIRouter()


class EmployeeResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    position: str
    department_id: int
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    sort_order: int
    created_at: Optional[str] = None


class EmployeeListResponse(BaseModel):
    employees: List[EmployeeResponse]


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    position: str
    department_id: int
    email: Optional[str] = None
    phone: Optional[str] = None


class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    position: Optional[str] = None
    department_id: Optional[int] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeReorderItem(BaseModel):
    id: int
    sort_order: int


class EmployeeReorderRequest(BaseModel):
    employees: List[EmployeeReorderItem]


@router.get("/", response_model=EmployeeListResponse)
def get_employees(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получение списка сотрудников компании"""
    try:
        # Используем raw SQL для получения сотрудников
        query = """
            SELECT id, first_name, last_name, position, department_id, email, phone, is_active, sort_order, created_at 
            FROM company_employees 
            WHERE is_active = true 
            ORDER BY sort_order ASC, id ASC 
            LIMIT %s OFFSET %s
        """
        
        result = db.execute(text(query), [limit, skip]).fetchall()
        
        employees_list = []
        for row in result:
            employee_dict = {
                "id": row[0],
                "first_name": row[1],
                "last_name": row[2],
                "position": row[3],
                "department_id": row[4],
                "email": row[5],
                "phone": row[6],
                "is_active": row[7],
                "sort_order": row[8],
                "created_at": row[9].isoformat() if row[9] else None
            }
            employees_list.append(employee_dict)
        
        return EmployeeListResponse(employees=employees_list)
    except Exception as e:
        print(f"Ошибка в get_employees: {e}")
        return EmployeeListResponse(employees=[])


@router.get("/count")
def count_employees(db: Session = Depends(get_db)):
    """Подсчет сотрудников в базе"""
    try:
        count = db.execute(text("SELECT COUNT(*) FROM company_employees")).scalar()
        return {"count": count}
    except Exception as e:
        return {"error": str(e)}


@router.post("/", response_model=EmployeeResponse)
def create_employee(
    employee_data: EmployeeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового сотрудника"""
    try:
        # Проверяем права пользователя
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для создания сотрудников"
            )
        
        # Получаем следующий sort_order
        max_order_result = db.execute(text("SELECT MAX(sort_order) FROM company_employees")).scalar()
        next_order = (max_order_result or 0) + 1
        
        # Создаем сотрудника
        insert_query = """
            INSERT INTO company_employees (first_name, last_name, position, department_id, email, phone, is_active, sort_order, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, first_name, last_name, position, department_id, email, phone, is_active, sort_order, created_at
        """
        
        result = db.execute(text(insert_query), [
            employee_data.first_name,
            employee_data.last_name,
            employee_data.position,
            employee_data.department_id,
            employee_data.email,
            employee_data.phone,
            True,  # is_active
            next_order,
            datetime.now()
        ]).fetchone()
        
        db.commit()
        
        return EmployeeResponse(
            id=result[0],
            first_name=result[1],
            last_name=result[2],
            position=result[3],
            department_id=result[4],
            email=result[5],
            phone=result[6],
            is_active=result[7],
            sort_order=result[8],
            created_at=result[9].isoformat() if result[9] else None
        )
    except Exception as e:
        db.rollback()
        print(f"Ошибка в create_employee: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании сотрудника: {str(e)}"
        )


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление сотрудника"""
    try:
        # Проверяем права пользователя
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для обновления сотрудников"
            )
        
        # Проверяем существование сотрудника
        check_query = "SELECT id FROM company_employees WHERE id = %s"
        existing = db.execute(text(check_query), [employee_id]).fetchone()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Сотрудник не найден"
            )
        
        # Строим запрос обновления
        update_fields = []
        params = []
        
        if employee_data.first_name is not None:
            update_fields.append("first_name = %s")
            params.append(employee_data.first_name)
        
        if employee_data.last_name is not None:
            update_fields.append("last_name = %s")
            params.append(employee_data.last_name)
        
        if employee_data.position is not None:
            update_fields.append("position = %s")
            params.append(employee_data.position)
        
        if employee_data.department_id is not None:
            update_fields.append("department_id = %s")
            params.append(employee_data.department_id)
        
        if employee_data.email is not None:
            update_fields.append("email = %s")
            params.append(employee_data.email)
        
        if employee_data.phone is not None:
            update_fields.append("phone = %s")
            params.append(employee_data.phone)
        
        if employee_data.is_active is not None:
            update_fields.append("is_active = %s")
            params.append(employee_data.is_active)
        
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Нет данных для обновления"
            )
        
        update_query = f"""
            UPDATE company_employees 
            SET {', '.join(update_fields)}, updated_at = %s
            WHERE id = %s
            RETURNING id, first_name, last_name, position, department_id, email, phone, is_active, sort_order, created_at
        """
        
        params.extend([datetime.now(), employee_id])
        result = db.execute(text(update_query), params).fetchone()
        
        db.commit()
        
        return EmployeeResponse(
            id=result[0],
            first_name=result[1],
            last_name=result[2],
            position=result[3],
            department_id=result[4],
            email=result[5],
            phone=result[6],
            is_active=result[7],
            sort_order=result[8],
            created_at=result[9].isoformat() if result[9] else None
        )
    except Exception as e:
        db.rollback()
        print(f"Ошибка в update_employee: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обновлении сотрудника: {str(e)}"
        )


@router.put("/reorder-employees")
def reorder_employees(
    reorder_data: EmployeeReorderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Изменение порядка сотрудников"""
    try:
        # Проверяем права пользователя
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для изменения порядка сотрудников"
            )
        
        # Обновляем порядок для каждого сотрудника
        for employee in reorder_data.employees:
            update_query = "UPDATE company_employees SET sort_order = %s WHERE id = %s"
            db.execute(text(update_query), [employee.sort_order, employee.id])
        
        db.commit()
        
        return {"message": "Порядок сотрудников обновлен успешно"}
    except Exception as e:
        db.rollback()
        print(f"Ошибка в reorder_employees: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при изменении порядка сотрудников: {str(e)}"
        )


@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление сотрудника (мягкое удаление)"""
    try:
        # Проверяем права пользователя
        if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для удаления сотрудников"
            )
        
        # Проверяем существование сотрудника
        check_query = "SELECT id FROM company_employees WHERE id = %s"
        existing = db.execute(text(check_query), [employee_id]).fetchone()
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Сотрудник не найден"
            )
        
        # Мягкое удаление (устанавливаем is_active = false)
        delete_query = "UPDATE company_employees SET is_active = false, updated_at = %s WHERE id = %s"
        db.execute(text(delete_query), [datetime.now(), employee_id])
        
        db.commit()
        
        return {"message": "Сотрудник удален успешно"}
    except Exception as e:
        db.rollback()
        print(f"Ошибка в delete_employee: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при удалении сотрудника: {str(e)}"
        )