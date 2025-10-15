"""
API v1 - Домен аутентификации
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import jwt

from ...shared.constants import APITags, Security
from ...shared.exceptions import AuthenticationError, ValidationError
from ...shared.utils import validate_email, validate_password_strength, create_response
from ...schemas import APIResponse, UserResponse

router = APIRouter()
security = HTTPBearer()


class LoginRequest(BaseModel):
    username: str
    password: str


@router.options("/login")
async def login_options():
    """Обработка preflight запроса для login"""
    return {}


@router.post("/login", response_model=APIResponse, tags=[APITags.AUTH])
async def login(request: LoginRequest):
    """Вход в систему"""
    
    username = request.username
    password = request.password
    
    # Валидация входных данных
    if not username or not password:
        raise ValidationError("Имя пользователя и пароль обязательны")
    
    if len(username) < 3:
        raise ValidationError("Имя пользователя должно содержать минимум 3 символа")
    
    if len(password) < Security.PASSWORD_MIN_LENGTH:
        raise ValidationError(f"Пароль должен содержать минимум {Security.PASSWORD_MIN_LENGTH} символов")
    
    # Здесь должна быть проверка в базе данных
    # Пока что заглушка
    if username == "admin" and password == "admin123":
        # Генерируем JWT токен
        token_data = {
            "sub": username,
            "exp": datetime.utcnow() + timedelta(minutes=Security.TOKEN_EXPIRE_MINUTES),
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        token = jwt.encode(token_data, "secret_key", algorithm="HS256")
        
        return APIResponse(
            success=True,
            message="Успешный вход в систему",
            data={
                "access_token": token,
                "token_type": "bearer",
                "expires_in": Security.TOKEN_EXPIRE_MINUTES * 60,
                "user": {
                    "username": username,
                    "role": "admin"
                }
            }
        )
    
    raise AuthenticationError("Неверные учетные данные")


@router.post("/logout", response_model=APIResponse, tags=[APITags.AUTH])
async def logout(token: str = Depends(security)):
    """Выход из системы"""
    
    # Здесь должна быть логика добавления токена в черный список
    # Пока что заглушка
    
    return APIResponse(
        success=True,
        message="Успешный выход из системы"
    )


@router.post("/register", response_model=APIResponse, tags=[APITags.AUTH])
async def register(
    username: str,
    email: str,
    password: str,
    first_name: str,
    last_name: str
):
    """Регистрация нового пользователя"""
    
    # Валидация входных данных
    if not all([username, email, password, first_name, last_name]):
        raise ValidationError("Все поля обязательны для заполнения")
    
    if not validate_email(email):
        raise ValidationError("Некорректный формат email адреса")
    
    is_valid, errors = validate_password_strength(password)
    if not is_valid:
        raise ValidationError(f"Пароль не соответствует требованиям: {'; '.join(errors)}")
    
    if len(username) < 3:
        raise ValidationError("Имя пользователя должно содержать минимум 3 символа")
    
    if len(first_name) < 2 or len(last_name) < 2:
        raise ValidationError("Имя и фамилия должны содержать минимум 2 символа")
    
    # Здесь должна быть логика создания пользователя в базе данных
    # Пока что заглушка
    
    return APIResponse(
        success=True,
        message="Пользователь успешно зарегистрирован",
        data={
            "username": username,
            "email": email,
            "first_name": first_name,
            "last_name": last_name
        }
    )


@router.post("/refresh", response_model=APIResponse, tags=[APITags.AUTH])
async def refresh_token(refresh_token: str):
    """Обновление токена доступа"""
    
    try:
        # Декодируем refresh токен
        payload = jwt.decode(refresh_token, "secret_key", algorithms=["HS256"])
        
        if payload.get("type") != "refresh":
            raise AuthenticationError("Неверный тип токена")
        
        # Создаем новый access токен
        token_data = {
            "sub": payload["sub"],
            "exp": datetime.utcnow() + timedelta(minutes=Security.TOKEN_EXPIRE_MINUTES),
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        new_token = jwt.encode(token_data, "secret_key", algorithm="HS256")
        
        return APIResponse(
            success=True,
            message="Токен успешно обновлен",
            data={
                "access_token": new_token,
                "token_type": "bearer",
                "expires_in": Security.TOKEN_EXPIRE_MINUTES * 60
            }
        )
        
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Токен истек")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Неверный токен")


@router.post("/forgot-password", response_model=APIResponse, tags=[APITags.AUTH])
async def forgot_password(email: str):
    """Восстановление пароля"""
    
    if not validate_email(email):
        raise ValidationError("Некорректный формат email адреса")
    
    # Здесь должна быть логика отправки письма с ссылкой для сброса пароля
    # Пока что заглушка
    
    return APIResponse(
        success=True,
        message="Инструкции по восстановлению пароля отправлены на email"
    )


@router.get("/me", response_model=APIResponse, tags=[APITags.AUTH])
async def get_current_user(token: str = Depends(security)):
    """Получение информации о текущем пользователе"""
    
    try:
        # Декодируем токен
        payload = jwt.decode(token.credentials, "secret_key", algorithms=["HS256"])
        username = payload.get("sub")
        
        if not username:
            raise AuthenticationError("Неверный токен")
        
        # Здесь должна быть логика получения пользователя из базы данных
        # Пока что заглушка
        
        return APIResponse(
            success=True,
            message="Информация о пользователе",
            data={
                "username": username,
                "role": "admin",
                "is_active": True
            }
        )
        
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Токен истек")
    except jwt.InvalidTokenError:
        raise AuthenticationError("Неверный токен")
