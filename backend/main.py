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
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            print("✅ Подключение к базе данных успешно установлено")
    except Exception as e:
        print(f"❌ Ошибка подключения к базе данных: {e}")
        raise

    # Инициализируем данные если их нет
    if os.getenv("AUTO_INIT_DATA", "false").lower() == "true":
        try:
            from database import SessionLocal
            from models import User
            
            def check_and_init():
                try:
                    with SessionLocal() as db:
                        # Проверяем, есть ли уже пользователи
                        admin = db.query(User).filter(User.username == "admin").first()
                        if not admin:
                            print("⚠️ Администратор не найден. Запустите: python3 scripts/create_admin.py")
                        else:
                            print("✅ Данные уже инициализированы")
                except Exception as e:
                    print(f"⚠️ Ошибка проверки данных: {e}")
            
            # Запускаем проверку
            check_and_init()
        except Exception as e:
            print(f"⚠️ Ошибка запуска проверки: {e}")

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

# Простой тестовый endpoint для проверки работы
@app.get("/test-dashboard")
async def test_dashboard_endpoint():
    """Тестовый endpoint для проверки работы dashboard"""
    return {"message": "Dashboard test endpoint is working", "status": "ok", "timestamp": datetime.now().isoformat()}

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Разрешаем конкретные источники
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Разрешаем конкретные методы
    allow_headers=["*"],  # Разрешаем все заголовки
    expose_headers=["*"],
    max_age=3600
)

# Подключаем роутеры v1 напрямую
from api.v1.endpoints.auth import router as auth_router
app.include_router(auth_router, prefix="/api/v1/auth", tags=["🔐 Аутентификация"])

from api.v1.endpoints.users import router as users_router
app.include_router(users_router, prefix="/api/v1/users", tags=["👥 Пользователи"])

from api.v1.endpoints.departments import router as departments_router
app.include_router(departments_router, prefix="/api/v1/departments", tags=["🏢 Отделы"])

from api.v1.endpoints.company_employees import router as company_employees_router
app.include_router(company_employees_router, prefix="/api/v1/company-employees", tags=["👥 Сотрудники"])

from api.v1.endpoints.chat import router as chat_router
app.include_router(chat_router, prefix="/api/v1/chat", tags=["💬 Чат"])

from api.v1.endpoints.chat_rooms import router as chat_rooms_router
app.include_router(chat_rooms_router, prefix="/api/v1/chat", tags=["💬 Чат"])

# from api.v1.endpoints.chat_unread import router as chat_unread_router
# app.include_router(chat_unread_router, prefix="/api/v1/chat", tags=["💬 Чат"])

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

from api.v1.endpoints.dashboard import router as dashboard_router
app.include_router(dashboard_router, prefix="/api/v1", tags=["📊 Дашборд"])

from api.v1.endpoints.ved_passports_simple import router as ved_passports_router
app.include_router(ved_passports_router, prefix="/api/v1/ved-passports", tags=["📋 ВЭД паспорта"])

from api.v1.endpoints.n8n_integration import router as n8n_router
app.include_router(n8n_router, prefix="/api/v1/n8n", tags=["🔄 N8N Интеграция"])

# Подключаем API v3
from api.v3.router import api_router as v3_router
app.include_router(v3_router, prefix="/api/v3", tags=["🔍 API v3"])

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