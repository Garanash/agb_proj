#!/usr/bin/env python3
"""
Скрипт для инициализации системы v3
"""

import asyncio
import sys
import os

# Добавляем путь к backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import async_session, Base, engine
from api.v3.utils import RoleManager, encryption_manager
from api.v3.models import SystemSettings, EmailSettings, ApiKeySettings
from models import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def create_tables():
    """Создать таблицы v3"""
    print("Создание таблиц v3...")
    
    async with engine.begin() as conn:
        # Создаем только новые таблицы v3
        await conn.run_sync(Base.metadata.create_all)
    
    print("Таблицы созданы успешно!")


async def create_default_roles():
    """Создать роли по умолчанию"""
    print("Создание ролей по умолчанию...")
    
    async with async_session() as db:
        await RoleManager.create_default_roles(db)
    
    print("Роли созданы успешно!")


async def create_default_settings():
    """Создать настройки по умолчанию"""
    print("Создание настроек по умолчанию...")
    
    async with async_session() as db:
        # Основные настройки системы
        default_settings = [
            {
                'category': 'general',
                'key': 'app_name',
                'value': 'AGB Platform',
                'data_type': 'string',
                'is_public': True,
                'description': 'Название приложения'
            },
            {
                'category': 'general',
                'key': 'app_version',
                'value': '3.0.0',
                'data_type': 'string',
                'is_public': True,
                'description': 'Версия приложения'
            },
            {
                'category': 'security',
                'key': 'session_timeout',
                'value': '86400',
                'data_type': 'int',
                'is_public': False,
                'description': 'Время жизни сессии в секундах'
            },
            {
                'category': 'security',
                'key': 'password_min_length',
                'value': '8',
                'data_type': 'int',
                'is_public': True,
                'description': 'Минимальная длина пароля'
            },
            {
                'category': 'ui',
                'key': 'default_theme',
                'value': 'light',
                'data_type': 'string',
                'is_public': True,
                'description': 'Тема по умолчанию'
            },
            {
                'category': 'ui',
                'key': 'items_per_page',
                'value': '20',
                'data_type': 'int',
                'is_public': True,
                'description': 'Количество элементов на странице'
            },
            {
                'category': 'notifications',
                'key': 'enable_email_notifications',
                'value': 'true',
                'data_type': 'bool',
                'is_public': False,
                'description': 'Включить email уведомления'
            },
            {
                'category': 'notifications',
                'key': 'enable_push_notifications',
                'value': 'true',
                'data_type': 'bool',
                'is_public': False,
                'description': 'Включить push уведомления'
            }
        ]
        
        for setting_data in default_settings:
            # Проверяем, существует ли настройка
            existing = await db.execute(
                select(SystemSettings).where(
                    SystemSettings.category == setting_data['category'],
                    SystemSettings.key == setting_data['key']
                )
            )
            
            if not existing.scalar_one_or_none():
                setting = SystemSettings(**setting_data)
                db.add(setting)
        
        await db.commit()
    
    print("Настройки созданы успешно!")


async def assign_admin_roles():
    """Назначить роли администраторам"""
    print("Назначение ролей администраторам...")
    
    async with async_session() as db:
        from api.v3.models import Role as RoleV3, UserRole as UserRoleV3
        
        # Находим роль супер администратора
        super_admin_role = await db.execute(
            select(RoleV3).where(RoleV3.name == 'super_admin')
        )
        super_admin_role = super_admin_role.scalar_one_or_none()
        
        if not super_admin_role:
            print("Роль super_admin не найдена!")
            return
        
        # Находим всех пользователей с ролью admin
        admin_users = await db.execute(
            select(User).where(User.role == 'admin')
        )
        admin_users = admin_users.scalars().all()
        
        for user in admin_users:
            # Проверяем, нет ли уже такой роли
            existing_role = await db.execute(
                select(UserRoleV3).where(
                    UserRoleV3.user_id == user.id,
                    UserRoleV3.role_id == super_admin_role.id,
                    UserRoleV3.is_active == True
                )
            )
            
            if not existing_role.scalar_one_or_none():
                user_role = UserRoleV3(
                    user_id=user.id,
                    role_id=super_admin_role.id,
                    assigned_by=user.id,  # Самоназначение при инициализации
                    is_active=True
                )
                db.add(user_role)
                print(f"Назначена роль super_admin пользователю {user.username}")
        
        await db.commit()
    
    print("Роли назначены успешно!")


async def create_sample_email_settings():
    """Создать примеры настроек email"""
    print("Создание примеров настроек email...")
    
    async with async_session() as db:
        # Проверяем, есть ли уже настройки
        existing = await db.execute(select(EmailSettings))
        if existing.scalar_one_or_none():
            print("Настройки email уже существуют, пропускаем...")
            return
        
        # Создаем пример настроек для Gmail
        gmail_settings = EmailSettings(
            name="Gmail SMTP",
            smtp_server="smtp.gmail.com",
            smtp_port=587,
            username="your-email@gmail.com",
            password=encryption_manager.encrypt("your-app-password"),
            use_tls=True,
            use_ssl=False,
            from_email="your-email@gmail.com",
            from_name="AGB Platform",
            is_active=False,  # Неактивно до настройки
            is_default=True
        )
        
        db.add(gmail_settings)
        await db.commit()
    
    print("Примеры настроек email созданы!")


async def main():
    """Главная функция инициализации"""
    print("🚀 Инициализация системы v3...")
    print("=" * 50)
    
    try:
        # Создаем таблицы
        await create_tables()
        
        # Создаем роли по умолчанию
        await create_default_roles()
        
        # Создаем настройки по умолчанию
        await create_default_settings()
        
        # Назначаем роли администраторам
        await assign_admin_roles()
        
        # Создаем примеры настроек email
        await create_sample_email_settings()
        
        print("=" * 50)
        print("✅ Система v3 инициализирована успешно!")
        print()
        print("Что было создано:")
        print("- Таблицы для ролей и разрешений")
        print("- Системные роли (super_admin, admin, manager, user)")
        print("- Настройки системы по умолчанию")
        print("- Назначены роли администраторам")
        print("- Примеры настроек email")
        print()
        print("Следующие шаги:")
        print("1. Настройте email в админ панели")
        print("2. Добавьте API ключи для сервисов")
        print("3. Настройте разрешения ролей")
        
    except Exception as e:
        print(f"❌ Ошибка инициализации: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
