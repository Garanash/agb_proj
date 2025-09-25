from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List

from database import get_db
from models import Department, User, UserRole
from ..schemas import Department as DepartmentSchema, DepartmentList, DepartmentCreateResponse, DepartmentCreate, DepartmentUpdate, DepartmentReorderRequest
from .auth import get_current_user

router = APIRouter()


def check_admin(current_user: User):
    """Проверка прав администратора"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения этой операции"
        )


@router.get("/list", response_model=DepartmentList)
async def get_departments(
    db: AsyncSession = Depends(get_db)
):
    """Получение списка отделов"""
    result = await db.execute(
        select(Department)
        .where(Department.is_active == True)
        .order_by(Department.sort_order.asc(), Department.id.asc())
        .options(
            selectinload(Department.head),
            selectinload(Department.employees)
            # Исключаем company_employees для избежания циклической ссылки
        )
    )
    departments = result.scalars().all()
    
    # Преобразуем datetime в строки для корректной сериализации
    departments_list = []
    for dept in departments:
        dept_dict = {
            "id": dept.id,
            "name": dept.name,
            "description": dept.description,
            "is_active": dept.is_active,
            "sort_order": dept.sort_order,
            "created_at": dept.created_at.isoformat(),
            "updated_at": dept.updated_at.isoformat() if dept.updated_at else None,
            "head_id": dept.head_id,
            "head": {
                "id": dept.head.id,
                "username": dept.head.username,
                "role": dept.head.role.value if hasattr(dept.head.role, 'value') else str(dept.head.role),
                "is_active": dept.head.is_active
            } if dept.head else None,
            "employees": [
                {
                    "id": emp.id,
                    "username": emp.username,
                    "role": emp.role.value if hasattr(emp.role, 'value') else str(emp.role),
                    "is_active": emp.is_active
                } for emp in dept.employees
            ] if dept.employees else []
        }
        departments_list.append(dept_dict)
    
    return DepartmentList(
        departments=departments_list,
        total=len(departments_list)
    )


# Редирект роуты для совместимости с frontend
@router.get("/", response_model=DepartmentList)
async def get_departments_root(
    db: AsyncSession = Depends(get_db)
):
    """Редирект на /list для совместимости"""
    return await get_departments(db)


@router.get("/create/", response_model=List[DepartmentList])
async def get_departments_create_slash(
    db: AsyncSession = Depends(get_db)
):
    """Редирект на /list для совместимости с create/"""
    return await get_departments(db)


# POST роуты для совместимости с frontend
@router.post("/", response_model=DepartmentCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_department_root(
    department_data: DepartmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Редирект на /create для совместимости с frontend POST /api/departments/"""
    return await create_department(department_data, current_user, db)


@router.get("/{department_id}", response_model=DepartmentCreateResponse)
async def get_department(
    department_id: int, 
    db: AsyncSession = Depends(get_db)
):
    """Получение отдела по ID"""
    result = await db.execute(
        select(Department)
        .where(Department.id == department_id)
        .options(
            selectinload(Department.head),
            selectinload(Department.employees)
        )
    )
    department = result.scalar_one_or_none()
    
    if not department:
        raise HTTPException(status_code=404, detail="Отдел не найден")
    
    return department


