#!/usr/bin/env python3
"""
Упрощенный скрипт для инициализации системы v3
"""

import asyncio
import sys
import os

# Добавляем путь к backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import async_session, Base, engine
from models import User
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession


async def create_tables():
    """Создать таблицы v3"""
    print("Создание таблиц v3...")
    
    try:
        async with engine.begin() as conn:
            # Создаем таблицы для v3
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS roles_v3 (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(50) UNIQUE NOT NULL,
                    display_name VARCHAR(100) NOT NULL,
                    description TEXT,
                    is_system BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    color VARCHAR(7),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE
                );
            """))
            
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS role_permissions_v3 (
                    id SERIAL PRIMARY KEY,
                    role_id INTEGER REFERENCES roles_v3(id) ON DELETE CASCADE,
                    permission VARCHAR(100) NOT NULL,
                    granted BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))
            
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS user_roles_v3 (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    role_id INTEGER REFERENCES roles_v3(id) ON DELETE CASCADE,
                    assigned_by INTEGER REFERENCES users(id),
                    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    expires_at TIMESTAMP WITH TIME ZONE,
                    is_active BOOLEAN DEFAULT TRUE
                );
            """))
            
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS email_settings_v3 (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    smtp_server VARCHAR(255) NOT NULL,
                    smtp_port INTEGER NOT NULL,
                    username VARCHAR(255) NOT NULL,
                    password VARCHAR(500) NOT NULL,
                    use_tls BOOLEAN DEFAULT TRUE,
                    use_ssl BOOLEAN DEFAULT FALSE,
                    from_email VARCHAR(255) NOT NULL,
                    from_name VARCHAR(255),
                    is_active BOOLEAN DEFAULT TRUE,
                    is_default BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE
                );
            """))
            
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS api_key_settings_v3 (
                    id SERIAL PRIMARY KEY,
                    service_name VARCHAR(50) NOT NULL,
                    key_name VARCHAR(100) NOT NULL,
                    api_key VARCHAR(500) NOT NULL,
                    additional_config JSON,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_default BOOLEAN DEFAULT FALSE,
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE,
                    last_used TIMESTAMP WITH TIME ZONE
                );
            """))
            
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS system_notifications_v3 (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    notification_type VARCHAR(20) NOT NULL,
                    target_users JSON,
                    target_roles JSON,
                    is_read JSON DEFAULT '{}',
                    is_system_wide BOOLEAN DEFAULT FALSE,
                    priority INTEGER DEFAULT 1,
                    expires_at TIMESTAMP WITH TIME ZONE,
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))
            
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS system_settings_v3 (
                    id SERIAL PRIMARY KEY,
                    category VARCHAR(50) NOT NULL,
                    key VARCHAR(100) NOT NULL,
                    value TEXT,
                    data_type VARCHAR(20) DEFAULT 'string',
                    is_encrypted BOOLEAN DEFAULT FALSE,
                    is_public BOOLEAN DEFAULT FALSE,
                    description TEXT,
                    validation_rules JSON,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE,
                    UNIQUE(category, key)
                );
            """))
            
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS user_activity_v3 (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    action VARCHAR(50) NOT NULL,
                    resource_type VARCHAR(50),
                    resource_id VARCHAR(50),
                    details JSON,
                    ip_address INET,
                    user_agent TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """))
        
        print("Таблицы созданы успешно!")
    except Exception as e:
        print(f"Ошибка создания таблиц: {e}")
        raise


async def create_default_roles():
    """Создать роли по умолчанию"""
    print("Создание ролей по умолчанию...")
    
    try:
        async with async_session() as db:
            # Создаем роли
            roles_data = [
                ('super_admin', 'Супер администратор', 'Полный доступ ко всем функциям системы', '#dc2626', True),
                ('admin', 'Администратор', 'Управление пользователями и основными настройками', '#ea580c', True),
                ('manager', 'Менеджер', 'Управление пользователями в своем подразделении', '#2563eb', True),
                ('user', 'Пользователь', 'Базовые права пользователя', '#16a34a', True)
            ]
            
            for name, display_name, description, color, is_system in roles_data:
                await db.execute(text("""
                    INSERT INTO roles_v3 (name, display_name, description, color, is_system, is_active)
                    VALUES (:name, :display_name, :description, :color, :is_system, TRUE)
                    ON CONFLICT (name) DO NOTHING
                """), {
                    'name': name,
                    'display_name': display_name,
                    'description': description,
                    'color': color,
                    'is_system': is_system
                })
            
            # Получаем ID созданных ролей
            result = await db.execute(text("SELECT id, name FROM roles_v3"))
            roles = {row[1]: row[0] for row in result.fetchall()}
            
            # Создаем разрешения для ролей
            permissions_data = [
                (roles['super_admin'], 'admin.full_access', True),
                (roles['admin'], 'user.create', True),
                (roles['admin'], 'user.read', True),
                (roles['admin'], 'user.update', True),
                (roles['admin'], 'user.manage_roles', True),
                (roles['admin'], 'role.read', True),
                (roles['admin'], 'settings.read', True),
                (roles['admin'], 'settings.update', True),
                (roles['admin'], 'notifications.send', True),
                (roles['admin'], 'analytics.read', True),
                (roles['manager'], 'user.read', True),
                (roles['manager'], 'user.update', True),
                (roles['manager'], 'notifications.send', True),
                (roles['user'], 'user.read', True)
            ]
            
            for role_id, permission, granted in permissions_data:
                await db.execute(text("""
                    INSERT INTO role_permissions_v3 (role_id, permission, granted)
                    VALUES (:role_id, :permission, :granted)
                    ON CONFLICT DO NOTHING
                """), {
                    'role_id': role_id,
                    'permission': permission,
                    'granted': granted
                })
            
            await db.commit()
        
        print("Роли созданы успешно!")
    except Exception as e:
        print(f"Ошибка создания ролей: {e}")
        raise


