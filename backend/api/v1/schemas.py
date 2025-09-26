"""
API v1 - Общие схемы и модели данных
"""

from pydantic import BaseModel, Field, validator, ConfigDict, field_validator
from typing import Optional, List, Any, Dict, Union
from datetime import datetime
from enum import Enum

from .shared.constants import UserRoles, RequestStatus, FileTypes


class BaseResponseModel(BaseModel):
    """Базовый класс для всех схем ответов с валидацией datetime полей"""
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator('*', mode='before')
    @classmethod
    def convert_datetime_to_string(cls, v, info):
        if info.field_name in ['created_at', 'updated_at'] and isinstance(v, datetime):
            return v.isoformat()
        return v


class APIResponse(BaseModel):
    """Базовая схема ответа API"""
    model_config = ConfigDict(from_attributes=True)
    
    success: bool = Field(default=True, description="Статус выполнения операции")
    message: Optional[str] = Field(None, description="Сообщение о результате операции")
    data: Optional[Any] = Field(None, description="Данные ответа")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat(), description="Временная метка")


class ErrorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема ошибки API"""
    success: bool = Field(default=False, description="Статус выполнения операции")
    error: str = Field(description="Описание ошибки")
    error_code: Optional[str] = Field(None, description="Код ошибки")
    details: Optional[Dict[str, Any]] = Field(None, description="Дополнительные детали ошибки")
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat(), description="Временная метка")


class PaginationParams(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Параметры пагинации"""
    page: int = Field(default=1, ge=1, description="Номер страницы")
    size: int = Field(default=20, ge=1, le=100, description="Размер страницы")
    sort_by: Optional[str] = Field(None, description="Поле для сортировки")
    sort_order: str = Field(default="asc", description="Порядок сортировки (asc/desc)")
    
    @field_validator('sort_order')
    @classmethod
    def validate_sort_order(cls, v):
        if v not in ['asc', 'desc']:
            raise ValueError('Порядок сортировки должен быть asc или desc')
        return v


class PaginatedResponse(APIResponse):
    """Схема пагинированного ответа"""
    data: List[Any] = Field(description="Список данных")
    pagination: Dict[str, Any] = Field(description="Информация о пагинации")


class HealthCheckResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема ответа проверки здоровья"""
    status: str = Field(description="Статус сервиса")
    service: str = Field(description="Название сервиса")
    database: str = Field(description="Статус базы данных")
    timestamp: datetime = Field(description="Временная метка")
    version: str = Field(default="1.0.0", description="Версия API")


class VersionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Информация о версии API"""
    version: str = Field(description="Версия API")
    name: str = Field(description="Название API")
    description: str = Field(description="Описание API")
    status: str = Field(description="Статус API")
    endpoints: List[str] = Field(description="Список доступных эндпоинтов")


# Схемы для пользователей
class UserBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Базовая схема пользователя"""
    username: str = Field(description="Имя пользователя")
    email: str = Field(description="Email адрес")
    first_name: str = Field(description="Имя")
    last_name: str = Field(description="Фамилия")
    middle_name: Optional[str] = Field(None, description="Отчество")
    phone: Optional[str] = Field(None, description="Номер телефона")
    department_id: Optional[int] = Field(None, description="ID отдела")
    position: Optional[str] = Field(None, description="Должность")
    role: str = Field(default=UserRoles.EMPLOYEE, description="Роль пользователя")
    is_active: bool = Field(default=True, description="Активен ли пользователь")


class UserCreate(UserBase):
    """Схема для создания пользователя"""
    username: Optional[str] = Field(default=None, description="Имя пользователя (если не указано, будет сгенерировано автоматически)")
    middle_name: Optional[str] = Field(default=None, description="Отчество")
    department_id: Optional[int] = Field(default=None, description="ID отдела")
    position: Optional[str] = Field(default=None, description="Должность")
    password: Optional[str] = Field(default=None, description="Пароль (если не указан, будет сгенерирован автоматически)")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        from .shared.utils import validate_email
        if not validate_email(v):
            raise ValueError('Некорректный формат email адреса')
        return v
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if v is not None and v != "" and v != "undefined":
            from .shared.utils import validate_password_strength
            is_valid, errors = validate_password_strength(v)
            if not is_valid:
                raise ValueError(f'Пароль не соответствует требованиям: {"; ".join(errors)}')
        return v


class UserUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема для обновления пользователя"""
    username: Optional[str] = Field(None, description="Имя пользователя")
    email: Optional[str] = Field(None, description="Email адрес")
    first_name: Optional[str] = Field(None, description="Имя")
    last_name: Optional[str] = Field(None, description="Фамилия")
    middle_name: Optional[str] = Field(None, description="Отчество")
    phone: Optional[str] = Field(None, description="Номер телефона")
    position: Optional[str] = Field(None, description="Должность")
    department_id: Optional[int] = Field(None, description="ID отдела")
    avatar_url: Optional[str] = Field(None, description="URL аватара")
    role: Optional[str] = Field(None, description="Роль пользователя")
    is_active: Optional[bool] = Field(None, description="Активен ли пользователь")
    
    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if v is not None:
            from .shared.utils import validate_email
            if not validate_email(v):
                raise ValueError('Некорректный формат email адреса')
        return v


class UserResponse(BaseResponseModel):
    """Схема ответа с информацией о пользователе"""
    id: int = Field(description="ID пользователя")
    username: str = Field(description="Имя пользователя")
    email: Optional[str] = Field(None, description="Email адрес")
    first_name: Optional[str] = Field(None, description="Имя")
    last_name: Optional[str] = Field(None, description="Фамилия")
    middle_name: Optional[str] = Field(None, description="Отчество")
    full_name: Optional[str] = Field(None, description="Полное имя")
    role: str = Field(description="Роль пользователя")
    is_active: bool = Field(description="Активен ли пользователь")
    is_password_changed: bool = Field(description="Был ли изменен пароль")
    phone: Optional[str] = Field(None, description="Номер телефона")
    department_id: Optional[int] = Field(None, description="ID отдела")
    position: Optional[str] = Field(None, description="Должность")
    avatar_url: Optional[str] = Field(None, description="URL аватара")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