@router.post("/create", response_model=DepartmentCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_department(
    department_data: DepartmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание отдела (только для администраторов)"""
    check_admin(current_user)
    
    # Проверяем, не существует ли отдел с таким названием
    result = await db.execute(select(Department).where(Department.name == department_data.name))
    existing_department = result.scalar_one_or_none()
    
    if existing_department:
        raise HTTPException(status_code=400, detail="Отдел с таким названием уже существует")
    
    # Если указан руководитель, проверяем, что он существует
    if department_data.head_id:
        result = await db.execute(select(User).where(User.id == department_data.head_id))
        head_user = result.scalar_one_or_none()
        if not head_user:
            raise HTTPException(status_code=400, detail="Указанный руководитель не найден")
    
    department = Department(
        name=department_data.name,
        description=department_data.description,
        head_id=department_data.head_id
    )
    
    db.add(department)
    await db.commit()
    
    # Загружаем созданный отдел с связанными данными для корректной сериализации
    result = await db.execute(
        select(Department)
        .where(Department.id == department.id)
        .options(
            selectinload(Department.head),
            selectinload(Department.employees)
        )
    )
    created_department = result.scalar_one()
    
    return DepartmentCreateResponse(
        success=True,
        message="Отдел успешно создан",
        data=created_department
    )


@router.put("/{department_id}", response_model=DepartmentCreateResponse)
async def update_department(
    department_id: int,
    department_data: DepartmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление отдела (только для администраторов)"""
    check_admin(current_user)
    
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalar_one_or_none()
    
    if not department:
        raise HTTPException(status_code=404, detail="Отдел не найден")
    
    # Проверяем уникальность названия, если оно изменяется
    if department_data.name and department_data.name != department.name:
        result = await db.execute(select(Department).where(Department.name == department_data.name))
        existing_department = result.scalar_one_or_none()
        if existing_department:
            raise HTTPException(status_code=400, detail="Отдел с таким названием уже существует")
    
    # Если указан новый руководитель, проверяем, что он существует
    if department_data.head_id:
        result = await db.execute(select(User).where(User.id == department_data.head_id))
        head_user = result.scalar_one_or_none()
        if not head_user:
            raise HTTPException(status_code=400, detail="Указанный руководитель не найден")
    
    # Обновляем поля
    update_data = department_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(department, field, value)
    
    await db.commit()
    
    # Загружаем обновленный отдел с связанными данными для корректной сериализации
    result = await db.execute(
        select(Department)
        .where(Department.id == department_id)
        .options(
            selectinload(Department.head),
            selectinload(Department.employees)
        )
    )
    updated_department = result.scalar_one()
    
    return updated_department


@router.delete("/{department_id}")
async def delete_department(
    department_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление отдела (только для администраторов)"""
    check_admin(current_user)
    
    result = await db.execute(select(Department).where(Department.id == department_id))
    department = result.scalar_one_or_none()
    
    if not department:
        raise HTTPException(status_code=404, detail="Отдел не найден")
    
    # Мягкое удаление - помечаем как неактивный
    department.is_active = False
    
    await db.commit()
    
    return {"message": "Отдел успешно удален"}


@router.put("/reorder")
async def reorder_departments(
    departments: List[dict],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Изменение порядка отделов"""
    print(f"🔍 Получен запрос на переупорядочивание отделов: {departments}")
    print(f"🔍 Количество отделов: {len(departments)}")
    
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    
    try:
        for dept_order in departments:
            dept_id = dept_order.get("id")
            sort_order = dept_order.get("sort_order")
            print(f"🔍 Обновляем отдел {dept_id} с порядком {sort_order}")
            
            if dept_id and sort_order is not None:
                result = await db.execute(
                    select(Department).where(Department.id == dept_id)
                )
                department = result.scalar_one_or_none()
                
                if department:
                    department.sort_order = sort_order
                    db.add(department)
                    print(f"✅ Отдел {dept_id} обновлен")
                else:
                    print(f"❌ Отдел {dept_id} не найден")
        
        await db.commit()
        print("✅ Все отделы успешно обновлены")
        return {"message": "Порядок отделов успешно обновлен"}
    
    except Exception as e:
        await db.rollback()
        print(f"❌ Ошибка при обновлении порядка: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении порядка: {str(e)}")


@router.get("/{department_id}/employees", response_model=List[dict])
async def get_department_employees(
    department_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Получение сотрудников отдела"""
    result = await db.execute(
        select(User).where(User.department_id == department_id, User.is_active == True)
    )
    employees = result.scalars().all()
    
    return [
        {
            "id": emp.id,
            "full_name": emp.full_name,
            "position": emp.position,
            "email": emp.email,
            "phone": emp.phone
        }
        for emp in employees
    ]
