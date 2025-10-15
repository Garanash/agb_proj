"""
API v1 - Middleware и общие обработчики
"""

from fastapi import Request, Response, HTTPException
from fastapi.middleware.base import BaseHTTPMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import time
import logging
from typing import Callable, Dict, Any
from datetime import datetime, timezone
import json

from .shared.constants import RateLimit, Security, Logging
from .shared.exceptions import RateLimitError, ServerError, create_error_response
from .shared.utils import get_current_timestamp, mask_sensitive_data

# Настройка логирования
logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware для логирования запросов с улучшенной функциональностью"""
    
    def __init__(self, app, log_body: bool = False):
        super().__init__(app)
        self.log_body = log_body
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        request_id = generate_request_id()
        
        # Добавляем ID запроса в заголовки
        request.state.request_id = request_id
        
        # Логируем входящий запрос
        log_data = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "client_ip": request.client.host,
            "user_agent": request.headers.get("user-agent", ""),
            "timestamp": get_current_timestamp()
        }
        
        if self.log_body and request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    log_data["body"] = json.loads(body.decode())
            except (json.JSONDecodeError, UnicodeDecodeError):
                log_data["body"] = "Не удалось декодировать тело запроса"
        
        logger.info(f"🔄 {request.method} {request.url.path} - {request.client.host} - ID: {request_id}")
        
        # Обрабатываем запрос
        try:
            response = await call_next(request)
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"❌ {request.method} {request.url.path} - Ошибка за {process_time:.3f}s - ID: {request_id} - {str(e)}")
            raise
        
        # Вычисляем время обработки
        process_time = time.time() - start_time
        
        # Логируем результат
        status_emoji = "✅" if response.status_code < 400 else "⚠️" if response.status_code < 500 else "❌"
        logger.info(f"{status_emoji} {request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s - ID: {request_id}")
        
        # Добавляем заголовки
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id
        
        return response


def generate_request_id() -> str:
    """Генерирует уникальный ID для запроса"""
    import uuid
    return str(uuid.uuid4())[:8]


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware для добавления заголовков безопасности"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Добавляем заголовки безопасности
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Улучшенный middleware для ограничения частоты запросов"""
    
    def __init__(self, app, calls: int = 100, period: int = 60, burst_calls: int = 200):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.burst_calls = burst_calls
        self.clients = {}
        self.blocked_clients = {}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host
        current_time = time.time()
        
        # Проверяем, не заблокирован ли клиент
        if client_ip in self.blocked_clients:
            if current_time < self.blocked_clients[client_ip]:
                remaining_time = int(self.blocked_clients[client_ip] - current_time)
                return JSONResponse(
                    status_code=429,
                    content={
                        "success": False,
                        "error": "IP адрес временно заблокирован",
                        "error_code": "RATE_LIMIT_BLOCKED",
                        "retry_after": remaining_time,
                        "details": {
                            "reason": "Превышен лимит запросов",
                            "unblock_at": datetime.fromtimestamp(self.blocked_clients[client_ip]).isoformat()
                        }
                    }
                )
            else:
                # Разблокируем клиента
                del self.blocked_clients[client_ip]
        
        # Очищаем старые записи
        if client_ip in self.clients:
            self.clients[client_ip] = [
                timestamp for timestamp in self.clients[client_ip]
                if current_time - timestamp < self.period
            ]
        else:
            self.clients[client_ip] = []
        
        # Проверяем лимит
        current_calls = len(self.clients[client_ip])
        
        if current_calls >= self.calls:
            # Блокируем клиента на 5 минут при превышении лимита
            self.blocked_clients[client_ip] = current_time + 300  # 5 минут
            
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": "Слишком много запросов",
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "retry_after": 300,
                    "details": {
                        "current_calls": current_calls,
                        "limit": self.calls,
                        "period": self.period,
                        "blocked_until": datetime.fromtimestamp(current_time + 300).isoformat()
                    }
                }
            )
        
        # Добавляем текущий запрос
        self.clients[client_ip].append(current_time)
        
        # Добавляем заголовки с информацией о лимитах
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.calls)
        response.headers["X-RateLimit-Remaining"] = str(self.calls - current_calls - 1)
        response.headers["X-RateLimit-Reset"] = str(int(current_time + self.period))
        
        return response


