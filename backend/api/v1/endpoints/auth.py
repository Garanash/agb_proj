import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Form, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext

from database import get_db
from models import User
from ..schemas import LoginRequest, LoginResponse, UserResponse as UserSchema, UserProfileUpdate, PasswordReset

router = APIRouter()

# Настройки для загрузки файлов
UPLOAD_DIR = Path("uploads")
PROFILES_DIR = UPLOAD_DIR / "profiles"

# Создаем директории если они не существуют
for dir_path in [PROFILES_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB на файл

async def save_upload_file(upload_file: UploadFile, destination_dir: Path, filename: str) -> str:
    """Сохраняет загруженный файл и возвращает путь к нему"""
    file_path = destination_dir / filename

    # Проверяем размер файла
    file_content = await upload_file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Файл слишком большой. Максимальный размер: {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    # Возвращаем указатель в начало файла
    await upload_file.seek(0)

    # Сохраняем файл
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    return str(file_path.relative_to(UPLOAD_DIR))

# Конфигурация
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 часа в минутах
ACCESS_TOKEN_EXPIRE_HOURS = ACCESS_TOKEN_EXPIRE_MINUTES // 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def verify_password(plain_password, hashed_password):
    """Проверка пароля"""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Хеширование пароля"""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    """Создание JWT токена"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_user_by_username(db: AsyncSession, username: str):
    """Получение пользователя по имени"""
    result = await db.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def authenticate_user(db: AsyncSession, username: str, password: str):
    """Аутентификация пользователя"""
    user = await get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    if not user.is_active:
        return False
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Получение текущего пользователя из токена"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await get_user_by_username(db, username)
    if user is None:
        raise credentials_exception
    
    return user


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Получение текущего пользователя из токена (опционально)"""
    try:
        # Получаем заголовок Authorization из запроса
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            return None
            
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except (JWTError, IndexError):
        return None
    
    user = await get_user_by_username(db, username)
    return user


@router.post("/login", response_model=LoginResponse)
async def login(user_credentials: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Вход в систему"""
    user = await authenticate_user(db, user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # JWT токен уже создан выше, дополнительных сессий не нужно
    
    # Формируем полную информацию о пользователе
    user_dict = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "middle_name": user.middle_name,
        "full_name": user.full_name,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "is_active": user.is_active,
        "is_password_changed": user.is_password_changed,
        "phone": user.phone,
        "department_id": user.department_id,
        "position": user.position,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat() if user.updated_at else None
    }
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=access_token_expires.total_seconds(),
        user=UserSchema(**user_dict)
    )


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """Выход из системы"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username:
            user = await get_user_by_username(db, username)
            if user:
                # JWT токены не хранятся в БД, просто возвращаем успех
                pass
    except JWTError:
        pass
    
    return {"message": "Успешный выход из системы"}


@router.get("/me", response_model=UserSchema)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Получение информации о текущем пользователе"""
    return current_user


@router.get("/verify-token")
async def verify_token(current_user: User = Depends(get_current_user)):
    """Проверка валидности токена"""
    return {"valid": True, "user_id": current_user.id, "username": current_user.username}


@router.put("/profile", response_model=UserSchema)
async def update_profile(
    # Основные поля
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    middle_name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    position: Optional[str] = Form(None),
    # Файл аватара
    avatar: Optional[UploadFile] = File(None),
    # Пользователь
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление профиля пользователя"""
    # Получаем пользователя из базы данных
    result = await db.execute(select(User).where(User.id == current_user.id))
    user = result.scalar_one()
    
    # Обновляем основные поля
    if first_name is not None:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    if middle_name is not None:
        user.middle_name = middle_name
    if email is not None:
        user.email = email
    if phone is not None:
        user.phone = phone
    if position is not None:
        user.position = position
    
    # Обрабатываем аватар
    if avatar:
        # Удаляем старый аватар если есть
        if user.avatar_url:
            old_avatar_path = UPLOAD_DIR / user.avatar_url
            if old_avatar_path.exists():
                old_avatar_path.unlink()
        
        # Сохраняем новый аватар
        filename = f"{current_user.id}_avatar_{uuid.uuid4()}_{avatar.filename}"
        avatar_path = await save_upload_file(avatar, PROFILES_DIR, filename)
        user.avatar_url = avatar_path
    
    await db.commit()
    await db.refresh(user)
    
    return user


@router.get("/me", response_model=UserSchema)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Получение информации о текущем пользователе"""
    return current_user


@router.post("/change-password")
async def change_password(
    password_data: PasswordReset,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Смена пароля пользователя"""
    print(f"🔍 Смена пароля для пользователя: {current_user.username}")
    print(f"🔍 Полученные данные: old_password='{password_data.old_password[:3]}...', new_password='{password_data.new_password[:3]}...'")
    
    # Проверяем старый пароль
    old_password_valid = verify_password(password_data.old_password, current_user.hashed_password)
    print(f"🔍 Проверка старого пароля: {old_password_valid}")
    
    if not old_password_valid:
        print(f"❌ Неверный старый пароль для пользователя {current_user.username}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный текущий пароль"
        )
    
    # Проверяем новый пароль
    from utils.password_generator import validate_password_strength
    is_valid, errors = validate_password_strength(password_data.new_password)
    print(f"🔍 Валидация нового пароля: valid={is_valid}, errors={errors}")
    
    if not is_valid:
        error_message = f"Новый пароль не соответствует требованиям: {'; '.join(errors)}"
        print(f"❌ {error_message}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Обновляем пароль
    current_user.hashed_password = get_password_hash(password_data.new_password)
    current_user.is_password_changed = True  # Отмечаем, что пароль был изменен
    
    await db.commit()
    print(f"✅ Пароль успешно изменен для пользователя {current_user.username}")
    
    return {"message": "Пароль успешно изменен"}
