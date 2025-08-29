from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Создание таблиц при запуске
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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
try:
    from routers import (
        auth_router, users_router, departments_router, company_employees_router,
        news_router, events_router, chat_router, chat_folders_router
    )
    from routers.ved_passports import router as ved_passports_router

    # Подключаем роутеры с правильными путями
    app.include_router(users_router, prefix="/api/users", tags=["users"])
    app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
    app.include_router(news_router, prefix="/api/news", tags=["news"])
    app.include_router(events_router, prefix="/api/events", tags=["events"])
    app.include_router(departments_router, prefix="/api/departments", tags=["departments"])
    app.include_router(company_employees_router, prefix="/api/company-employees", tags=["company_employees"])
    app.include_router(ved_passports_router, prefix="/api/ved-passports", tags=["ved_passports"])
    app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
    app.include_router(chat_folders_router, prefix="/api/chat/folders", tags=["chat_folders"])

    print("✅ Все основные роутеры успешно подключены!")

except Exception as e:
    print(f"❌ Ошибка при подключении основных роутеров: {e}")
    import traceback
    traceback.print_exc()

    # Если чат роутеры не загрузились, попробуем загрузить без них
    try:
        from routers import (
            auth_router, users_router, departments_router, company_employees_router,
            news_router, events_router
        )
        from routers.ved_passports import router as ved_passports_router

        app.include_router(users_router, prefix="/api/users", tags=["users"])
        app.include_router(auth_router, prefix="/api/auth", tags=["authentication"])
        app.include_router(news_router, prefix="/api/news", tags=["news"])
        app.include_router(events_router, prefix="/api/events", tags=["events"])
        app.include_router(departments_router, prefix="/api/departments", tags=["departments"])
        app.include_router(company_employees_router, prefix="/api/company-employees", tags=["company_employees"])
        app.include_router(ved_passports_router, prefix="/api/ved-passports", tags=["ved_passports"])

        print("⚠️ Основные роутеры загружены без чата")
    except Exception as e2:
        print(f"❌ Критическая ошибка загрузки роутеров: {e2}")
        import traceback
        traceback.print_exc()

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Felix Backend"}

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
            "chat_folders": "/api/chat/folders"
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
