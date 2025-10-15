from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, Department, Event, News, CompanyEmployee, VedPassport, ArticleSearchRequest
from api.v1.dependencies import get_current_user
from api.v1.schemas import APIResponse
from passlib.context import CryptContext
from datetime import datetime

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

# Пользователи
@router.post("/users", response_model=APIResponse)
def create_user(
    user_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового пользователя"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Проверяем уникальность username и email
        existing_user = db.query(User).filter(
            (User.username == user_data['username']) | 
            (User.email == user_data['email'])
        ).first()
        
        if existing_user:
            raise HTTPException(status_code=400, detail="Пользователь с таким username или email уже существует")
        
        # Создаем нового пользователя
        user = User(
            username=user_data['username'],
            email=user_data['email'],
            hashed_password=get_password_hash(user_data['password']),
            first_name=user_data.get('first_name', ''),
            last_name=user_data.get('last_name', ''),
            role=user_data['role'],
            department_id=user_data.get('department_id'),
            is_active=user_data.get('is_active', True),
            is_password_changed=False
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return APIResponse(
            success=True,
            message="Пользователь успешно создан",
            data={"user_id": user.id, "username": user.username}
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания пользователя: {str(e)}")

# Отделы
@router.post("/departments", response_model=APIResponse)
def create_department(
    department_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового отдела"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        department = Department(
            name=department_data['name'],
            description=department_data.get('description', ''),
            head_id=department_data.get('manager_id')
        )
        
        db.add(department)
        db.commit()
        db.refresh(department)
        
        return APIResponse(
            success=True,
            message="Отдел успешно создан",
            data={"department_id": department.id, "name": department.name}
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания отдела: {str(e)}")

# События
@router.post("/events", response_model=APIResponse)
def create_event(
    event_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового события"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Преобразуем даты
        start_date = datetime.fromisoformat(event_data['start_date'].replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(event_data['end_date'].replace('Z', '+00:00'))
        
        event = Event(
            title=event_data['title'],
            description=event_data.get('description', ''),
            start_date=start_date,
            end_date=end_date,
            event_type=event_data['event_type'],
            is_public=event_data.get('is_public', False),
            organizer_id=event_data['organizer_id']
        )
        
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return APIResponse(
            success=True,
            message="Событие успешно создано",
            data={"event_id": event.id, "title": event.title}
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания события: {str(e)}")

# Новости
@router.post("/news", response_model=APIResponse)
def create_news(
    news_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание новой новости"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        news = News(
            title=news_data['title'],
            content=news_data['content'],
            author_id=news_data['author_id'],
            is_published=news_data.get('is_published', False),
            created_at=datetime.now()
        )
        
        db.add(news)
        db.commit()
        db.refresh(news)
        
        return APIResponse(
            success=True,
            message="Новость успешно создана",
            data={"news_id": news.id, "title": news.title}
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания новости: {str(e)}")

# Сотрудники компании
@router.post("/company-employees", response_model=APIResponse)
def create_company_employee(
    employee_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового сотрудника компании"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Разделяем имя на части
        name_parts = employee_data['name'].split(' ', 2)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        middle_name = name_parts[2] if len(name_parts) > 2 else ''
        
        employee = CompanyEmployee(
            first_name=first_name,
            last_name=last_name,
            middle_name=middle_name,
            position=employee_data['position'],
            department_id=employee_data.get('department_id'),  # Используем department_id вместо department
            email=employee_data.get('email', ''),
            phone=employee_data.get('phone', '')
        )
        
        db.add(employee)
        db.commit()
        db.refresh(employee)
        
        return APIResponse(
            success=True,
            message="Сотрудник успешно создан",
            data={"employee_id": employee.id, "name": f"{employee.first_name} {employee.last_name}"}
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания сотрудника: {str(e)}")

# ВЭД Паспорта
@router.post("/ved-passports", response_model=APIResponse)
def create_ved_passport(
    passport_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового ВЭД паспорта"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        passport = VedPassport(
            passport_number=passport_data['passport_number'],
            order_number=passport_data['order_number'],
            title=passport_data.get('title', ''),
            description=passport_data.get('description', ''),
            quantity=passport_data['quantity'],
            status=passport_data['status'],
            nomenclature_id=passport_data['nomenclature_id'],
            created_by=passport_data['created_by'],
            created_at=datetime.now()
        )
        
        db.add(passport)
        db.commit()
        db.refresh(passport)
        
        return APIResponse(
            success=True,
            message="ВЭД паспорт успешно создан",
            data={"passport_id": passport.id, "passport_number": passport.passport_number}
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания ВЭД паспорта: {str(e)}")

# Запросы поиска статей
@router.post("/article-search-requests", response_model=APIResponse)
def create_article_search_request(
    request_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового запроса поиска статей"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        search_request = ArticleSearchRequest(
            search_query=request_data['search_query'],
            search_type=request_data['search_type'],
            status=request_data['status'],
            user_id=request_data['user_id'],
            created_at=datetime.now()
        )
        
        db.add(search_request)
        db.commit()
        db.refresh(search_request)
        
        return APIResponse(
            success=True,
            message="Запрос поиска статей успешно создан",
            data={"request_id": search_request.id, "search_query": search_request.search_query}
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка создания запроса поиска: {str(e)}")