# Схемы для аутентификации
class LoginRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема запроса входа"""
    username: str = Field(description="Имя пользователя")
    password: str = Field(description="Пароль")


class UserLogin(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема запроса входа"""
    username: str = Field(description="Имя пользователя")
    password: str = Field(description="Пароль")


class LoginResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема ответа входа"""
    access_token: str = Field(description="Токен доступа")
    token_type: str = Field(default="bearer", description="Тип токена")
    expires_in: int = Field(description="Время жизни токена в секундах")
    user: UserResponse = Field(description="Информация о пользователе")


class UserProfileUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления профиля пользователя"""
    first_name: Optional[str] = Field(None, description="Имя")
    last_name: Optional[str] = Field(None, description="Фамилия")
    middle_name: Optional[str] = Field(None, description="Отчество")
    email: Optional[str] = Field(None, description="Email адрес")
    phone: Optional[str] = Field(None, description="Номер телефона")
    position: Optional[str] = Field(None, description="Должность")
    avatar_url: Optional[str] = Field(None, description="URL аватара")


class PasswordReset(BaseModel):
    """Схема сброса пароля"""
    old_password: str = Field(description="Старый пароль")
    new_password: str = Field(description="Новый пароль")


class AdminPasswordReset(BaseModel):
    """Схема сброса пароля администратором"""
    user_id: int = Field(description="ID пользователя")


