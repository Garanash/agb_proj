from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import List, Optional

from database import get_db
from models import News, User, UserRole
from schemas import News as NewsSchema, NewsCreate, NewsUpdate
from routers.auth import get_current_user, get_current_user_optional

router = APIRouter()


def check_admin_or_manager(current_user: User):
    """Проверка прав администратора или менеджера"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения этой операции"
        )


@router.get("/list", response_model=List[NewsSchema])
async def get_news(
    request: Request,
    skip: int = 0,
    limit: int = 10,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Получение списка новостей"""
    # Админы и менеджеры видят все новости, обычные пользователи только опубликованные
    current_user = await get_current_user_optional(request, db)

    if current_user and current_user.role in [UserRole.ADMIN, UserRole.MANAGER]:
        query = select(News).order_by(desc(News.created_at))
    else:
        query = select(News).where(News.is_published == True).order_by(desc(News.created_at))

    if category:
        query = query.where(News.category == category)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    news = result.scalars().all()

    return news


# Редирект роуты для совместимости с frontend
@router.get("/", response_model=List[NewsSchema])
async def get_news_root(
    request: Request,
    skip: int = 0,
    limit: int = 10,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Получение списка новостей с query параметрами"""
    return await get_news(request, skip, limit, category, db)


@router.get("", response_model=List[NewsSchema])
async def get_news_no_slash(
    request: Request,
    skip: int = 0,
    limit: int = 10,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Получение списка новостей без trailing slash для совместимости"""
    return await get_news(request, skip, limit, category, db)


@router.get("/my/", response_model=List[NewsSchema])
async def get_my_news_slash(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Редирект на /my для совместимости с trailing slash"""
    return await get_my_news(skip, limit, current_user, db)


# POST роуты для совместимости с frontend
@router.post("/", response_model=NewsSchema, status_code=status.HTTP_201_CREATED)
async def create_news_root(
    news_data: NewsCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Редирект на /create для совместимости с frontend POST /api/news/"""
    return await create_news(news_data, current_user, db)


@router.get("/{news_id}", response_model=NewsSchema)
async def get_news_item(news_id: int, db: AsyncSession = Depends(get_db)):
    """Получение конкретной новости"""
    result = await db.execute(select(News).where(News.id == news_id, News.is_published == True))
    news = result.scalar_one_or_none()
    
    if not news:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    
    return news


@router.post("/create", response_model=NewsSchema, status_code=status.HTTP_201_CREATED)
async def create_news(
    news_data: NewsCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание новости (только для администраторов и менеджеров)"""
    check_admin_or_manager(current_user)
    
    news = News(
        title=news_data.title,
        content=news_data.content,
        category=news_data.category,
        author_id=current_user.id,
        author_name=f"{current_user.last_name} {current_user.first_name}",
        is_published=news_data.is_published
    )
    
    db.add(news)
    await db.commit()
    await db.refresh(news)
    
    return news


@router.put("/{news_id}", response_model=NewsSchema)
async def update_news(
    news_id: int,
    news_data: NewsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление новости"""
    result = await db.execute(select(News).where(News.id == news_id))
    news = result.scalar_one_or_none()
    
    if not news:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    
    # Проверяем права: автор может редактировать свои новости, админы и менеджеры - любые
    if news.author_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для редактирования этой новости"
        )
    
    # Обновляем поля
    update_data = news_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(news, field, value)
    
    await db.commit()
    await db.refresh(news)
    
    return news


@router.delete("/{news_id}")
async def delete_news(
    news_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Удаление новости"""
    result = await db.execute(select(News).where(News.id == news_id))
    news = result.scalar_one_or_none()
    
    if not news:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    
    # Проверяем права: автор может удалять свои новости, админы и менеджеры - любые
    if news.author_id != current_user.id and current_user.role not in [UserRole.admin, UserRole.manager]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для удаления этой новости"
        )
    
    await db.delete(news)
    await db.commit()
    
    return {"message": "Новость успешно удалена"}


@router.get("/my/", response_model=List[NewsSchema])
async def get_my_news(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение новостей текущего пользователя"""
    result = await db.execute(
        select(News)
        .where(News.author_id == current_user.id)
        .order_by(desc(News.created_at))
        .offset(skip)
        .limit(limit)
    )
    news = result.scalars().all()
    
    return news
