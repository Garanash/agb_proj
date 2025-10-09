from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import List, Optional

from database import get_db
from models import News, User, UserRole
from ..schemas import News as NewsSchema, NewsCreate, NewsUpdate
from .auth import get_current_user, get_current_user_optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

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
    skip: int = 0,
    limit: int = 10,
    category: Optional[str] = None,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Получение списка новостей"""
    # Админы и менеджеры видят все новости, обычные пользователи только опубликованные
    current_user = get_current_user_optional(token, db)

    if current_user and current_user.role in [UserRole.ADMIN, UserRole.MANAGER]:
        query = db.query(News).order_by(desc(News.created_at))
    else:
        query = db.query(News).filter(News.is_published == True).order_by(desc(News.created_at))

    if category:
        query = query.filter(News.category == category)

    news = query.offset(skip).limit(limit).all()

    # Преобразуем datetime в строки для корректной сериализации
    news_list = []
    for item in news:
        news_dict = {
            "id": item.id,
            "title": item.title,
            "content": item.content,
            "category": item.category,
            "author_id": item.author_id,
            "author_name": item.author_name,
            "is_published": item.is_published,
            "created_at": item.created_at.isoformat(),
            "updated_at": item.updated_at.isoformat() if item.updated_at else None
        }
        news_list.append(news_dict)

    return news_list


# Редирект роуты для совместимости с frontend
@router.get("/", response_model=List[NewsSchema])
async def get_news_root(
    skip: int = 0,
    limit: int = 10,
    category: Optional[str] = None,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Получение списка новостей с query параметрами"""
    return await get_news(skip, limit, category, token, db)


@router.get("", response_model=List[NewsSchema])
async def get_news_no_slash(
    skip: int = 0,
    limit: int = 10,
    category: Optional[str] = None,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Получение списка новостей без trailing slash для совместимости"""
    return await get_news(skip, limit, category, token, db)


@router.get("/my/", response_model=List[NewsSchema])
async def get_my_news_slash(
    skip: int = 0,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Редирект на /my для совместимости с trailing slash"""
    return await get_my_news(skip, limit, current_user, db)


# POST роуты для совместимости с frontend
@router.post("/", response_model=NewsSchema, status_code=status.HTTP_201_CREATED)
async def create_news_root(
    news_data: NewsCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Редирект на /create для совместимости с frontend POST /api/news/"""
    return await create_news(news_data, current_user, db)


@router.get("/{news_id}", response_model=NewsSchema)
async def get_news_item(news_id: int, db: Session = Depends(get_db)):
    """Получение конкретной новости"""
    news = db.query(News).filter(News.id == news_id, News.is_published == True).first()
    
    if not news:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    
    return news


@router.post("/create", response_model=NewsSchema, status_code=status.HTTP_201_CREATED)
async def create_news(
    news_data: NewsCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
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
    db: Session = Depends(get_db)
):
    """Обновление новости"""
    news = db.query(News).filter(News.id == news_id).first()
    
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
    db: Session = Depends(get_db)
):
    """Удаление новости"""
    news = db.query(News).filter(News.id == news_id).first()
    
    if not news:
        raise HTTPException(status_code=404, detail="Новость не найдена")
    
    # Проверяем права: автор может удалять свои новости, админы и менеджеры - любые
    if news.author_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
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
    db: Session = Depends(get_db)
):
    """Получение новостей текущего пользователя"""
    news = db.query(News).filter(News.author_id == current_user.id).order_by(desc(News.created_at)).offset(skip).limit(limit).all()
    
    return news
