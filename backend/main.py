from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
from routers import users, auth, news, events, departments, company_employees, roles, team, chat, ved_passports


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
    lifespan=lifespan
)

# CORS настройки
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутеров
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(news.router, prefix="/api/news", tags=["news"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(departments.router, prefix="/api/departments", tags=["departments"])
app.include_router(company_employees.router, prefix="/api/company-employees", tags=["company_employees"])
app.include_router(roles.router, prefix="/api/roles", tags=["roles"])
app.include_router(team.router, prefix="/api/team", tags=["team"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(ved_passports.router, prefix="/api/ved-passports", tags=["ved_passports"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Felix Backend"}


@app.get("/")
async def root():
    return {"message": "Felix - Алмазгеобур Platform API"}
