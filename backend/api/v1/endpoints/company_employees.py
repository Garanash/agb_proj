from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List

from database import get_db
from models import CompanyEmployee, Department, User, UserRole
from ..schemas import CompanyEmployee as CompanyEmployeeSchema, CompanyEmployeeList, CompanyEmployeeCreateResponse, CompanyEmployeeCreate, CompanyEmployeeUpdate, EmployeeReorderRequest
from .auth import get_current_user

router = APIRouter()


@router.post("/", response_model=CompanyEmployeeCreateResponse)
async def create_company_employee(
    employee_data: CompanyEmployeeCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание нового сотрудника компании"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    # Проверяем существование отдела
    result = await db.execute(select(Department).where(Department.id == employee_data.department_id))
    department = result.scalar_one_or_none()
    if not department:
        raise HTTPException(status_code=404, detail="Отдел не найден")
    
    # Создаем сотрудника
    employee_dict = employee_data.dict()
    print(f"🔍 Создаем сотрудника с данными: {employee_dict}")
    db_employee = CompanyEmployee(**employee_dict)
    db.add(db_employee)
    await db.commit()
    await db.refresh(db_employee)
    print(f"✅ Сотрудник создан: ID={db_employee.id}, department_id={db_employee.department_id}, is_active={db_employee.is_active}")
    
    # Возвращаем созданного сотрудника в правильном формате
    return CompanyEmployeeCreateResponse(
        success=True,
        message="Сотрудник успешно создан",
        data=db_employee
    )


@router.get("/", response_model=CompanyEmployeeList)
async def get_company_employees(
    department_id: int = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка сотрудников компании"""
    query = select(CompanyEmployee).where(CompanyEmployee.is_active == True)
    
    if department_id:
        query = query.where(CompanyEmployee.department_id == department_id)
    
    # Сортируем по sort_order, затем по id
    query = query.order_by(CompanyEmployee.sort_order.asc(), CompanyEmployee.id.asc())
    
    # Не загружаем связанные данные для списка, чтобы избежать циклических ссылок
    
    result = await db.execute(query)
    employees = result.scalars().all()
    
    # Сериализуем сотрудников
    employees_list = []
    for emp in employees:
        emp_dict = {
            "id": emp.id,
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "middle_name": emp.middle_name,
            "department_id": emp.department_id,
            "position": emp.position,
            "email": emp.email,
            "phone": emp.phone,
            "is_active": emp.is_active,
            "sort_order": emp.sort_order,
            "created_at": emp.created_at.isoformat(),
            "updated_at": emp.updated_at.isoformat() if emp.updated_at else None
        }
        print(f"🔍 Сотрудник в API: ID={emp.id}, department_id={emp.department_id}, is_active={emp.is_active}")
        employees_list.append(emp_dict)
    
    return CompanyEmployeeList(
        employees=employees_list,
        total=len(employees_list)
    )


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


@router.put("/reorder-employees")
async def reorder_employees(
    employees: List[dict],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Изменение порядка сотрудников"""
    print(f"🔍 Получен запрос на переупорядочивание сотрудников: {employees}")
    print(f"🔍 Количество сотрудников: {len(employees)}")
    
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    try:
        for emp_order in employees:
            emp_id = emp_order.get("id")
            sort_order = emp_order.get("sort_order")
            print(f"🔍 Обновляем сотрудника {emp_id} с порядком {sort_order}")
            
            if emp_id and sort_order is not None:
                result = await db.execute(
                    select(CompanyEmployee).where(CompanyEmployee.id == emp_id)
                )
                employee = result.scalar_one_or_none()
                
                if employee:
                    employee.sort_order = sort_order
                    db.add(employee)
                    print(f"✅ Сотрудник {emp_id} обновлен")
                else:
                    print(f"❌ Сотрудник {emp_id} не найден")
        
        await db.commit()
        print("✅ Все сотрудники успешно обновлены")
        return {"message": "Порядок сотрудников успешно обновлен"}
    
    except Exception as e:
        await db.rollback()
        print(f"❌ Ошибка при обновлении порядка: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении порядка: {str(e)}")


@router.put("/{employee_id}", response_model=CompanyEmployeeCreateResponse)
async def update_company_employee(
    employee_id: int,
    employee_update: CompanyEmployeeUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление сотрудника компании"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
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
    
    # Возвращаем обновленного сотрудника в правильном формате
    return CompanyEmployeeCreateResponse(
        success=True,
        message="Сотрудник успешно обновлен",
        data=employee
    )


@router.delete("/{employee_id}")
async def delete_company_employee(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление сотрудника компании"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    result = await db.execute(select(CompanyEmployee).where(CompanyEmployee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Сотрудник не найден")
    
    await db.delete(employee)
    await db.commit()
    
    return {"message": "Сотрудник удален"}
