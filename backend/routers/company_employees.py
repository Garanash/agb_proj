from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List

from database import get_db
from models import CompanyEmployee, Department, User
from schemas import CompanyEmployee as CompanyEmployeeSchema, CompanyEmployeeList, CompanyEmployeeCreateResponse, CompanyEmployeeCreate, CompanyEmployeeUpdate
from routers.auth import get_current_user

router = APIRouter()


@router.post("/", response_model=CompanyEmployeeCreateResponse)
async def create_company_employee(
    employee_data: CompanyEmployeeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание нового сотрудника компании"""
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    # Проверяем существование отдела
    result = await db.execute(select(Department).where(Department.id == employee_data.department_id))
    department = result.scalar_one_or_none()
    if not department:
        raise HTTPException(status_code=404, detail="Отдел не найден")
    
    # Создаем сотрудника
    db_employee = CompanyEmployee(**employee_data.dict())
    db.add(db_employee)
    await db.commit()
    await db.refresh(db_employee)
    
    # Возвращаем созданного сотрудника без связанных данных
    return db_employee


@router.get("/", response_model=List[CompanyEmployeeList])
async def get_company_employees(
    department_id: int = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка сотрудников компании"""
    query = select(CompanyEmployee).where(CompanyEmployee.is_active == True)
    
    if department_id:
        query = query.where(CompanyEmployee.department_id == department_id)
    
    # Не загружаем связанные данные для списка, чтобы избежать циклических ссылок
    
    result = await db.execute(query)
    employees = result.scalars().all()
    return employees


@router.get("/{employee_id}", response_model=CompanyEmployeeSchema)
async def get_company_employee(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение сотрудника компании по ID"""
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(CompanyEmployee)
        .where(CompanyEmployee.id == employee_id)
        .options(selectinload(CompanyEmployee.department))
    )
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    return employee


@router.put("/{employee_id}", response_model=CompanyEmployeeCreateResponse)
async def update_company_employee(
    employee_id: int,
    employee_update: CompanyEmployeeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление сотрудника компании"""
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    result = await db.execute(select(CompanyEmployee).where(CompanyEmployee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    # Если меняется отдел, проверяем его существование
    if employee_update.department_id:
        result = await db.execute(select(Department).where(Department.id == employee_update.department_id))
        department = result.scalar_one_or_none()
        if not department:
            raise HTTPException(status_code=404, detail="Отдел не найден")
    
    for field, value in employee_update.dict(exclude_unset=True).items():
        setattr(employee, field, value)
    
    await db.commit()
    await db.refresh(employee)
    
    # Возвращаем обновленного сотрудника без связанных данных
    return employee


@router.delete("/{employee_id}")
async def delete_company_employee(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление сотрудника компании"""
    if current_user.role not in ['admin', 'manager']:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    result = await db.execute(select(CompanyEmployee).where(CompanyEmployee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    await db.delete(employee)
    await db.commit()
    
    return {"message": "Сотрудник удален"}
