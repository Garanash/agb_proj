#!/usr/bin/env python3
"""Упрощенная версия main.py для тестирования"""

from fastapi import FastAPI
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
    title="Felix - Test",
    description="Тестовая версия",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False
)

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("🔍 Тестирование подключения роутеров...")

try:
    print("1. Импорт роутеров...")
    from routers import users, auth, news, events, departments, company_employees
    print("   ✅ Роутеры импортированы")
    
    print("2. Подключение роутеров...")
    app.include_router(users.router, prefix="/api/users", tags=["users"])
    print("   ✅ users подключен")
    
    app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
    print("   ✅ auth подключен")
    
    app.include_router(news.router, prefix="/api/news", tags=["news"])
    print("   ✅ news подключен")
    
    app.include_router(events.router, prefix="/api/events", tags=["events"])
    print("   ✅ events подключен")
    
    app.include_router(departments.router, prefix="/api/departments", tags=["departments"])
    print("   ✅ departments подключен")
    
    app.include_router(company_employees.router, prefix="/api/company-employees", tags=["company_employees"])
    print("   ✅ company_employees подключен")
    
    print("3. Проверка зарегистрированных роутеров...")
    routes = [route.path for route in app.routes]
    print(f"   📍 Доступные маршруты: {routes}")
    
except Exception as e:
    print(f"   ❌ Ошибка: {e}")
    import traceback
    traceback.print_exc()

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Felix Test"}

@app.get("/")
async def root():
    return {"message": "Felix Test API"}

print("🎯 Тестирование завершено!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
