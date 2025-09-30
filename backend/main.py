from fastapi import FastAPI, Request, HTTPException
from sqlalchemy import text
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from database import engine, Base
from datetime import datetime
import os
import asyncio
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Проверяем подключение к базе данных
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            print("✅ Подключение к базе данных успешно установлено")
    except Exception as e:
        print(f"❌ Ошибка подключения к базе данных: {e}")
        raise

    # Инициализируем данные если их нет
    if os.getenv("AUTO_INIT_DATA", "false").lower() == "true":
        try:
            from scripts.init_data import init_database_data
            from database import AsyncSessionLocal
            
            async def check_and_init():
                try:
                    async with AsyncSessionLocal() as db:
                        await init_database_data(db)
                    print("✅ Данные инициализированы успешно")
                except Exception as e:
                    print(f"⚠️ Ошибка инициализации данных: {e}")
            
            # Запускаем инициализацию в фоне
            asyncio.create_task(check_and_init())
        except Exception as e:
            print(f"⚠️ Ошибка запуска инициализации: {e}")

    yield

app = FastAPI(
    title="Felix - Алмазгеобур Platform",
    description="Корпоративная платформа для Алмазгеобур",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False
)

# CORS настройки для локальной разработки
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3001",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:3002",
        "http://127.0.0.1:3002"
    ],  # Разрешаем фронтенд и API
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Кэшируем CORS ответы на 1 час
    allow_origin_regex=None  # Отключаем регулярные выражения для безопасности
)

# Добавляем middleware для логирования CORS ошибок
@app.middleware("http")
async def cors_logging_middleware(request, call_next):
    # Логируем детали запроса
    origin = request.headers.get("origin")
    method = request.method
    path = request.url.path
    print(f"🔍 Request: {method} {path}")
    print(f"🌐 Origin: {origin}")
    print(f"📨 Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    # Логируем заголовки ответа
    print(f"📝 Response status: {response.status_code}")
    print(f"🔧 Response headers: {dict(response.headers)}")
    
    # Добавляем CORS заголовки если их нет
    if origin and "access-control-allow-origin" not in response.headers:
        response.headers["access-control-allow-origin"] = origin
        response.headers["access-control-allow-credentials"] = "true"
        print("⚠️ Added missing CORS headers")
    
    return response

# Подключаем роутеры v1 напрямую
from api.v1.endpoints.auth import router as auth_router
app.include_router(auth_router, prefix="/api/v1/auth", tags=["🔐 Аутентификация"])

from api.v1.endpoints.users import router as users_router
app.include_router(users_router, prefix="/api/v1/users", tags=["👥 Пользователи"])

from api.v1.endpoints.chat import router as chat_router
app.include_router(chat_router, prefix="/api/v1/chat", tags=["💬 Чат"])

from api.v1.endpoints.chat_rooms import router as chat_rooms_router
app.include_router(chat_rooms_router, prefix="/api/v1/chat", tags=["💬 Чат"])

from api.v1.endpoints.chat_unread import router as chat_unread_router
app.include_router(chat_unread_router, prefix="/api/v1/chat", tags=["💬 Чат"])

from api.v1.endpoints.chat_ws import router as chat_ws_router
app.include_router(chat_ws_router, prefix="/api/v1/chat", tags=["💬 Чат"])

from api.v1.endpoints.chat_folders import router as chat_folders_router
app.include_router(chat_folders_router, prefix="/api/v1/chat-folders", tags=["📁 Папки чата"])

from api.v1.endpoints.news import router as news_router
app.include_router(news_router, prefix="/api/v1/news", tags=["📰 Новости"])

from api.v1.endpoints.events import router as events_router
app.include_router(events_router, prefix="/api/v1/events", tags=["📅 События"])

from api.v1.endpoints.article_matching import router as article_matching_router
app.include_router(article_matching_router, prefix="/api/v1/article-matching", tags=["🔗 Сопоставление артикулов"])

# Добавляем middleware для обработки больших запросов
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])  # Для разработки, в продакшене указать конкретные хосты

# Глобальные обработчики исключений
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "type": "http_exception",
            "path": str(request.url)
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    print(f"🚨 Необработанная ошибка: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Внутренняя ошибка сервера",
            "type": "internal_error",
            "path": str(request.url)
        }
    )

# Обработчик для asyncio.TimeoutError
@app.exception_handler(asyncio.TimeoutError)
async def timeout_exception_handler(request: Request, exc: asyncio.TimeoutError):
    return JSONResponse(
        status_code=504,
        content={
            "detail": "Превышено время ожидания запроса",
            "type": "timeout_error",
            "path": str(request.url)
        }
    )

print("✅ Все основные роутеры успешно подключены!")

# Монтирование статических файлов
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/api/health")
async def health_check():
    """Проверка здоровья сервиса и базы данных (legacy endpoint)"""
    try:
        # Проверяем подключение к базе данных
        from database import AsyncSessionLocal
        from sqlalchemy import text
        
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        
        return {
            "status": "healthy", 
            "service": "Felix Backend",
            "database": "connected",
            "timestamp": datetime.now().isoformat(),
            "note": "Use /api/v1/health for versioned health check"
        }
    except Exception as e:
        return {
            "status": "unhealthy", 
            "service": "Felix Backend",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.get("/")
async def root():
    return {"message": "Felix - Алмазгеобур Platform API"}

@app.get("/api/")
async def api_root():
    """Корневой endpoint для API"""
    return {
        "message": "Felix API",
        "version": "1.0.0",
        "api_versions": {
            "v1": "/api/v1",
            "v1_info": "/api/v1/info",
            "v1_health": "/api/v1/health"
        },
        "documentation": "/docs",
        "openapi": "/openapi.json"
    }

@app.get("/api/debug/routes")
async def debug_routes():
    """Отладочный endpoint для проверки зарегистрированных маршрутов"""
    routes = []
    for route in app.routes:
        if hasattr(route, 'path'):
            routes.append({
                "path": route.path,
                "methods": route.methods if hasattr(route, 'methods') else [],
                "name": route.name if hasattr(route, 'name') else "Unknown"
            })
    return {"routes": routes, "total": len(routes)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)