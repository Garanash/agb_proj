#!/usr/bin/env python3
"""
Скрипт для инициализации расширенной системы v3
Создает все необходимые таблицы и настройки для полноценной админ панели
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy.orm import sessionmaker

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
from api.v3.models import (
    Role, RolePermission, UserRole, EmailSettings, ApiKeySettings,
    SystemNotification, UserActivity, SystemSettings,
    SystemLog, LoginLog, SystemMetrics, SecurityEvent, BackupLog
)
from sqlalchemy import text
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    """Создать все таблицы v3"""
    try:
        logger.info("Создание таблиц v3...")
        
        # Создаем все таблицы
        from api.v3.models import Base
        Base.metadata.create_all(bind=engine, checkfirst=True)
        
        logger.info("✅ Таблицы v3 созданы успешно")
        return True
    except Exception as e:
        logger.error(f"❌ Ошибка создания таблиц: {e}")
        return False

def create_default_roles():
    """Создать роли по умолчанию"""
    try:
        db = SessionLocal()
        
        # Проверяем, есть ли уже роли
        existing_roles = db.query(Role).count()
        if existing_roles > 0:
            logger.info("Роли уже существуют, пропускаем создание")
            db.close()
            return True
        
        logger.info("Создание ролей по умолчанию...")
        
        # Создаем роли
        roles_data = [
            {
                "name": "super_admin",
                "description": "Супер администратор с полными правами",
                "is_system": True,
                "color": "#dc2626"
            },
            {
                "name": "admin",
                "description": "Администратор системы",
                "is_system": True,
                "color": "#2563eb"
            },
            {
                "name": "moderator",
                "description": "Модератор с ограниченными правами",
                "is_system": False,
                "color": "#7c3aed"
            },
            {
                "name": "user",
                "description": "Обычный пользователь",
                "is_system": False,
                "color": "#059669"
            }
        ]
        
        for role_data in roles_data:
            role = Role(**role_data)
            db.add(role)
        
        db.commit()
        
        # Создаем разрешения
        permissions_data = [
            # Управление пользователями
            {"name": "users.read", "description": "Просмотр пользователей"},
            {"name": "users.write", "description": "Создание и редактирование пользователей"},
            {"name": "users.delete", "description": "Удаление пользователей"},
            
            # Управление ролями
            {"name": "roles.read", "description": "Просмотр ролей"},
            {"name": "roles.write", "description": "Создание и редактирование ролей"},
            {"name": "roles.delete", "description": "Удаление ролей"},
            
            # Логи и мониторинг
            {"name": "logs.read", "description": "Просмотр логов"},
            {"name": "logs.delete", "description": "Удаление логов"},
            {"name": "monitoring.read", "description": "Просмотр мониторинга"},
            {"name": "monitoring.write", "description": "Запись метрик"},
            
            # Безопасность
            {"name": "security.read", "description": "Просмотр событий безопасности"},
            {"name": "security.write", "description": "Управление безопасностью"},
            
            # Резервное копирование
            {"name": "backup.read", "description": "Просмотр резервных копий"},
            {"name": "backup.write", "description": "Создание резервных копий"},
            {"name": "backup.delete", "description": "Удаление резервных копий"},
            
            # Настройки
            {"name": "settings.read", "description": "Просмотр настроек"},
            {"name": "settings.write", "description": "Изменение настроек"},
            
            # Уведомления
            {"name": "notifications.read", "description": "Просмотр уведомлений"},
            {"name": "notifications.write", "description": "Создание уведомлений"},
        ]
        
        for perm_data in permissions_data:
            permission = RolePermission(**perm_data)
            db.add(permission)
        
        db.commit()
        
        # Назначаем разрешения ролям
        super_admin_role = db.query(Role).filter(Role.name == "super_admin").first()
        admin_role = db.query(Role).filter(Role.name == "admin").first()
        moderator_role = db.query(Role).filter(Role.name == "moderator").first()
        
        all_permissions = db.query(RolePermission).all()
        
        # Супер админ получает все права
        for permission in all_permissions:
            role_permission = UserRole(
                role_id=super_admin_role.id,
                permission_id=permission.id
            )
            db.add(role_permission)
        
        # Админ получает большинство прав (кроме удаления критических данных)
        admin_permissions = [p for p in all_permissions if not p.name.endswith('.delete') or p.name in ['users.delete', 'logs.delete']]
        for permission in admin_permissions:
            role_permission = UserRole(
                role_id=admin_role.id,
                permission_id=permission.id
            )
            db.add(role_permission)
        
        # Модератор получает ограниченные права
        moderator_permissions = [p for p in all_permissions if p.name in [
            'users.read', 'roles.read', 'logs.read', 'monitoring.read',
            'settings.read', 'notifications.read', 'notifications.write'
        ]]
        for permission in moderator_permissions:
            role_permission = UserRole(
                role_id=moderator_role.id,
                permission_id=permission.id
            )
            db.add(role_permission)
        
        db.commit()
        db.close()
        
        logger.info("✅ Роли и разрешения созданы успешно")
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка создания ролей: {e}")
        return False

def create_default_settings():
    """Создать настройки по умолчанию"""
    try:
        db = SessionLocal()
        
        logger.info("Создание настроек по умолчанию...")
        
        settings_data = [
            # Общие настройки
            {
                "category": "general",
                "key": "app_name",
                "value": "Алмазгеобур Platform",
                "data_type": "string",
                "is_public": True,
                "description": "Название приложения"
            },
            {
                "category": "general",
                "key": "app_version",
                "value": "3.0.0",
                "data_type": "string",
                "is_public": True,
                "description": "Версия приложения"
            },
            {
                "category": "general",
                "key": "maintenance_mode",
                "value": "false",
                "data_type": "bool",
                "is_public": True,
                "description": "Режим технического обслуживания"
            },
            
            # Настройки безопасности
            {
                "category": "security",
                "key": "max_login_attempts",
                "value": "5",
                "data_type": "int",
                "is_public": False,
                "description": "Максимальное количество попыток входа"
            },
            {
                "category": "security",
                "key": "session_timeout",
                "value": "3600",
                "data_type": "int",
                "is_public": False,
                "description": "Таймаут сессии в секундах"
            },
            {
                "category": "security",
                "key": "password_min_length",
                "value": "8",
                "data_type": "int",
                "is_public": False,
                "description": "Минимальная длина пароля"
            },
            
            # Настройки логирования
            {
                "category": "logging",
                "key": "log_level",
                "value": "INFO",
                "data_type": "string",
                "is_public": False,
                "description": "Уровень логирования"
            },
            {
                "category": "logging",
                "key": "log_retention_days",
                "value": "30",
                "data_type": "int",
                "is_public": False,
                "description": "Количество дней хранения логов"
            },
            
            # Настройки резервного копирования
            {
                "category": "backup",
                "key": "auto_backup_enabled",
                "value": "true",
                "data_type": "bool",
                "is_public": False,
                "description": "Автоматическое резервное копирование"
            },
            {
                "category": "backup",
                "key": "backup_retention_days",
                "value": "30",
                "data_type": "int",
                "is_public": False,
                "description": "Количество дней хранения резервных копий"
            },
            
            # Настройки мониторинга
            {
                "category": "monitoring",
                "key": "metrics_collection_interval",
                "value": "300",
                "data_type": "int",
                "is_public": False,
                "description": "Интервал сбора метрик в секундах"
            },
            {
                "category": "monitoring",
                "key": "alert_cpu_threshold",
                "value": "80",
                "data_type": "int",
                "is_public": False,
                "description": "Порог оповещения по загрузке CPU (%)"
            },
            {
                "category": "monitoring",
                "key": "alert_memory_threshold",
                "value": "80",
                "data_type": "int",
                "is_public": False,
                "description": "Порог оповещения по использованию памяти (%)"
            }
        ]
        
        for setting_data in settings_data:
            # Проверяем, не существует ли уже такая настройка
            existing = db.query(SystemSettings).filter(
                SystemSettings.category == setting_data["category"],
                SystemSettings.key == setting_data["key"]
            ).first()
            
            if not existing:
                setting = SystemSettings(**setting_data)
                db.add(setting)
        
        db.commit()
        db.close()
        
        logger.info("✅ Настройки по умолчанию созданы успешно")
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка создания настроек: {e}")
        return False

def create_sample_data():
    """Создать примеры данных для демонстрации"""
    try:
        db = SessionLocal()
        
        logger.info("Создание примеров данных...")
        
        # Создаем примеры системных логов
        sample_logs = [
            {
                "level": "INFO",
                "message": "Система запущена успешно",
                "module": "main",
                "function": "startup"
            },
            {
                "level": "INFO",
                "message": "Пользователь admin вошел в систему",
                "module": "auth",
                "function": "login",
                "user_id": 1,
                "ip_address": "127.0.0.1"
            },
            {
                "level": "WARNING",
                "message": "Высокая загрузка CPU: 85%",
                "module": "monitoring",
                "function": "check_cpu"
            }
        ]
        
        for log_data in sample_logs:
            log = SystemLog(**log_data)
            db.add(log)
        
        # Создаем примеры метрик
        sample_metrics = [
            {
                "metric_name": "cpu_usage",
                "metric_value": 23.5,
                "metric_unit": "%",
                "tags": {"server": "main"}
            },
            {
                "metric_name": "memory_usage",
                "metric_value": 68.2,
                "metric_unit": "%",
                "tags": {"server": "main"}
            },
            {
                "metric_name": "disk_usage",
                "metric_value": 45.1,
                "metric_unit": "%",
                "tags": {"server": "main", "partition": "/"}
            }
        ]
        
        for metric_data in sample_metrics:
            metric = SystemMetrics(**metric_data)
            db.add(metric)
        
        db.commit()
        db.close()
        
        logger.info("✅ Примеры данных созданы успешно")
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка создания примеров данных: {e}")
        return False

def main():
    """Основная функция инициализации"""
    logger.info("🚀 Начало инициализации расширенной системы v3...")
    
    steps = [
        ("Создание таблиц", create_tables),
        ("Создание ролей и разрешений", create_default_roles),
        ("Создание настроек", create_default_settings),
        ("Создание примеров данных", create_sample_data)
    ]
    
    success_count = 0
    for step_name, step_func in steps:
        logger.info(f"📋 {step_name}...")
        if step_func():
            success_count += 1
        else:
            logger.error(f"❌ Ошибка на этапе: {step_name}")
    
    if success_count == len(steps):
        logger.info("🎉 Расширенная система v3 инициализирована успешно!")
        logger.info("📊 Доступные функции:")
        logger.info("  - Полное управление пользователями и ролями")
        logger.info("  - Система логирования и мониторинга")
        logger.info("  - Резервное копирование")
        logger.info("  - Аналитика и отчеты")
        logger.info("  - Настройки безопасности")
        logger.info("  - API управление")
        return True
    else:
        logger.error(f"❌ Инициализация завершена с ошибками ({success_count}/{len(steps)} этапов)")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
