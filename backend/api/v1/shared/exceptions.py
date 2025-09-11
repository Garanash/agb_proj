"""
API v1 - Общие исключения и обработка ошибок
"""

from fastapi import HTTPException, status
from typing import Any, Dict, Optional
from pydantic import BaseModel


class APIException(HTTPException):
    """Базовое исключение API"""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.data = data


class ValidationError(APIException):
    """Ошибка валидации данных"""
    
    def __init__(self, detail: str, field: Optional[str] = None):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_ERROR",
            data={"field": field} if field else None
        )


class AuthenticationError(APIException):
    """Ошибка аутентификации"""
    
    def __init__(self, detail: str = "Требуется авторизация"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTHENTICATION_ERROR"
        )


class AuthorizationError(APIException):
    """Ошибка авторизации"""
    
    def __init__(self, detail: str = "Недостаточно прав доступа"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="AUTHORIZATION_ERROR"
        )


class NotFoundError(APIException):
    """Ошибка - ресурс не найден"""
    
    def __init__(self, resource: str = "Ресурс"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} не найден",
            error_code="NOT_FOUND"
        )


class ConflictError(APIException):
    """Ошибка конфликта данных"""
    
    def __init__(self, detail: str = "Конфликт данных"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="CONFLICT"
        )


class RateLimitError(APIException):
    """Ошибка превышения лимита запросов"""
    
    def __init__(self, retry_after: int = 60):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Слишком много запросов",
            error_code="RATE_LIMIT_EXCEEDED",
            data={"retry_after": retry_after}
        )


class ServerError(APIException):
    """Внутренняя ошибка сервера"""
    
    def __init__(self, detail: str = "Внутренняя ошибка сервера"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="SERVER_ERROR"
        )


class ErrorResponse(BaseModel):
    """Стандартный формат ответа с ошибкой"""
    success: bool = False
    error: str
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: str


def create_error_response(
    error: Exception,
    timestamp: str
) -> ErrorResponse:
    """Создает стандартный ответ с ошибкой"""
    
    if isinstance(error, APIException):
        return ErrorResponse(
            success=False,
            error=error.detail,
            error_code=error.error_code,
            details=error.data,
            timestamp=timestamp
        )
    
    return ErrorResponse(
        success=False,
        error=str(error),
        error_code="UNKNOWN_ERROR",
        timestamp=timestamp
    )
