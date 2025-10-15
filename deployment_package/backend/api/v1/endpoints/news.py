from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional

from database import get_db
from models import News, User, UserRole
from ..schemas import News as NewsSchema, NewsCreate, NewsUpdate
from ..dependencies import get_current_user_optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

router = APIRouter()


def check_admin_or_manager(current_user: User):
    """Проверка прав администратора или менеджера"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав для выполнения этой операции"
        )


@router.get("/raw")
def get_raw_news(db: Session = Depends(get_db)):
    """Получение новостей через raw SQL"""
    try:
        result = db.execute(text("SELECT id, title, content, category, is_published, created_at FROM news LIMIT 5")).fetchall()
        
        news_list = []
        for row in result:
            news_dict = {
                "id": row[0],
                "title": row[1],
                "content": row[2],
                "category": row[3],
                "is_published": row[4],
                "created_at": row[5].isoformat() if row[5] else None
            }
            news_list.append(news_dict)
        
        return news_list
    except Exception as e:
        return {"error": str(e)}


@router.get("/users-structure")
def get_users_structure(db: Session = Depends(get_db)):
    """Получение структуры таблицы users"""
    try:
        result = db.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            ORDER BY ordinal_position
        """)).fetchall()
        
        columns = []
        for row in result:
            columns.append({
                "name": row[0],
                "type": row[1],
                "nullable": row[2]
            })
        
        return {"columns": columns}
    except Exception as e:
        return {"error": str(e)}


@router.get("/users-count")
def count_users(db: Session = Depends(get_db)):
    """Подсчет пользователей в базе"""
    try:
        count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
        return {"count": count}
    except Exception as e:
        return {"error": str(e)}


@router.get("/count")
def count_news(db: Session = Depends(get_db)):
    """Подсчет новостей в базе"""
    try:
        count = db.execute(text("SELECT COUNT(*) FROM news")).scalar()
        return {"count": count}
    except Exception as e:
        return {"error": str(e)}


@router.get("/tables")
def check_tables(db: Session = Depends(get_db)):
    """Проверка существующих таблиц"""
    try:
        # Получаем список таблиц
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)).fetchall()
        
        tables = [row[0] for row in result]
        return {"tables": tables}
    except Exception as e:
        return {"error": str(e)}


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Проверка здоровья endpoint"""
    try:
        # Простая проверка подключения к базе
        result = db.execute(text("SELECT 1")).scalar()
        return {"status": "ok", "database": "connected", "result": result}
    except Exception as e:
        return {"status": "error", "database": "disconnected", "error": str(e)}


@router.get("/test", response_model=List[NewsSchema])
def test_news(db: Session = Depends(get_db)):
    """Тестовый endpoint для проверки новостей без авторизации"""
    try:
        news = db.query(News).limit(5).all()
        
        news_list = []
        for item in news:
            news_dict = {
                "id": item.id,
                "title": item.title,
                "content": item.content,
                "category": item.category,
                "is_published": item.is_published,
                "created_at": item.created_at.isoformat() if item.created_at else None
            }
            news_list.append(news_dict)
        
        return news_list
    except Exception as e:
        print(f"Ошибка в test_news: {e}")
        return []


@router.get("/list", response_model=List[NewsSchema])
def get_news(
    skip: int = 0,
    limit: int = 10,
    category: Optional[str] = None,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Получение списка новостей"""
    try:
        # Используем raw SQL для получения новостей
        query = "SELECT id, title, content, category, author_id, is_published, created_at FROM news"
        params = {}
        
        if category:
            query += " WHERE category = :category"
            params['category'] = category
        
        query += " ORDER BY created_at DESC LIMIT :limit OFFSET :skip"
        params['limit'] = limit
        params['skip'] = skip
        
        result = db.execute(text(query), params).fetchall()
        
        news_list = []
        for row in result:
            news_dict = {
                "id": row[0],
                "title": row[1],
                "content": row[2],
                "category": row[3],
                "author_id": row[4],
                "is_published": row[5],
                "created_at": row[6].isoformat() if row[6] else None
            }
            news_list.append(news_dict)
        
        return news_list
    except Exception as e:
        print(f"Ошибка в get_news: {e}")
        return []


@router.get("/", response_model=List[NewsSchema])
def get_news_root(
    skip: int = 0,
    limit: int = 10,
    category: Optional[str] = None,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Получение списка новостей (корневой endpoint)"""
    return get_news(skip, limit, category, token, db)


@router.get("/{news_id}", response_model=NewsSchema)
def get_news_by_id(
    news_id: int,
    db: Session = Depends(get_db)
):
    """Получение новости по ID"""
    news = db.query(News).filter(News.id == news_id).first()
    
    if not news:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Новость не найдена"
        )
    
    return NewsSchema(
        id=news.id,
        title=news.title,
        content=news.content,
        category=news.category,
        is_published=news.is_published,
        created_at=news.created_at.isoformat() if news.created_at else None,
        updated_at=news.updated_at.isoformat() if news.updated_at else None
    )


@router.post("/", response_model=NewsSchema)
def create_news(
    news_data: NewsCreate,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Создание новой новости"""
    try:
        # Проверяем права доступа
        if not current_user:
            raise HTTPException(status_code=401, detail="Требуется аутентификация")
        
        check_admin_or_manager(current_user)
        
        # Создаем новую новость
        news = News(
            title=news_data.title,
            content=news_data.content,
            category=news_data.category,
            is_published=news_data.is_published,
            author_id=current_user.id
        )
        
        db.add(news)
        db.commit()
        db.refresh(news)
        
        return news
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при создании новости: {str(e)}")


@router.put("/{news_id}", response_model=NewsSchema)
def update_news(
    news_id: int,
    news_data: NewsUpdate,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Обновление новости"""
    try:
        # Проверяем права доступа
        if not current_user:
            raise HTTPException(status_code=401, detail="Требуется аутентификация")
        
        check_admin_or_manager(current_user)
        
        # Находим новость
        news = db.query(News).filter(News.id == news_id).first()
        if not news:
            raise HTTPException(status_code=404, detail="Новость не найдена")
        
        # Обновляем поля
        if news_data.title is not None:
            news.title = news_data.title
        if news_data.content is not None:
            news.content = news_data.content
        if news_data.category is not None:
            news.category = news_data.category
        if news_data.is_published is not None:
            news.is_published = news_data.is_published
        
        db.commit()
        db.refresh(news)
        
        return news
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении новости: {str(e)}")


@router.delete("/{news_id}")
def delete_news(
    news_id: int,
    current_user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Удаление новости"""
    try:
        # Проверяем права доступа
        if not current_user:
            raise HTTPException(status_code=401, detail="Требуется аутентификация")
        
        check_admin_or_manager(current_user)
        
        # Находим новость
        news = db.query(News).filter(News.id == news_id).first()
        if not news:
            raise HTTPException(status_code=404, detail="Новость не найдена")
        
        db.delete(news)
        db.commit()
        
        return {"message": "Новость успешно удалена"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении новости: {str(e)}")