async def assign_admin_roles():
    """Назначить роли администраторам"""
    print("Назначение ролей администраторам...")
    
    try:
        async with async_session() as db:
            # Находим роль супер администратора
            result = await db.execute(text("SELECT id FROM roles_v3 WHERE name = 'super_admin'"))
            super_admin_role_id = result.scalar_one_or_none()
            
            if not super_admin_role_id:
                print("Роль super_admin не найдена!")
                return
            
            # Находим всех пользователей с ролью admin
            result = await db.execute(text("SELECT id, username FROM users WHERE role = 'admin'"))
            admin_users = result.fetchall()
            
            for user_id, username in admin_users:
                # Проверяем, нет ли уже такой роли
                existing = await db.execute(text("""
                    SELECT id FROM user_roles_v3 
                    WHERE user_id = :user_id AND role_id = :role_id AND is_active = TRUE
                """), {
                    'user_id': user_id,
                    'role_id': super_admin_role_id
                })
                
                if not existing.scalar_one_or_none():
                    await db.execute(text("""
                        INSERT INTO user_roles_v3 (user_id, role_id, assigned_by, is_active)
                        VALUES (:user_id, :role_id, :assigned_by, TRUE)
                    """), {
                        'user_id': user_id,
                        'role_id': super_admin_role_id,
                        'assigned_by': user_id
                    })
                    print(f"Назначена роль super_admin пользователю {username}")
            
            await db.commit()
        
        print("Роли назначены успешно!")
    except Exception as e:
        print(f"Ошибка назначения ролей: {e}")
        raise


async def create_default_settings():
    """Создать настройки по умолчанию"""
    print("Создание настроек по умолчанию...")
    
    try:
        async with async_session() as db:
            settings_data = [
                ('general', 'app_name', 'AGB Platform', 'string', False, True, 'Название приложения'),
                ('general', 'app_version', '3.0.0', 'string', False, True, 'Версия приложения'),
                ('security', 'session_timeout', '86400', 'int', False, False, 'Время жизни сессии в секундах'),
                ('security', 'password_min_length', '8', 'int', False, True, 'Минимальная длина пароля'),
                ('ui', 'default_theme', 'light', 'string', False, True, 'Тема по умолчанию'),
                ('ui', 'items_per_page', '20', 'int', False, True, 'Количество элементов на странице'),
                ('notifications', 'enable_email_notifications', 'true', 'bool', False, False, 'Включить email уведомления'),
                ('notifications', 'enable_push_notifications', 'true', 'bool', False, False, 'Включить push уведомления')
            ]
            
            for category, key, value, data_type, is_encrypted, is_public, description in settings_data:
                await db.execute(text("""
                    INSERT INTO system_settings_v3 (category, key, value, data_type, is_encrypted, is_public, description)
                    VALUES (:category, :key, :value, :data_type, :is_encrypted, :is_public, :description)
                    ON CONFLICT (category, key) DO NOTHING
                """), {
                    'category': category,
                    'key': key,
                    'value': value,
                    'data_type': data_type,
                    'is_encrypted': is_encrypted,
                    'is_public': is_public,
                    'description': description
                })
            
            await db.commit()
        
        print("Настройки созданы успешно!")
    except Exception as e:
        print(f"Ошибка создания настроек: {e}")
        raise


async def main():
    """Главная функция инициализации"""
    print("🚀 Инициализация системы v3...")
    print("=" * 50)
    
    try:
        # Создаем таблицы
        await create_tables()
        
        # Создаем роли по умолчанию
        await create_default_roles()
        
        # Назначаем роли администраторам
        await assign_admin_roles()
        
        # Создаем настройки по умолчанию
        await create_default_settings()
        
        print("=" * 50)
        print("✅ Система v3 инициализирована успешно!")
        print()
        print("Что было создано:")
        print("- Таблицы для ролей и разрешений")
        print("- Системные роли (super_admin, admin, manager, user)")
        print("- Настройки системы по умолчанию")
        print("- Назначены роли администраторам")
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
