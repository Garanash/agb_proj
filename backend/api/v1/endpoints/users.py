from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from typing import List

from database import get_db
from models import User
from ..schemas import UserResponse as UserSchema, UserCreate, UserUpdate, PasswordReset, AdminPasswordReset
from .auth import get_current_user


def transliterate(text: str) -> str:
    """Простая транслитерация русского текста в латиницу"""
    translit_dict = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
        'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
        'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
        'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
        'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    }

    result = []
    for char in text:
        result.append(translit_dict.get(char, char))
    return ''.join(result)

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


@router.get("/list", response_model=List[UserSchema])
async def read_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка всех активных пользователей (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(User).where(User.is_active == True))
    users = result.scalars().all()
    
    # Сериализуем пользователей
    users_list = []
    for user in users:
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
        users_list.append(user_dict)
    
    return users_list


@router.get("/chat-users", response_model=List[UserSchema])
async def read_chat_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка всех активных пользователей для чата"""
    result = await db.execute(select(User).where(User.is_active == True))
    users = result.scalars().all()
    
    # Сериализуем пользователей
    users_list = []
    for user in users:
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
        users_list.append(user_dict)
    
    return users_list


@router.get("/deactivated", response_model=List[UserSchema])
async def read_deactivated_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка всех деактивированных пользователей (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")

    result = await db.execute(select(User).where(User.is_active == False))
    users = result.scalars().all()
    
    # Сериализуем пользователей
    users_list = []
    for user in users:
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
        users_list.append(user_dict)
    
    return users_list


# Редирект роуты для совместимости с frontend
@router.get("/", response_model=List[UserSchema])
async def read_users_root(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Редирект на /list для совместимости"""
    return await read_users(current_user, db)


