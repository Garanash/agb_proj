"""
API v1 - Домен пользователей
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime

from ...shared.constants import APITags, Pagination, UserRoles
from ...shared.exceptions import NotFoundError, ValidationError, AuthorizationError
from ...shared.utils import validate_email, validate_phone, normalize_phone, paginate_data, create_response
from ...schemas import APIResponse, UserResponse, PaginatedResponse

router = APIRouter()


@router.get("/", response_model=PaginatedResponse, tags=[APITags.USERS])
async def get_users(
    page: int = Query(Pagination.DEFAULT_PAGE, ge=1, description="Номер страницы"),
    size: int = Query(Pagination.DEFAULT_SIZE, ge=1, le=Pagination.MAX_SIZE, description="Размер страницы"),
    search: Optional[str] = Query(None, description="Поисковый запрос"),
    role: Optional[str] = Query(None, description="Фильтр по роли"),
    is_active: Optional[bool] = Query(None, description="Фильтр по активности")
):
    """Получение списка пользователей с пагинацией и фильтрацией"""
    
    # Валидация параметров
    if search and len(search.strip()) < 2:
        raise ValidationError("Поисковый запрос должен содержать минимум 2 символа")
    
    if role and role not in [UserRoles.ADMIN, UserRoles.MANAGER, UserRoles.EMPLOYEE, UserRoles.CONTRACTOR, UserRoles.CUSTOMER]:
        raise ValidationError("Некорректная роль пользователя")
    
    # Здесь должна быть логика получения пользователей из базы данных
    # Пока что заглушка с тестовыми данными
    users_data = [
        {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "first_name": "Администратор",
            "last_name": "Системы",
            "role": UserRoles.ADMIN,
            "is_active": True,
            "created_at": "2025-01-01T00:00:00Z"
        },
        {
            "id": 2,
            "username": "manager1",
            "email": "manager@example.com",
            "first_name": "Менеджер",
            "last_name": "Отдела",
            "role": UserRoles.MANAGER,
            "is_active": True,
            "created_at": "2025-01-02T00:00:00Z"
        },
        {
            "id": 3,
            "username": "employee1",
            "email": "employee@example.com",
            "first_name": "Сотрудник",
            "last_name": "Обычный",
            "role": UserRoles.EMPLOYEE,
            "is_active": True,
            "created_at": "2025-01-03T00:00:00Z"
        }
    ]
    
    # Применяем фильтры
    filtered_users = users_data
    
    if search:
        search_lower = search.lower()
        filtered_users = [
            user for user in filtered_users
            if (search_lower in user["username"].lower() or
                search_lower in user["first_name"].lower() or
                search_lower in user["last_name"].lower() or
                search_lower in user["email"].lower())
        ]
    
    if role:
        filtered_users = [user for user in filtered_users if user["role"] == role]
    
    if is_active is not None:
        filtered_users = [user for user in filtered_users if user["is_active"] == is_active]
    
    # Применяем пагинацию
    paginated_data = paginate_data(filtered_users, page, size)
    
    return PaginatedResponse(
        success=True,
        message="Список пользователей",
        data=paginated_data["items"],
        pagination={
            "total": paginated_data["total"],
            "page": paginated_data["page"],
            "size": paginated_data["size"],
            "pages": paginated_data["pages"],
            "has_next": paginated_data["has_next"],
            "has_prev": paginated_data["has_prev"]
        }
    )


@router.get("/{user_id}", response_model=APIResponse, tags=[APITags.USERS])
async def get_user(user_id: int):
    """Получение информации о пользователе по ID"""
    
    if user_id < 1:
        raise ValidationError("ID пользователя должен быть положительным числом")
    
    # Здесь должна быть логика получения пользователя из базы данных
    # Пока что заглушка
    if user_id == 1:
        user_data = {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "first_name": "Администратор",
            "last_name": "Системы",
            "role": UserRoles.ADMIN,
            "is_active": True,
            "created_at": "2025-01-01T00:00:00Z",
            "last_login": "2025-09-11T07:00:00Z"
        }
    else:
        raise NotFoundError("Пользователь")
    
    return APIResponse(
        success=True,
        message="Информация о пользователе",
        data=user_data
    )


@router.post("/", response_model=APIResponse, tags=[APITags.USERS])
async def create_user(
    username: str,
    email: str,
    password: str,
    first_name: str,
    last_name: str,
    role: str = UserRoles.EMPLOYEE,
    phone: Optional[str] = None
):
    """Создание нового пользователя"""
    
    # Валидация входных данных
    if not all([username, email, password, first_name, last_name]):
        raise ValidationError("Все обязательные поля должны быть заполнены")
    
    if not validate_email(email):
        raise ValidationError("Некорректный формат email адреса")
    
    if phone and not validate_phone(phone):
        raise ValidationError("Некорректный формат номера телефона")
    
    if role not in [UserRoles.ADMIN, UserRoles.MANAGER, UserRoles.EMPLOYEE, UserRoles.CONTRACTOR, UserRoles.CUSTOMER]:
        raise ValidationError("Некорректная роль пользователя")
    
    if len(username) < 3:
        raise ValidationError("Имя пользователя должно содержать минимум 3 символа")
    
    if len(first_name) < 2 or len(last_name) < 2:
        raise ValidationError("Имя и фамилия должны содержать минимум 2 символа")
    
    # Нормализуем телефон если он указан
    if phone:
        phone = normalize_phone(phone)
    
    # Здесь должна быть логика создания пользователя в базе данных
    # Пока что заглушка
    
    return APIResponse(
        success=True,
        message="Пользователь успешно создан",
        data={
            "id": 4,  # Предполагаемый ID нового пользователя
            "username": username,
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "role": role,
            "phone": phone,
            "is_active": True,
            "created_at": datetime.now().isoformat()
        }
    )


@router.put("/{user_id}", response_model=APIResponse, tags=[APITags.USERS])
async def update_user(
    user_id: int,
    username: Optional[str] = None,
    email: Optional[str] = None,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    role: Optional[str] = None,
    phone: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """Обновление информации о пользователе"""
    
    if user_id < 1:
        raise ValidationError("ID пользователя должен быть положительным числом")
    
    # Валидация входных данных
    if email and not validate_email(email):
        raise ValidationError("Некорректный формат email адреса")
    
    if phone and not validate_phone(phone):
        raise ValidationError("Некорректный формат номера телефона")
    
    if role and role not in [UserRoles.ADMIN, UserRoles.MANAGER, UserRoles.EMPLOYEE, UserRoles.CONTRACTOR, UserRoles.CUSTOMER]:
        raise ValidationError("Некорректная роль пользователя")
    
    if username and len(username) < 3:
        raise ValidationError("Имя пользователя должно содержать минимум 3 символа")
    
    if (first_name and len(first_name) < 2) or (last_name and len(last_name) < 2):
        raise ValidationError("Имя и фамилия должны содержать минимум 2 символа")
    
    # Нормализуем телефон если он указан
    if phone:
        phone = normalize_phone(phone)
    
    # Здесь должна быть логика обновления пользователя в базе данных
    # Пока что заглушка
    
    return APIResponse(
        success=True,
        message="Пользователь успешно обновлен",
        data={
            "id": user_id,
            "updated_at": datetime.now().isoformat()
        }
    )


@router.delete("/{user_id}", response_model=APIResponse, tags=[APITags.USERS])
async def delete_user(user_id: int):
    """Удаление пользователя"""
    
    if user_id < 1:
        raise ValidationError("ID пользователя должен быть положительным числом")
    
    # Здесь должна быть логика удаления пользователя из базы данных
    # Пока что заглушка
    
    return APIResponse(
        success=True,
        message="Пользователь успешно удален"
    )


@router.patch("/{user_id}/activate", response_model=APIResponse, tags=[APITags.USERS])
async def activate_user(user_id: int):
    """Активация пользователя"""
    
    if user_id < 1:
        raise ValidationError("ID пользователя должен быть положительным числом")
    
    # Здесь должна быть логика активации пользователя
    # Пока что заглушка
    
    return APIResponse(
        success=True,
        message="Пользователь успешно активирован"
    )


@router.patch("/{user_id}/deactivate", response_model=APIResponse, tags=[APITags.USERS])
async def deactivate_user(user_id: int):
    """Деактивация пользователя"""
    
    if user_id < 1:
        raise ValidationError("ID пользователя должен быть положительным числом")
    
    # Здесь должна быть логика деактивации пользователя
    # Пока что заглушка
    
    return APIResponse(
        success=True,
        message="Пользователь успешно деактивирован"
    )
