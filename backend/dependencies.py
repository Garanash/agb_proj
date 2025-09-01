"""
Зависимости для FastAPI приложения
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError, jwt
import os

from database import get_db
from models import User
from routers.auth import get_user_by_username

# Конфигурация
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Получение текущего пользователя из токена"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await get_user_by_username(db, username)
    if user is None:
        raise credentials_exception

    return user


async def get_current_user_optional(
    request,
    db: AsyncSession = Depends(get_db)
):
    """Получение текущего пользователя из токена (опционально)"""
    try:
        # Получаем заголовок Authorization из запроса
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return None

        # Извлекаем токен из заголовка
        scheme, token = auth_header.split()
        if scheme.lower() != "bearer":
            return None

        # Декодируем токен
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None

        user = await get_user_by_username(db, username)
        return user

    except Exception:
        return None