@router.get("/deactivated/", response_model=List[UserSchema])
async def read_deactivated_users_slash(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Редирект на /deactivated для совместимости с trailing slash"""
    return await read_deactivated_users(current_user, db)


# POST роуты для совместимости с frontend
@router.post("/")
async def create_user_root(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Редирект на /create для совместимости с frontend POST /api/users/"""
    try:
        # Получаем сырые данные из запроса
        raw_data = await request.json()
        print(f"🔍 create_user_root: сырые данные: {raw_data}")
        
        # Создаем объект UserCreate вручную
        user_data = UserCreate(**raw_data)
        print(f"🔍 create_user_root: создан объект UserCreate: {user_data}")
        
        return await create_user(user_data, current_user, db)
    except Exception as e:
        print(f"❌ Ошибка в create_user_root: {e}")
        print(f"❌ Тип ошибки: {type(e)}")
        print(f"❌ Детали ошибки: {str(e)}")
        if "validation error" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Ошибка валидации данных: {str(e)}")
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Внутренняя ошибка сервера: {str(e)}")


@router.post("/create")
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Создание нового пользователя (только для администраторов)"""
    try:
        print(f"🔍 Получены данные для создания пользователя: {user_data}")
        print(f"🔍 Тип данных: {type(user_data)}")
        print(f"🔍 Словарь данных: {user_data.model_dump() if hasattr(user_data, 'model_dump') else user_data.__dict__}")
        print(f"🔍 Поле password: {getattr(user_data, 'password', 'НЕТ')}")
        print(f"🔍 Поле password равно None: {getattr(user_data, 'password', 'НЕТ') is None}")
        print(f"🔍 Поле password равно пустой строке: {getattr(user_data, 'password', 'НЕТ') == ''}")
    except Exception as e:
        print(f"❌ Ошибка при логировании данных: {e}")
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    # Генерируем username если не указан
    if user_data.username:
        username = user_data.username
    else:
        # Формируем username: первые буквы имени и отчества + . + фамилия (на латинице)
        first_initial = transliterate(user_data.first_name[0].upper()) if user_data.first_name else ""
        middle_initial = transliterate(user_data.middle_name[0].upper()) if user_data.middle_name else ""
        last_name_translit = transliterate(user_data.last_name).lower() if user_data.last_name else ""

        if middle_initial:
            username = f"{first_initial}{middle_initial}.{last_name_translit}"
        else:
            username = f"{first_initial}.{last_name_translit}"
    
    # Проверяем, не существует ли уже пользователь с таким username или email
    result = await db.execute(
        select(User).where((User.username == username) | (User.email == user_data.email))
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        if existing_user.username == username:
            raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")
        else:
            raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    
    # Генерируем пароль если не указан
    password = user_data.password
    print(f"🔍 Пароль из данных: {password}")
    if not password:
        from utils.password_generator import generate_secure_password
        password = generate_secure_password(12)
        print(f"🔍 Сгенерированный пароль: {password}")
    
    # Создаем нового пользователя
    hashed_password = get_password_hash(password)
    db_user = User(
        username=username,
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        middle_name=user_data.middle_name,
        hashed_password=hashed_password,
        role=user_data.role,
        phone=user_data.phone,
        department_id=user_data.department_id,
        position=user_data.position,
        is_password_changed=False  # Пароль не был изменен пользователем
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    # Возвращаем пользователя с сгенерированным паролем для отображения админу
    user_dict = {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "first_name": db_user.first_name,
        "last_name": db_user.last_name,
        "middle_name": db_user.middle_name,
        "full_name": db_user.full_name,
        "role": db_user.role.value if hasattr(db_user.role, 'value') else str(db_user.role),
        "is_active": db_user.is_active,
        "is_password_changed": db_user.is_password_changed,
        "phone": db_user.phone,
        "department_id": db_user.department_id,
        "position": db_user.position,
        "avatar_url": db_user.avatar_url,
        "created_at": db_user.created_at.isoformat(),
        "updated_at": db_user.updated_at.isoformat() if db_user.updated_at else None,
        "generated_password": password  # Временно добавляем сгенерированный пароль
    }
    
    return user_dict


@router.get("/{user_id}", response_model=UserSchema)
async def read_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение пользователя по ID (доступно для всех аутентифицированных пользователей)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    print(f"🔍 GET user {user_id}: first_name='{user.first_name}', last_name='{user.last_name}', middle_name='{user.middle_name}', position='{user.position}'")
    
    # Сериализуем пользователя (принудительно включаем все поля)
    user_dict = {
        "id": user.id,
        "username": user.username,
        "email": user.email or None,
        "first_name": user.first_name or None,
        "last_name": user.last_name or None,
        "middle_name": user.middle_name or None,
        "full_name": user.full_name or None,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "is_active": user.is_active,
        "phone": user.phone or None,
        "department_id": user.department_id or None,
        "position": user.position or None,
        "avatar_url": user.avatar_url or None,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat() if user.updated_at else None
    }
    
    print(f"🔍 Serialized user_dict: {user_dict}")
    
    return user_dict


@router.get("/admin/{user_id}", response_model=UserSchema)
async def read_user_admin(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение пользователя по ID (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Сериализуем пользователя
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
        "phone": user.phone,
        "department_id": user.department_id,
        "position": user.position,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat() if user.updated_at else None
    }
    
    return user_dict


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обновление пользователя (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Обновляем поля
    print(f"🔧 Raw user_data: {user_data}")
    print(f"🔧 user_data type: {type(user_data)}")
    
    update_data = user_data.model_dump(exclude_unset=True)
    print(f"🔧 Updating user {user_id} with data: {update_data}")
    
    if not update_data:
        print("⚠️ No data to update!")
        # Возвращаем текущие данные пользователя без изменений
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
        return user_dict
    
    for field, value in update_data.items():
        print(f"🔧 Setting {field} = {value} (type: {type(value)})")
        setattr(user, field, value)
    
    print(f"🔧 User before commit: first_name='{user.first_name}', last_name='{user.last_name}', middle_name='{user.middle_name}', position='{user.position}'")
    
    try:
        await db.commit()
        print(f"🔧 ✅ Commit successful")
    except Exception as e:
        print(f"🔧 ❌ Commit failed: {e}")
        await db.rollback()
        raise
    
    print(f"🔧 After commit, before refresh")
    
    try:
        await db.refresh(user)
        print(f"🔧 ✅ Refresh successful")
    except Exception as e:
        print(f"🔧 ❌ Refresh failed: {e}")
        raise
        
    print(f"🔧 User after commit: first_name='{user.first_name}', last_name='{user.last_name}', middle_name='{user.middle_name}', position='{user.position}'")
    
    # Сериализуем пользователя
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
        "phone": user.phone,
        "department_id": user.department_id,
        "position": user.position,
        "avatar_url": user.avatar_url,
        "created_at": user.created_at.isoformat(),
        "updated_at": user.updated_at.isoformat() if user.updated_at else None
    }
    
    return user_dict


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Деактивация пользователя (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Нельзя деактивировать самого себя")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Вместо удаления деактивируем пользователя
    user.is_active = False
    await db.commit()
    
    return {"message": "Пользователь успешно деактивирован"}


@router.post("/{user_id}/activate")
async def activate_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Активация пользователя (только для администраторов)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if user.is_active:
        raise HTTPException(status_code=400, detail="Пользователь уже активен")
    
    # Активируем пользователя
    user.is_active = True
    await db.commit()
    
    return {"message": "Пользователь успешно активирован"}


@router.post("/{user_id}/reset-password")
async def reset_user_password_admin(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Сброс пароля пользователя администратором (генерирует новый пароль)"""
    print(f"🔍 Сброс пароля для пользователя {user_id}")
    print(f"🔍 Текущий пользователь: {current_user.username}, роль: {current_user.role}")
    
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Генерируем новый пароль
    from utils.password_generator import generate_secure_password
    new_password = generate_secure_password(12)
    print(f"🔍 Сгенерированный новый пароль: {new_password}")
    
    # Обновляем пароль
    user.hashed_password = get_password_hash(new_password)
    user.is_password_changed = False  # Пользователь должен будет сменить пароль
    
    await db.commit()
    print(f"🔍 Пароль успешно обновлен для пользователя {user.username}")
    
    return {
        "message": f"Пароль пользователя {user.username} успешно сброшен",
        "generated_password": new_password
    }