class APIVersionMiddleware(BaseHTTPMiddleware):
    """Middleware для добавления информации о версии API"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Добавляем заголовки версии API
        response.headers["X-API-Version"] = "1.0.0"
        response.headers["X-API-Status"] = "active"
        
        return response


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Middleware для централизованной обработки ошибок"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content=create_error_response(e, get_current_timestamp()).dict()
            )
        except RequestValidationError as e:
            return JSONResponse(
                status_code=422,
                content=create_error_response(
                    HTTPException(status_code=422, detail="Ошибка валидации данных"),
                    get_current_timestamp()
                ).dict()
            )
        except Exception as e:
            logger.error(f"Необработанная ошибка: {str(e)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content=create_error_response(
                    ServerError("Внутренняя ошибка сервера"),
                    get_current_timestamp()
                ).dict()
            )


class RequestSizeMiddleware(BaseHTTPMiddleware):
    """Middleware для ограничения размера запроса"""
    
    def __init__(self, app, max_size: int = 10 * 1024 * 1024):  # 10MB по умолчанию
        super().__init__(app)
        self.max_size = max_size
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        content_length = request.headers.get("content-length")
        
        if content_length and int(content_length) > self.max_size:
            return JSONResponse(
                status_code=413,
                content=create_error_response(
                    HTTPException(
                        status_code=413,
                        detail=f"Размер запроса превышает максимально допустимый ({self.max_size // (1024*1024)}MB)"
                    ),
                    get_current_timestamp()
                ).dict()
            )
        
        return await call_next(request)


class CORSMiddleware(BaseHTTPMiddleware):
    """Улучшенный CORS middleware"""
    
    def __init__(
        self,
        app,
        allow_origins: list = None,
        allow_methods: list = None,
        allow_headers: list = None,
        allow_credentials: bool = True
    ):
        super().__init__(app)
        self.allow_origins = allow_origins or ["*"]
        self.allow_methods = allow_methods or ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
        self.allow_headers = allow_headers or ["*"]
        self.allow_credentials = allow_credentials
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # Добавляем CORS заголовки
        origin = request.headers.get("origin")
        if origin in self.allow_origins or "*" in self.allow_origins:
            response.headers["Access-Control-Allow-Origin"] = origin if origin else "*"
        
        response.headers["Access-Control-Allow-Methods"] = ", ".join(self.allow_methods)
        response.headers["Access-Control-Allow-Headers"] = ", ".join(self.allow_headers)
        response.headers["Access-Control-Allow-Credentials"] = str(self.allow_credentials).lower()
        response.headers["Access-Control-Max-Age"] = "86400"  # 24 часа
        
        return response


class CacheMiddleware(BaseHTTPMiddleware):
    """Middleware для кэширования ответов"""
    
    def __init__(self, app, default_ttl: int = 300):
        super().__init__(app)
        self.default_ttl = default_ttl
        self.cache = {}
        self.cache_timestamps = {}
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Кэшируем только GET запросы
        if request.method != "GET":
            return await call_next(request)
        
        # Создаем ключ кэша
        cache_key = f"{request.url.path}?{request.query_params}"
        current_time = time.time()
        
        # Проверяем кэш
        if cache_key in self.cache:
            cache_time = self.cache_timestamps.get(cache_key, 0)
            if current_time - cache_time < self.default_ttl:
                # Возвращаем кэшированный ответ
                cached_response = self.cache[cache_key]
                cached_response.headers["X-Cache"] = "HIT"
                cached_response.headers["X-Cache-TTL"] = str(int(self.default_ttl - (current_time - cache_time)))
                return cached_response
        
        # Выполняем запрос
        response = await call_next(request)
        
        # Кэшируем успешные ответы
        if response.status_code == 200:
            # Создаем копию ответа для кэширования
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk
            
            # Создаем новый ответ
            from fastapi.responses import Response as FastAPIResponse
            cached_response = FastAPIResponse(
                content=response_body,
                status_code=response.status_code,
                headers=dict(response.headers)
            )
            
            # Сохраняем в кэш
            self.cache[cache_key] = cached_response
            self.cache_timestamps[cache_key] = current_time
            
            # Добавляем заголовки кэша
            cached_response.headers["X-Cache"] = "MISS"
            cached_response.headers["X-Cache-TTL"] = str(self.default_ttl)
            
            return cached_response
        
        return response


class MetricsMiddleware(BaseHTTPMiddleware):
    """Middleware для сбора метрик"""
    
    def __init__(self, app):
        super().__init__(app)
        self.metrics = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "response_times": [],
            "endpoints": {},
            "status_codes": {},
            "start_time": time.time()
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Обновляем метрики
        self.metrics["total_requests"] += 1
        
        # Отслеживаем эндпоинты
        endpoint = f"{request.method} {request.url.path}"
        if endpoint not in self.metrics["endpoints"]:
            self.metrics["endpoints"][endpoint] = 0
        self.metrics["endpoints"][endpoint] += 1
        
        try:
            response = await call_next(request)
            
            # Обновляем метрики успешных запросов
            if 200 <= response.status_code < 400:
                self.metrics["successful_requests"] += 1
            else:
                self.metrics["failed_requests"] += 1
            
            # Обновляем статус коды
            status_code = str(response.status_code)
            if status_code not in self.metrics["status_codes"]:
                self.metrics["status_codes"][status_code] = 0
            self.metrics["status_codes"][status_code] += 1
            
            # Добавляем время ответа
            response_time = time.time() - start_time
            self.metrics["response_times"].append(response_time)
            
            # Ограничиваем размер массива времен ответа
            if len(self.metrics["response_times"]) > 1000:
                self.metrics["response_times"] = self.metrics["response_times"][-1000:]
            
            # Добавляем заголовки с метриками
            response.headers["X-Response-Time"] = f"{response_time:.3f}s"
            response.headers["X-Request-ID"] = getattr(request.state, 'request_id', 'unknown')
            
            return response
            
        except Exception as e:
            self.metrics["failed_requests"] += 1
            raise e
    
    def get_metrics(self):
        """Получить собранные метрики"""
        current_time = time.time()
        uptime = current_time - self.metrics["start_time"]
        
        # Вычисляем среднее время ответа
        avg_response_time = 0
        if self.metrics["response_times"]:
            avg_response_time = sum(self.metrics["response_times"]) / len(self.metrics["response_times"])
        
        return {
            "uptime_seconds": uptime,
            "total_requests": self.metrics["total_requests"],
            "successful_requests": self.metrics["successful_requests"],
            "failed_requests": self.metrics["failed_requests"],
            "success_rate": self.metrics["successful_requests"] / max(self.metrics["total_requests"], 1) * 100,
            "average_response_time": avg_response_time,
            "requests_per_second": self.metrics["total_requests"] / max(uptime, 1),
            "endpoints": self.metrics["endpoints"],
            "status_codes": self.metrics["status_codes"],
            "timestamp": datetime.fromtimestamp(current_time).isoformat()
        }
