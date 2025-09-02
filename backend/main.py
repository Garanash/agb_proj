from fastapi import APIRouter, FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from database import engine, Base
from datetime import datetime
import os
import sys
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создаем таблицы если их нет
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Инициализируем данные если их нет
    if os.getenv("AUTO_INIT_DATA", "true").lower() == "true":
        try:
            from init_data import init_database_data
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

# CORS настройки отключены - обрабатываются в nginx
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Разрешаем все origins для production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Подключение основных роутеров
from routers import (
    auth_router, users_router, departments_router, company_employees_router,
    news_router, events_router, chat_router, chat_folders_router
)
from routers.ved_passports import router as ved_passports_router
from routers.customers import router as customers_router
from routers.contractors import router as contractors_router
from routers.repair_requests import router as repair_requests_router
from routers.telegram import router as telegram_router

# Подключаем роутеры с правильными путями
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
# Временно отключаем дополнительные роутеры
app.include_router(news_router, prefix="/api/news", tags=["news"])
app.include_router(events_router, prefix="/api/events", tags=["events"])
app.include_router(departments_router, prefix="/api/departments", tags=["departments"])
app.include_router(company_employees_router, prefix="/api/company-employees", tags=["company_employees"])
app.include_router(ved_passports_router, prefix="/api/ved-passports", tags=["ved_passports"])
# Временно отключаем chat роутеры
app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(chat_folders_router, prefix="/api/chat/folders", tags=["chat_folders"])

# Новые роутеры для заказчиков, исполнителей и заявок
app.include_router(customers_router, prefix="/api", tags=["customers"])
app.include_router(contractors_router, prefix="/api", tags=["contractors"])
app.include_router(repair_requests_router, prefix="/api", tags=["repair-requests"])
app.include_router(telegram_router, prefix="/api", tags=["telegram"])

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
    """Проверка здоровья сервиса и базы данных"""
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
            "timestamp": datetime.now().isoformat()
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
        "endpoints": {
            "users": "/api/users",
            "auth": "/api/auth",
            "news": "/api/news",
            "events": "/api/events",
            "departments": "/api/departments",
            "company_employees": "/api/company-employees",
            "ved_passports": "/api/ved-passports",
            "chat": "/api/chat",
            "chat_folders": "/api/chat/folders",
            "customers": "/api/customers",
            "contractors": "/api/contractors",
            "repair_requests": "/api/repair-requests"
        }
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
