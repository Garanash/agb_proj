from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from database import engine, Base
from datetime import datetime
import os
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создаем таблицы если их нет
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Инициализируем данные если их нет
    if os.getenv("AUTO_INIT_DATA", "true").lower() == "true":
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

# CORS настройки отключены - обрабатываются в nginx
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Разрешаем все origins для production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# Подключение версионированного API
from api.router import api_router

# Подключаем версионированный API
app.include_router(api_router, prefix="/api")

# Подключаем роутеры v1 напрямую
try:
    from api.v1.router import api_router as v1_router
    app.include_router(v1_router, prefix="/api/v1")
except ImportError:
    pass

# Подключаем роутеры v2 напрямую
try:
    from api.v2.router import api_router as v2_router
    app.include_router(v2_router, prefix="/api/v2")
except ImportError:
    pass

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
