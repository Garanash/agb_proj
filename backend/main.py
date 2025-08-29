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

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем все origins для production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение основных роутеров
try:
    from routers import users, auth, news, events, departments, company_employees, ved_passports
    # TODO: Добавить роуты чата после создания модели ChatRoomParticipant
    # from routers import chat, chat_folders

    # Подключаем роутеры с правильными путями
    app.include_router(users.router, prefix="/api/users", tags=["users"])
    app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
    app.include_router(news.router, prefix="/api/news", tags=["news"])
    app.include_router(events.router, prefix="/api/events", tags=["events"])
    app.include_router(departments.router, prefix="/api/departments", tags=["departments"])
    app.include_router(company_employees.router, prefix="/api/company-employees", tags=["company_employees"])
    app.include_router(ved_passports.router, prefix="/api/ved-passports", tags=["ved_passports"])
    # TODO: Раскомментировать после создания модели ChatRoomParticipant
    # app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
    # app.include_router(chat_folders.router, prefix="/api/chat/folders", tags=["chat_folders"])

    print("✅ Все основные роутеры успешно подключены!")
    
except Exception as e:
    print(f"❌ Ошибка при подключении основных роутеров: {e}")
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
            "ved_passports": "/api/ved-passports"
            # TODO: Добавить endpoints чата после создания модели ChatRoomParticipant
            # "chat": "/api/chat",
            # "chat_folders": "/api/chat/folders"
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
