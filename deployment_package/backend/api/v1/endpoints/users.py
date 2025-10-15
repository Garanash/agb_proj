from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.context import CryptContext
from typing import List

from database import get_db
from models import User
from ..schemas import UserResponse as UserSchema, UserCreate, UserUpdate, PasswordReset, AdminPasswordReset
from ..dependencies import get_current_user

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

@router.get("/list")
def read_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка всех активных пользователей (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Используем обычный SQLAlchemy запрос
        users = db.query(User).filter(User.is_active == True).all()
        
        # Преобразуем в список словарей для правильной сериализации
        users_list = []
        for user in users:
            user_dict = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "middle_name": user.middle_name,
                "role": user.role,
                "is_active": user.is_active,
                "is_password_changed": user.is_password_changed,
                "phone": user.phone,
                "department_id": user.department_id,
                "position": user.position,
                "avatar_url": user.avatar_url,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None
            }
            users_list.append(user_dict)
        
        return users_list
    except Exception as e:
        print(f"❌ Ошибка при получении пользователей: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")

@router.get("/deactivated/", response_model=List[UserSchema])
def read_deactivated_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка деактивированных пользователей (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Используем raw SQL для получения деактивированных пользователей
        query = """
            SELECT id, username, email, first_name, last_name, middle_name, role, is_active, 
                   avatar_url, phone, department_id, position, created_at, updated_at, is_password_changed
            FROM users 
            WHERE is_active = false 
            ORDER BY created_at DESC
        """
        
        result = db.execute(text(query)).fetchall()
        
        users_list = []
        for row in result:
            user_dict = {
                "id": row[0],
                "username": row[1],
                "email": row[2],
                "first_name": row[3],
                "last_name": row[4],
                "middle_name": row[5],
                "role": row[6],
                "is_active": row[7],
                "avatar_url": row[8],
                "phone": row[9],
                "department_id": row[10],
                "position": row[11],
                "created_at": row[12].isoformat() if row[12] else None,
                "updated_at": row[13].isoformat() if row[13] else None,
                "is_password_changed": row[14]
            }
            users_list.append(user_dict)
        
        return users_list
    except Exception as e:
        print(f"Ошибка в read_deactivated_users: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при получении деактивированных пользователей: {str(e)}")

@router.get("/chat-users", response_model=List[UserSchema])
def read_chat_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка всех активных пользователей для чата"""
    try:
        # Используем raw SQL для получения пользователей для чата
        query = """
            SELECT id, username, email, first_name, last_name, middle_name, role, is_active, 
                   avatar_url, phone, department_id, position, created_at, updated_at, is_password_changed
            FROM users 
            WHERE is_active = true 
            ORDER BY first_name, last_name
        """
        
        result = db.execute(text(query)).fetchall()
        
        users_list = []
        for row in result:
            user_dict = {
                "id": row[0],
                "username": row[1],
                "email": row[2],
                "first_name": row[3],
                "last_name": row[4],
                "middle_name": row[5],
                "role": row[6],
                "is_active": row[7],
                "avatar_url": row[8],
                "phone": row[9],
                "department_id": row[10],
                "position": row[11],
                "created_at": row[12].isoformat() if row[12] else None,
                "updated_at": row[13].isoformat() if row[13] else None,
                "is_password_changed": row[14]
            }
            users_list.append(user_dict)
        
        return users_list
    except Exception as e:
        print(f"Ошибка в read_chat_users: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при получении пользователей для чата: {str(e)}")

@router.post("/", response_model=UserSchema)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового пользователя (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Проверяем, не существует ли уже пользователь с таким username или email
        existing_user = db.query(User).filter(
            (User.username == user_data.username) | (User.email == user_data.email)
        ).first()
        
        if existing_user:
            if existing_user.username == user_data.username:
                raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")
            else:
                raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
        
        # Создаем нового пользователя
        hashed_password = get_password_hash(user_data.password)
        
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            middle_name=user_data.middle_name,
            role=user_data.role,
            is_active=user_data.is_active,
            phone=user_data.phone,
            department_id=user_data.department_id,
            position=user_data.position,
            avatar_url=getattr(user_data, 'avatar_url', None)
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        return {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "first_name": new_user.first_name,
            "last_name": new_user.last_name,
            "middle_name": new_user.middle_name,
            "role": new_user.role,
            "is_active": new_user.is_active,
            "is_password_changed": new_user.is_password_changed,
            "phone": new_user.phone,
            "department_id": new_user.department_id,
            "position": new_user.position,
            "avatar_url": new_user.avatar_url,
            "created_at": new_user.created_at.isoformat() if new_user.created_at else None,
            "updated_at": new_user.updated_at.isoformat() if new_user.updated_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Ошибка при создании пользователя: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")

@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление пользователя (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        # Обновляем поля
        if user_data.first_name is not None:
            user.first_name = user_data.first_name
        if user_data.last_name is not None:
            user.last_name = user_data.last_name
        if user_data.middle_name is not None:
            user.middle_name = user_data.middle_name
        if user_data.email is not None:
            user.email = user_data.email
        if user_data.role is not None:
            user.role = user_data.role
        if user_data.is_active is not None:
            user.is_active = user_data.is_active
        if user_data.phone is not None:
            user.phone = user_data.phone
        if user_data.department_id is not None:
            user.department_id = user_data.department_id
        if user_data.position is not None:
            user.position = user_data.position
        if user_data.avatar_url is not None:
            user.avatar_url = user_data.avatar_url
        
        db.commit()
        db.refresh(user)
        
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "middle_name": user.middle_name,
            "role": user.role,
            "is_active": user.is_active,
            "is_password_changed": user.is_password_changed,
            "phone": user.phone,
            "department_id": user.department_id,
            "position": user.position,
            "avatar_url": user.avatar_url,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Ошибка при обновлении пользователя: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление пользователя (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        # Не удаляем администратора
        if user.role == "admin":
            raise HTTPException(status_code=400, detail="Нельзя удалить администратора")
        
        # Мягкое удаление - деактивируем пользователя
        user.is_active = False
        db.commit()
        
        return {"message": "Пользователь успешно деактивирован"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Ошибка при удалении пользователя: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Внутренняя ошибка сервера")