class Department(BaseResponseModel):
    """Схема отдела"""
    id: int = Field(description="ID отдела")
    name: str = Field(description="Название отдела")
    description: Optional[str] = Field(None, description="Описание отдела")
    sort_order: int = Field(description="Порядок сортировки")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class DepartmentList(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема списка отделов"""
    departments: List[Department] = Field(description="Список отделов")
    total: int = Field(description="Общее количество отделов")


class DepartmentCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания отдела"""
    name: str = Field(description="Название отдела")
    description: Optional[str] = Field(None, description="Описание отдела")
    head_id: Optional[int] = Field(None, description="ID руководителя отдела")


class DepartmentUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления отдела"""
    name: Optional[str] = Field(None, description="Название отдела")
    description: Optional[str] = Field(None, description="Описание отдела")


class DepartmentCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема ответа создания отдела"""
    success: bool = Field(description="Статус операции")
    message: str = Field(description="Сообщение")
    data: Department = Field(description="Данные отдела")


class DepartmentReorderItem(BaseModel):
    """Схема элемента для переупорядочивания отделов"""
    id: int = Field(description="ID отдела")
    sort_order: int = Field(description="Новый порядок сортировки")


class DepartmentReorderRequest(BaseModel):
    """Схема запроса переупорядочивания отделов"""
    departments: List[DepartmentReorderItem] = Field(description="Список отделов с новым порядком")


class EmployeeReorderItem(BaseModel):
    """Схема элемента для переупорядочивания сотрудников"""
    id: int = Field(description="ID сотрудника")
    sort_order: int = Field(description="Новый порядок сортировки")


class EmployeeReorderRequest(BaseModel):
    """Схема запроса переупорядочивания сотрудников"""
    employees: List[EmployeeReorderItem] = Field(description="Список сотрудников с новым порядком")


class CompanyEmployee(BaseResponseModel):
    """Схема сотрудника компании"""
    id: int = Field(description="ID сотрудника")
    first_name: str = Field(description="Имя")
    last_name: str = Field(description="Фамилия")
    middle_name: Optional[str] = Field(None, description="Отчество")
    email: Optional[str] = Field(None, description="Email")
    phone: Optional[str] = Field(None, description="Телефон")
    position: Optional[str] = Field(None, description="Должность")
    department_id: int = Field(description="ID отдела")
    department_name: Optional[str] = Field(None, description="Название отдела")
    sort_order: int = Field(description="Порядок сортировки")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class CompanyEmployeeList(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема списка сотрудников компании"""
    employees: List[CompanyEmployee] = Field(description="Список сотрудников")
    total: int = Field(description="Общее количество сотрудников")


class CompanyEmployeeCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания сотрудника компании"""
    first_name: str = Field(description="Имя")
    last_name: str = Field(description="Фамилия")
    middle_name: Optional[str] = Field(None, description="Отчество")
    email: Optional[str] = Field(None, description="Email")
    phone: Optional[str] = Field(None, description="Телефон")
    position: str = Field(description="Должность")
    department_id: int = Field(description="ID отдела")
    is_active: bool = Field(default=True, description="Активен ли сотрудник")


class CompanyEmployeeUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления сотрудника компании"""
    first_name: Optional[str] = Field(None, description="Имя")
    last_name: Optional[str] = Field(None, description="Фамилия")
    middle_name: Optional[str] = Field(None, description="Отчество")
    email: Optional[str] = Field(None, description="Email")
    phone: Optional[str] = Field(None, description="Телефон")
    position: Optional[str] = Field(None, description="Должность")
    department_id: Optional[int] = Field(None, description="ID отдела")
    is_active: Optional[bool] = Field(None, description="Активен ли сотрудник")


class CompanyEmployeeCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема ответа создания сотрудника компании"""
    success: bool = Field(description="Статус операции")
    message: str = Field(description="Сообщение")
    data: CompanyEmployee = Field(description="Данные сотрудника")


class ContractorRegistration(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема регистрации подрядчика"""
    username: str = Field(description="Имя пользователя")
    password: str = Field(description="Пароль")
    first_name: str = Field(description="Имя")
    last_name: str = Field(description="Фамилия")
    middle_name: Optional[str] = Field(None, description="Отчество")
    email: Optional[str] = Field(None, description="Email")
    phone: Optional[str] = Field(None, description="Телефон")
    company_name: Optional[str] = Field(None, description="Название компании")
    inn: Optional[str] = Field(None, description="ИНН")
    address: Optional[str] = Field(None, description="Адрес")


class ContractorProfile(BaseResponseModel):
    """Схема профиля подрядчика"""
    id: int = Field(description="ID профиля")
    user_id: int = Field(description="ID пользователя")
    first_name: str = Field(description="Имя")
    last_name: str = Field(description="Фамилия")
    middle_name: Optional[str] = Field(None, description="Отчество")
    email: Optional[str] = Field(None, description="Email")
    phone: Optional[str] = Field(None, description="Телефон")
    company_name: Optional[str] = Field(None, description="Название компании")
    inn: Optional[str] = Field(None, description="ИНН")
    address: Optional[str] = Field(None, description="Адрес")
    bio: Optional[str] = Field(None, description="О себе")
    skills: Optional[str] = Field(None, description="Навыки")
    experience: Optional[str] = Field(None, description="Опыт работы")
    portfolio_url: Optional[str] = Field(None, description="Ссылка на портфолио")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class ContractorProfileUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления профиля подрядчика"""
    first_name: Optional[str] = Field(None, description="Имя")
    last_name: Optional[str] = Field(None, description="Фамилия")
    middle_name: Optional[str] = Field(None, description="Отчество")
    email: Optional[str] = Field(None, description="Email")
    phone: Optional[str] = Field(None, description="Телефон")
    company_name: Optional[str] = Field(None, description="Название компании")
    inn: Optional[str] = Field(None, description="ИНН")
    address: Optional[str] = Field(None, description="Адрес")
    bio: Optional[str] = Field(None, description="О себе")
    skills: Optional[str] = Field(None, description="Навыки")
    experience: Optional[str] = Field(None, description="Опыт работы")
    portfolio_url: Optional[str] = Field(None, description="Ссылка на портфолио")


class CustomerRegistration(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема регистрации заказчика"""
    username: str = Field(description="Имя пользователя")
    password: str = Field(description="Пароль")
    first_name: str = Field(description="Имя")
    last_name: str = Field(description="Фамилия")
    middle_name: Optional[str] = Field(None, description="Отчество")
    email: Optional[str] = Field(None, description="Email")
    phone: Optional[str] = Field(None, description="Телефон")
    company_name: Optional[str] = Field(None, description="Название компании")
    inn: Optional[str] = Field(None, description="ИНН")
    address: Optional[str] = Field(None, description="Адрес")


class CustomerProfile(BaseResponseModel):
    """Схема профиля заказчика"""
    id: int = Field(description="ID профиля")
    user_id: int = Field(description="ID пользователя")
    first_name: str = Field(description="Имя")
    last_name: str = Field(description="Фамилия")
    middle_name: Optional[str] = Field(None, description="Отчество")
    email: Optional[str] = Field(None, description="Email")
    phone: Optional[str] = Field(None, description="Телефон")
    company_name: Optional[str] = Field(None, description="Название компании")
    inn: Optional[str] = Field(None, description="ИНН")
    address: Optional[str] = Field(None, description="Адрес")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class CustomerProfileUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления профиля заказчика"""
    first_name: Optional[str] = Field(None, description="Имя")
    last_name: Optional[str] = Field(None, description="Фамилия")
    middle_name: Optional[str] = Field(None, description="Отчество")
    email: Optional[str] = Field(None, description="Email")
    phone: Optional[str] = Field(None, description="Телефон")
    company_name: Optional[str] = Field(None, description="Название компании")
    inn: Optional[str] = Field(None, description="ИНН")
    address: Optional[str] = Field(None, description="Адрес")


class RepairRequest(BaseResponseModel):
    """Схема заявки на ремонт"""
    id: int = Field(description="ID заявки")
    customer_id: int = Field(description="ID заказчика")
    title: str = Field(description="Название заявки")
    description: str = Field(description="Описание заявки")
    status: str = Field(description="Статус заявки")
    priority: str = Field(description="Приоритет заявки")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class RepairRequestCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания заявки на ремонт"""
    title: str = Field(description="Название заявки")
    description: str = Field(description="Описание заявки")
    priority: str = Field(description="Приоритет заявки")


class RepairRequestUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления заявки на ремонт"""
    title: Optional[str] = Field(None, description="Название заявки")
    description: Optional[str] = Field(None, description="Описание заявки")
    status: Optional[str] = Field(None, description="Статус заявки")
    priority: Optional[str] = Field(None, description="Приоритет заявки")


class ContractorResponse(BaseResponseModel):
    """Схема ответа подрядчика"""
    id: int = Field(description="ID ответа")
    request_id: int = Field(description="ID заявки")
    contractor_id: int = Field(description="ID подрядчика")
    message: str = Field(description="Сообщение")
    price: Optional[float] = Field(None, description="Цена")
    status: str = Field(description="Статус ответа")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class ContractorResponseCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания ответа подрядчика"""
    message: str = Field(description="Сообщение")
    price: Optional[float] = Field(None, description="Цена")


class ContractorResponseUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления ответа подрядчика"""
    message: Optional[str] = Field(None, description="Сообщение")
    price: Optional[float] = Field(None, description="Цена")
    status: Optional[str] = Field(None, description="Статус ответа")


class VEDNomenclature(BaseResponseModel):
    """Схема номенклатуры ВЭД"""
    id: int = Field(description="ID номенклатуры")
    code_1c: str = Field(description="Код 1С")
    name: str = Field(description="Название")
    article: str = Field(description="Артикул")
    matrix: str = Field(description="Матрица")
    drilling_depth: Optional[str] = Field(None, description="Глубина бурения")
    height: Optional[str] = Field(None, description="Высота")
    thread: Optional[str] = Field(None, description="Резьба")
    product_type: str = Field(description="Тип продукта")
    is_active: bool = Field(description="Активен")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class VEDNomenclatureCreate(BaseModel):
    """Схема создания номенклатуры ВЭД"""
    code_1c: str = Field(description="Код 1С", min_length=1)
    name: str = Field(description="Название", min_length=1)
    article: str = Field(description="Артикул", min_length=1)
    matrix: str = Field(description="Матрица", min_length=1)
    drilling_depth: Optional[str] = Field(None, description="Глубина бурения")
    height: Optional[str] = Field(None, description="Высота")
    thread: Optional[str] = Field(None, description="Резьба")
    product_type: str = Field(description="Тип продукта", min_length=1)
    is_active: bool = Field(True, description="Активен")


class VEDNomenclatureUpdate(BaseModel):
    """Схема обновления номенклатуры ВЭД"""
    code_1c: Optional[str] = Field(None, description="Код 1С", min_length=1)
    name: Optional[str] = Field(None, description="Название", min_length=1)
    article: Optional[str] = Field(None, description="Артикул", min_length=1)
    matrix: Optional[str] = Field(None, description="Матрица", min_length=1)
    drilling_depth: Optional[str] = Field(None, description="Глубина бурения")
    height: Optional[str] = Field(None, description="Высота")
    thread: Optional[str] = Field(None, description="Резьба")
    product_type: Optional[str] = Field(None, description="Тип продукта", min_length=1)
    is_active: Optional[bool] = Field(None, description="Активен")


class VedPassport(BaseResponseModel):
    """Схема ВЭД паспорта"""
    id: int = Field(description="ID паспорта")
    passport_number: str = Field(description="Номер паспорта")
    title: Optional[str] = Field(None, description="Заголовок")
    description: Optional[str] = Field(None, description="Описание")
    status: str = Field(description="Статус")
    order_number: str = Field(description="Номер заказа")
    quantity: int = Field(description="Количество")
    nomenclature_id: int = Field(description="ID номенклатуры")
    created_by: int = Field(description="ID создателя")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")
    nomenclature: Optional[VEDNomenclature] = Field(None, description="Номенклатура")
    creator: Optional[UserResponse] = Field(None, description="Создатель паспорта")


class VedPassportCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания ВЭД паспорта"""
    nomenclature_id: int = Field(description="ID номенклатуры")
    order_number: str = Field(description="Номер заказа")
    quantity: int = Field(description="Количество", default=1)
    title: Optional[str] = Field(None, description="Заголовок")
    description: Optional[str] = Field(None, description="Описание")


class VedPassportUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления ВЭД паспорта"""
    nomenclature_id: Optional[int] = Field(None, description="ID номенклатуры")
    order_number: Optional[str] = Field(None, description="Номер заказа")
    quantity: Optional[int] = Field(None, description="Количество")
    title: Optional[str] = Field(None, description="Заголовок")
    description: Optional[str] = Field(None, description="Описание")
    status: Optional[str] = Field(None, description="Статус")


class BulkPassportItem(BaseModel):
    """Схема элемента для массового создания паспортов"""
    code_1c: str = Field(description="Код 1С")


# Схемы для системы сопоставления артикулов

class ArticleMapping(BaseResponseModel):
    """Схема соответствия артикулов"""
    id: int = Field(description="ID соответствия")
    contractor_article: str = Field(description="Артикул контрагента")
    contractor_description: str = Field(description="Описание контрагента")
    agb_article: str = Field(description="Артикул АГБ")
    agb_description: str = Field(description="Описание АГБ")
    bl_article: Optional[str] = Field(None, description="Артикул BL")
    bl_description: Optional[str] = Field(None, description="Описание BL")
    packaging_factor: int = Field(description="Коэффициент фасовки")
    unit: str = Field(description="Единица измерения")
    is_active: bool = Field(description="Активен")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")
    nomenclature: Optional[VEDNomenclature] = Field(None, description="Номенклатура")


class ArticleMappingCreate(BaseModel):
    """Схема создания соответствия артикулов"""
    contractor_article: str = Field(description="Артикул контрагента", min_length=1)
    contractor_description: str = Field(description="Описание контрагента", min_length=1)
    agb_article: str = Field(description="Артикул АГБ", min_length=1)
    agb_description: str = Field(description="Описание АГБ", min_length=1)
    bl_article: Optional[str] = Field(None, description="Артикул BL")
    bl_description: Optional[str] = Field(None, description="Описание BL")
    packaging_factor: int = Field(1, description="Коэффициент фасовки", ge=1)
    unit: str = Field("шт", description="Единица измерения")
    nomenclature_id: Optional[int] = Field(None, description="ID номенклатуры")


class ContractorRequest(BaseResponseModel):
    """Схема заявки контрагента"""
    id: int = Field(description="ID заявки")
    request_number: str = Field(description="Номер заявки")
    contractor_name: str = Field(description="Название контрагента")
    request_date: str = Field(description="Дата заявки")
    status: str = Field(description="Статус")
    total_items: int = Field(description="Общее количество позиций")
    matched_items: int = Field(description="Количество сопоставленных позиций")
    created_by: int = Field(description="ID создателя")
    processed_by: Optional[int] = Field(None, description="ID обработчика")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")
    processed_at: Optional[str] = Field(None, description="Дата обработки")
    creator: Optional[UserResponse] = Field(None, description="Создатель")
    processor: Optional[UserResponse] = Field(None, description="Обработчик")
    items: Optional[List['ContractorRequestItem']] = Field(None, description="Позиции заявки")


class ContractorRequestCreate(BaseModel):
    """Схема создания заявки контрагента"""
    request_number: str = Field(description="Номер заявки", min_length=1)
    contractor_name: str = Field(description="Название контрагента", min_length=1)
    request_date: str = Field(description="Дата заявки")
    items: List['ContractorRequestItemCreate'] = Field(description="Позиции заявки")


class ContractorRequestItem(BaseResponseModel):
    """Схема позиции заявки контрагента"""
    id: int = Field(description="ID позиции")
    request_id: int = Field(description="ID заявки")
    line_number: int = Field(description="Номер строки")
    contractor_article: str = Field(description="Артикул контрагента")
    description: str = Field(description="Описание товара")
    unit: str = Field(description="Единица измерения")
    quantity: int = Field(description="Количество")
    category: Optional[str] = Field(None, description="Категория")
    matched_nomenclature_id: Optional[int] = Field(None, description="ID сопоставленной номенклатуры")
    agb_article: Optional[str] = Field(None, description="Артикул АГБ")
    bl_article: Optional[str] = Field(None, description="Артикул BL")
    packaging_factor: int = Field(description="Коэффициент фасовки")
    recalculated_quantity: Optional[int] = Field(None, description="Пересчитанное количество")
    match_confidence: int = Field(description="Уверенность в сопоставлении")
    match_status: str = Field(description="Статус сопоставления")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")
    matched_nomenclature: Optional[VEDNomenclature] = Field(None, description="Сопоставленная номенклатура")


class ContractorRequestItemCreate(BaseModel):
    """Схема создания позиции заявки контрагента"""
    line_number: int = Field(description="Номер строки", ge=1)
    contractor_article: str = Field(description="Артикул контрагента", min_length=1)
    description: str = Field(description="Описание товара", min_length=1)
    unit: str = Field("шт", description="Единица измерения")
    quantity: int = Field(description="Количество", ge=1)
    category: Optional[str] = Field(None, description="Категория")


class ContractorRequestItemUpdate(BaseModel):
    """Схема обновления позиции заявки контрагента"""
    matched_nomenclature_id: Optional[int] = Field(None, description="ID сопоставленной номенклатуры")
    agb_article: Optional[str] = Field(None, description="Артикул АГБ")
    bl_article: Optional[str] = Field(None, description="Артикул BL")
    packaging_factor: Optional[int] = Field(None, description="Коэффициент фасовки", ge=1)
    recalculated_quantity: Optional[int] = Field(None, description="Пересчитанное количество", ge=0)
    match_confidence: Optional[int] = Field(None, description="Уверенность в сопоставлении", ge=0, le=100)
    match_status: Optional[str] = Field(None, description="Статус сопоставления")


class MatchingResult(BaseModel):
    """Результат сопоставления"""
    item_id: int = Field(description="ID позиции")
    contractor_article: Optional[str] = Field(None, description="Артикул контрагента")
    description: Optional[str] = Field(None, description="Описание")
    matched: bool = Field(description="Найдено соответствие")
    agb_article: Optional[str] = Field(None, description="Артикул АГБ")
    bl_article: Optional[str] = Field(None, description="Артикул BL")
    packaging_factor: Optional[int] = Field(None, description="Коэффициент фасовки")
    recalculated_quantity: Optional[int] = Field(None, description="Пересчитанное количество")
    match_confidence: Optional[int] = Field(None, description="Уверенность в сопоставлении")
    nomenclature: Optional[VEDNomenclature] = Field(None, description="Номенклатура")


class MatchingSummary(BaseModel):
    """Сводка по сопоставлению"""
    total_items: int = Field(description="Общее количество позиций")
    matched_items: int = Field(description="Сопоставленных позиций")
    unmatched_items: int = Field(description="Не сопоставленных позиций")
    high_confidence_items: int = Field(description="Позиций с высокой уверенностью")
    medium_confidence_items: int = Field(description="Позиций со средней уверенностью")
    low_confidence_items: int = Field(description="Позиций с низкой уверенностью")
    results: List[MatchingResult] = Field(description="Результаты сопоставления")
    quantity: int = Field(description="Количество", default=1)


class BulkPassportCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема массового создания ВЭД паспортов"""
    order_number: str = Field(description="Номер заказа")
    title: Optional[str] = Field(None, description="Заголовок")
    items: List[BulkPassportItem] = Field(description="Список позиций")


class PassportWithNomenclature(BaseModel):
    """Схема паспорта с полными данными номенклатуры"""
    id: int = Field(description="ID паспорта")
    passport_number: str = Field(description="Номер паспорта")
    title: Optional[str] = Field(None, description="Заголовок")
    description: Optional[str] = Field(None, description="Описание")
    status: str = Field(description="Статус")
    order_number: str = Field(description="Номер заказа")
    quantity: int = Field(description="Количество")
    nomenclature_id: int = Field(description="ID номенклатуры")
    created_by: int = Field(description="ID создателя")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")
    nomenclature: Optional[VEDNomenclature] = Field(None, description="Номенклатура")

class PassportGenerationResult(BaseModel):
    """Схема результата генерации паспортов"""
    success: bool = Field(description="Статус операции")
    message: str = Field(description="Сообщение")
    generated_count: int = Field(description="Количество сгенерированных паспортов")
    passports: List[PassportWithNomenclature] = Field(description="Список созданных паспортов", default=[])
    errors: List[str] = Field(description="Список ошибок")


class News(BaseResponseModel):
    """Схема новости"""
    id: int = Field(description="ID новости")
    title: str = Field(description="Заголовок")
    content: str = Field(description="Содержание")
    category: str = Field(description="Категория новости")
    author_id: int = Field(description="ID автора")
    author_name: Optional[str] = Field(None, description="Имя автора")
    is_published: bool = Field(description="Опубликована ли новость")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class NewsCreate(BaseModel):
    """Схема создания новости"""
    title: str = Field(description="Заголовок")
    content: str = Field(description="Содержание")
    category: str = Field(description="Категория новости")
    is_published: bool = Field(default=True, description="Опубликована ли новость")


class NewsUpdate(BaseModel):
    """Схема обновления новости"""
    title: Optional[str] = Field(None, description="Заголовок")
    content: Optional[str] = Field(None, description="Содержание")
    category: Optional[str] = Field(None, description="Категория новости")
    is_published: Optional[bool] = Field(None, description="Опубликована ли новость")


class EventResponse(BaseResponseModel):
    """Схема ответа события"""
    id: int = Field(description="ID события")
    title: str = Field(description="Название события")
    description: str = Field(description="Описание события")
    start_date: str = Field(description="Дата начала")
    end_date: str = Field(description="Дата окончания")
    event_type: str = Field(description="Тип события")
    is_public: bool = Field(description="Публичное событие")
    location: Optional[str] = Field(None, description="Место проведения")
    max_participants: Optional[int] = Field(None, description="Максимальное количество участников")
    current_participants: int = Field(description="Текущее количество участников")
    participants: List[dict] = Field(default=[], description="Список участников")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class EventCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания события"""
    title: str = Field(description="Название события")
    description: Optional[str] = Field(None, description="Описание события")
    start_date: str = Field(description="Дата начала")
    end_date: str = Field(description="Дата окончания")
    event_type: str = Field(default="meeting", description="Тип события")
    is_public: bool = Field(default=False, description="Публичное событие")
    participants: List[int] = Field(default=[], description="Список ID участников")
    location: Optional[str] = Field(None, description="Место проведения")
    max_participants: Optional[int] = Field(None, description="Максимальное количество участников")


class EventUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления события"""
    title: Optional[str] = Field(None, description="Название события")
    description: Optional[str] = Field(None, description="Описание события")
    start_date: Optional[str] = Field(None, description="Дата начала")
    end_date: Optional[str] = Field(None, description="Дата окончания")
    event_type: Optional[str] = Field(None, description="Тип события")
    is_public: Optional[bool] = Field(None, description="Публичное событие")
    participants: Optional[List[int]] = Field(None, description="Список ID участников")
    location: Optional[str] = Field(None, description="Место проведения")
    max_participants: Optional[int] = Field(None, description="Максимальное количество участников")


class TeamMember(BaseResponseModel):
    """Схема участника команды"""
    id: int = Field(description="ID участника команды")
    user_id: int = Field(description="ID пользователя")
    role: str = Field(description="Роль в команде")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class TeamMemberCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания участника команды"""
    user_id: int = Field(description="ID пользователя")
    role: str = Field(description="Роль в команде")


class TeamMemberUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления участника команды"""
    role: Optional[str] = Field(None, description="Роль в команде")


class TeamMemberWithUser(BaseResponseModel):
    """Схема участника команды с информацией о пользователе"""
    id: int = Field(description="ID участника команды")
    user_id: int = Field(description="ID пользователя")
    role: str = Field(description="Роль в команде")
    user: UserResponse = Field(description="Информация о пользователе")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class ChatRoom(BaseModel):
    """Схема чат комнаты"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(description="ID чат комнаты")
    name: str = Field(description="Название комнаты")
    description: Optional[str] = Field(None, description="Описание комнаты")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")
    folders: Optional[List[Any]] = Field(default=[], description="Папки чата")
    
    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def convert_datetime_to_string(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class ChatRoomCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания чат комнаты"""
    name: str = Field(description="Название комнаты")
    description: Optional[str] = Field(None, description="Описание комнаты")


class ChatRoomUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления чат комнаты"""
    name: Optional[str] = Field(None, description="Название комнаты")
    description: Optional[str] = Field(None, description="Описание комнаты")


class ChatRoomCreateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема ответа создания чат комнаты"""
    success: bool = Field(description="Статус операции")
    message: str = Field(description="Сообщение")
    data: ChatRoom = Field(description="Данные чат комнаты")


class ChatRoomDetailResponse(BaseResponseModel):
    """Схема детального ответа чат комнаты"""
    id: int = Field(description="ID чат комнаты")
    name: str = Field(description="Название комнаты")
    description: Optional[str] = Field(None, description="Описание комнаты")
    participants: List[Any] = Field(description="Участники комнаты")
    messages: List[Any] = Field(description="Сообщения комнаты")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")
    
    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def convert_datetime_to_string(cls, v):
        if v is None:
            return None
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class ChatBot(BaseResponseModel):
    """Схема чат бота"""
    id: int = Field(description="ID чат бота")
    name: str = Field(description="Название бота")
    description: Optional[str] = Field(None, description="Описание бота")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class ChatBotCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания чат бота"""
    name: str = Field(description="Название бота")
    description: Optional[str] = Field(None, description="Описание бота")


class ChatBotUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления чат бота"""
    name: Optional[str] = Field(None, description="Название бота")
    description: Optional[str] = Field(None, description="Описание бота")


class ChatFolder(BaseResponseModel):
    """Схема папки чатов"""
    id: int = Field(description="ID папки")
    name: str = Field(description="Название папки")
    description: Optional[str] = Field(None, description="Описание папки")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class ChatFolderCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания папки чатов"""
    name: str = Field(description="Название папки")
    description: Optional[str] = Field(None, description="Описание папки")


class ChatFolderUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления папки чатов"""
    name: Optional[str] = Field(None, description="Название папки")
    description: Optional[str] = Field(None, description="Описание папки")


class ChatMessage(BaseResponseModel):
    """Схема сообщения чата"""
    id: int = Field(description="ID сообщения")
    room_id: int = Field(description="ID чат комнаты")
    user_id: int = Field(description="ID пользователя")
    content: str = Field(description="Содержание сообщения")
    message_type: str = Field(description="Тип сообщения")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class ChatMessageCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания сообщения чата"""
    content: str = Field(description="Содержание сообщения")
    message_type: str = Field(description="Тип сообщения")


class ChatMessageUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления сообщения чата"""
    content: Optional[str] = Field(None, description="Содержание сообщения")
    message_type: Optional[str] = Field(None, description="Тип сообщения")


class ChatMessageResponse(BaseResponseModel):
    """Схема ответа сообщения чата"""
    id: int = Field(description="ID сообщения")
    room_id: int = Field(description="ID чат комнаты")
    user_id: int = Field(description="ID пользователя")
    user_name: Optional[str] = Field(None, description="Имя пользователя")
    content: str = Field(description="Содержание сообщения")
    message_type: str = Field(description="Тип сообщения")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class ChatParticipant(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема участника чата"""
    id: int = Field(description="ID участника")
    room_id: int = Field(description="ID чат комнаты")
    user_id: int = Field(description="ID пользователя")
    joined_at: str = Field(description="Дата присоединения")
    left_at: Optional[str] = Field(None, description="Дата выхода")


class ChatParticipantCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания участника чата"""
    user_id: Optional[int] = Field(None, description="ID пользователя")
    bot_id: Optional[int] = Field(None, description="ID бота")
    is_admin: bool = Field(False, description="Является ли администратором")


class ChatParticipantResponse(BaseResponseModel):
    """Схема ответа участника чата"""
    id: int = Field(description="ID участника")
    room_id: int = Field(description="ID чат комнаты")
    user_id: int = Field(description="ID пользователя")
    user_name: Optional[str] = Field(None, description="Имя пользователя")
    joined_at: str = Field(description="Дата присоединения")
    left_at: Optional[str] = Field(None, description="Дата выхода")


class ChatParticipantAdminUpdate(BaseModel):
    """Схема обновления прав администратора участника"""
    is_admin: bool = Field(description="Является ли администратором")


class ChatFolderRoomAdd(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема добавления комнаты в папку"""
    room_id: int = Field(description="ID чат комнаты")


class TelegramBot(BaseResponseModel):
    """Схема Telegram бота"""
    id: int = Field(description="ID бота")
    name: str = Field(description="Название бота")
    token: str = Field(description="Токен бота")
    webhook_url: Optional[str] = Field(None, description="URL webhook")
    is_active: bool = Field(description="Активен ли бот")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class TelegramBotCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания Telegram бота"""
    name: str = Field(description="Название бота")
    token: str = Field(description="Токен бота")
    webhook_url: Optional[str] = Field(None, description="URL webhook")


class TelegramBotUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления Telegram бота"""
    name: Optional[str] = Field(None, description="Название бота")
    token: Optional[str] = Field(None, description="Токен бота")
    webhook_url: Optional[str] = Field(None, description="URL webhook")
    is_active: Optional[bool] = Field(None, description="Активен ли бот")


class TelegramUser(BaseResponseModel):
    """Схема Telegram пользователя"""
    id: int = Field(description="ID пользователя")
    telegram_id: int = Field(description="Telegram ID")
    username: Optional[str] = Field(None, description="Имя пользователя")
    first_name: Optional[str] = Field(None, description="Имя")
    last_name: Optional[str] = Field(None, description="Фамилия")
    created_at: str = Field(description="Дата создания")
    updated_at: Optional[str] = Field(None, description="Дата обновления")


class TelegramUserCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема создания Telegram пользователя"""
    telegram_id: int = Field(description="Telegram ID")
    username: Optional[str] = Field(None, description="Имя пользователя")
    first_name: Optional[str] = Field(None, description="Имя")
    last_name: Optional[str] = Field(None, description="Фамилия")


class TelegramUserUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления Telegram пользователя"""
    username: Optional[str] = Field(None, description="Имя пользователя")
    first_name: Optional[str] = Field(None, description="Имя")
    last_name: Optional[str] = Field(None, description="Фамилия")


class TelegramNotification(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема Telegram уведомления"""
    id: int = Field(description="ID уведомления")
    user_id: int = Field(description="ID пользователя")
    message: str = Field(description="Сообщение")
    sent_at: str = Field(description="Дата отправки")
    status: str = Field(description="Статус отправки")


class TelegramWebhookUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема обновления webhook"""
    webhook_url: str = Field(description="URL webhook")


class TelegramBotCommand(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема команды Telegram бота"""
    command: str = Field(description="Команда")
    description: str = Field(description="Описание команды")


class RegisterRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема запроса регистрации"""
    username: str = Field(description="Имя пользователя")
    email: str = Field(description="Email адрес")
    password: str = Field(description="Пароль")
    first_name: str = Field(description="Имя")
    last_name: str = Field(description="Фамилия")
    phone: Optional[str] = Field(None, description="Номер телефона")


# Схемы для файлов
class FileUpload(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема загрузки файла"""
    filename: str = Field(description="Имя файла")
    content_type: str = Field(description="MIME тип файла")
    size: int = Field(description="Размер файла в байтах")
    file_type: str = Field(description="Тип файла")
    
    @field_validator('file_type')
    @classmethod
    def validate_file_type(cls, v):
        if v not in [FileTypes.IMAGE, FileTypes.DOCUMENT, FileTypes.ARCHIVE, FileTypes.AUDIO, FileTypes.VIDEO]:
            raise ValueError('Неподдерживаемый тип файла')
        return v


class FileResponse(BaseResponseModel):
    """Схема ответа с информацией о файле"""
    id: int = Field(description="ID файла")
    filename: str = Field(description="Имя файла")
    original_filename: str = Field(description="Оригинальное имя файла")
    content_type: str = Field(description="MIME тип файла")
    size: int = Field(description="Размер файла в байтах")
    file_type: str = Field(description="Тип файла")
    url: str = Field(description="URL файла")
    created_at: str = Field(description="Дата загрузки")
    uploaded_by: int = Field(description="ID пользователя, загрузившего файл")


class TextUploadRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """Схема загрузки текстовой заявки"""
    text: str = Field(description="Текст заявки")
    contractor_name: str = Field(description="Название контрагента")


# Разрешаем forward references
ContractorRequest.model_rebuild()
ContractorRequestCreate.model_rebuild()


# Схемы для API ключей
class ApiKeyBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    name: str = Field(description="Название ключа")
    provider: str = Field(description="Провайдер (openai, polza, custom)")
    is_active: bool = Field(default=True, description="Активен ли ключ")

class ApiKeyCreate(ApiKeyBase):
    """Схема создания API ключа"""
    key: str = Field(description="API ключ")

class ApiKeyUpdate(BaseModel):
    """Схема обновления API ключа"""
    model_config = ConfigDict(from_attributes=True)
    
    name: Optional[str] = Field(None, description="Название ключа")
    provider: Optional[str] = Field(None, description="Провайдер")
    key: Optional[str] = Field(None, description="API ключ")
    is_active: Optional[bool] = Field(None, description="Активен ли ключ")

class ApiKeyResponse(ApiKeyBase):
    """Схема ответа API ключа"""
    id: int = Field(description="ID ключа")
    created_at: datetime = Field(description="Дата создания")
    last_used: Optional[datetime] = Field(None, description="Дата последнего использования")
    created_by: int = Field(description="ID создателя")


# Схемы для настроек приложения
class AppSettingsBase(BaseModel):
    """Базовая схема настроек приложения"""
    model_config = ConfigDict(from_attributes=True)
    
    key: str = Field(description="Ключ настройки")
    value: str = Field(description="Значение настройки")
    description: Optional[str] = Field(None, description="Описание настройки")
    is_encrypted: bool = Field(default=False, description="Зашифровано ли значение")

class AppSettingsCreate(AppSettingsBase):
    """Схема создания настройки"""
    pass

class AppSettingsUpdate(BaseModel):
    """Схема обновления настройки"""
    model_config = ConfigDict(from_attributes=True)
    
    value: Optional[str] = Field(None, description="Значение настройки")
    description: Optional[str] = Field(None, description="Описание настройки")
    is_encrypted: Optional[bool] = Field(None, description="Зашифровано ли значение")

class AppSettingsResponse(AppSettingsBase):
    """Схема ответа настройки"""
    id: int = Field(description="ID настройки")
    created_at: datetime = Field(description="Дата создания")
    updated_at: Optional[datetime] = Field(None, description="Дата обновления")


# Схемы для ИИ обработки
class AIMatchingRequest(BaseModel):
    """Схема запроса ИИ сопоставления"""
    model_config = ConfigDict(from_attributes=True)
    
    message: str = Field(description="Сообщение пользователя")
    files: Optional[List[str]] = Field(None, description="Список файлов")

class MatchingResult(BaseModel):
    """Схема результата сопоставления"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(description="ID результата")
    contractor_article: Optional[str] = Field(None, description="Артикул контрагента")
    description: Optional[str] = Field(None, description="Описание")
    matched: bool = Field(description="Найдено соответствие")
    agb_article: Optional[str] = Field(None, description="Артикул АГБ")
    bl_article: Optional[str] = Field(None, description="Артикул BL")
    match_confidence: Optional[float] = Field(None, description="Уверенность сопоставления")
    packaging_factor: Optional[float] = Field(None, description="Коэффициент фасовки")
    recalculated_quantity: Optional[float] = Field(None, description="Пересчитанное количество")
    nomenclature: Optional[dict] = Field(None, description="Номенклатура")
    search_type: Optional[str] = Field(None, description="Тип поиска (existing_mapping, ai_search, etc.)")
    is_existing_mapping: Optional[bool] = Field(None, description="Является ли найденное сопоставление уже существующим")
    mapping_id: Optional[int] = Field(None, description="ID существующего сопоставления")

class AIMatchingResponse(BaseModel):
    """Схема ответа ИИ сопоставления"""
    model_config = ConfigDict(from_attributes=True)
    
    message: str = Field(description="Сообщение ИИ")
    matching_results: Optional[List[MatchingResult]] = Field(None, description="Результаты сопоставления")
    processing_time: Optional[float] = Field(None, description="Время обработки")
    status: str = Field(description="Статус обработки")


# Схемы для чата с ИИ
class ChatMessageCreate(BaseModel):
    """Схема создания сообщения чата"""
    content: str = Field(description="Текст сообщения", min_length=1)
    files_data: Optional[dict] = Field(default=None, description="Данные о файлах")
    matching_results: Optional[dict] = Field(default=None, description="Результаты сопоставления")

    model_config = ConfigDict(from_attributes=True)


class ChatMessageResponse(BaseModel):
    """Схема ответа сообщения чата"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(description="ID сообщения")
    message_type: str = Field(default="user", description="Тип сообщения")
    content: str = Field(description="Текст сообщения")
    files_data: Optional[dict] = Field(default=None, description="Данные о файлах")
    matching_results: Optional[dict] = Field(default=None, description="Результаты сопоставления")
    is_processing: bool = Field(default=False, description="Обрабатывается ли сообщение")
    created_at: datetime = Field(default_factory=datetime.now, description="Дата создания")
    
    @field_validator('created_at', mode='before')
    @classmethod
    def convert_datetime(cls, v):
        if isinstance(v, str):
            return datetime.fromisoformat(v)
        return v


class ChatSessionCreate(BaseModel):
    """Схема создания сессии чата"""
    title: Optional[str] = Field(None, description="Название сессии")


class ChatSessionResponse(BaseModel):
    """Схема ответа сессии чата"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int = Field(description="ID сессии")
    title: Optional[str] = Field(None, description="Название сессии")
    created_at: datetime = Field(description="Дата создания")
    updated_at: Optional[datetime] = Field(None, description="Дата обновления")
    messages: Optional[List[ChatMessageResponse]] = Field(default=None, description="Сообщения сессии")
    
    @field_validator('created_at', 'updated_at', mode='before')
    @classmethod
    def convert_datetime(cls, v):
        if isinstance(v, str):
            return datetime.fromisoformat(v)
        return v
    
    @field_validator('messages', mode='before')
    @classmethod
    def validate_messages(cls, v):
        if v is None:
            return []
        return v
