from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from passlib.context import CryptContext
from typing import List

from database import get_db
from models import User
from ..schemas import UserResponse as UserSchema, UserCreate, UserUpdate, PasswordReset, AdminPasswordReset
from .auth import get_current_user

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

@router.get("/list", response_model=List[UserSchema])
def read_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка всех активных пользователей (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Используем raw SQL для получения пользователей
        query = """
            SELECT id, username, email, first_name, last_name, middle_name, role, is_active, 
                   avatar_url, phone, department_id, position, created_at, updated_at, is_password_changed
            FROM users 
            WHERE is_active = true 
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
        print(f"Ошибка в read_users: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка при получении пользователей: {str(e)}")

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