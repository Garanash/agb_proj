#!/usr/bin/env python3
"""
Простой скрипт для инициализации расширенной системы v3
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables_sql():
    """Создать таблицы через SQL"""
    try:
        logger.info("Создание таблиц v3 через SQL...")
        
        # SQL для создания таблиц
        create_tables_sql = """
        -- Таблица ролей
        CREATE TABLE IF NOT EXISTS roles_v3 (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) UNIQUE NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            is_system BOOLEAN DEFAULT FALSE,
            color VARCHAR(7),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Таблица разрешений
        CREATE TABLE IF NOT EXISTS role_permissions_v3 (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            resource VARCHAR(50),
            action VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Таблица связи ролей и разрешений
        CREATE TABLE IF NOT EXISTS user_roles_v3 (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            role_id INTEGER REFERENCES roles_v3(id),
            assigned_by INTEGER,
            assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            expires_at TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN DEFAULT TRUE
        );

        -- Таблица настроек email
        CREATE TABLE IF NOT EXISTS email_settings_v3 (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            smtp_server VARCHAR(255) NOT NULL,
            smtp_port INTEGER NOT NULL,
            username VARCHAR(255),
            password_encrypted TEXT,
            use_tls BOOLEAN DEFAULT TRUE,
            use_ssl BOOLEAN DEFAULT FALSE,
            from_email VARCHAR(255) NOT NULL,
            from_name VARCHAR(255),
            is_active BOOLEAN DEFAULT TRUE,
            is_default BOOLEAN DEFAULT FALSE,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Таблица API ключей
        CREATE TABLE IF NOT EXISTS api_key_settings_v3 (
            id SERIAL PRIMARY KEY,
            key_name VARCHAR(100) NOT NULL,
            api_key_encrypted TEXT NOT NULL,
            service_name VARCHAR(100) NOT NULL,
            additional_config JSONB,
            is_active BOOLEAN DEFAULT TRUE,
            is_default BOOLEAN DEFAULT FALSE,
            last_used TIMESTAMP WITH TIME ZONE,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Таблица системных уведомлений
        CREATE TABLE IF NOT EXISTS system_notifications_v3 (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            notification_type VARCHAR(20) NOT NULL,
            target_users INTEGER[],
            target_roles INTEGER[],
            is_system_wide BOOLEAN DEFAULT FALSE,
            priority INTEGER DEFAULT 1,
            is_read JSONB DEFAULT '{}',
            expires_at TIMESTAMP WITH TIME ZONE,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Таблица активности пользователей
        CREATE TABLE IF NOT EXISTS user_activity_v3 (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(50),
            resource_id VARCHAR(100),
            details JSONB,
            ip_address INET,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Таблица системных настроек
        CREATE TABLE IF NOT EXISTS system_settings_v3 (
            id SERIAL PRIMARY KEY,
            category VARCHAR(50) NOT NULL,
            key VARCHAR(100) NOT NULL,
            value TEXT,
            data_type VARCHAR(20) DEFAULT 'string',
            is_encrypted BOOLEAN DEFAULT FALSE,
            is_public BOOLEAN DEFAULT FALSE,
            description TEXT,
            validation_rules JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(category, key)
        );

        -- Таблица системных логов
        CREATE TABLE IF NOT EXISTS system_logs_v3 (
            id SERIAL PRIMARY KEY,
            level VARCHAR(20) NOT NULL,
            message TEXT NOT NULL,
            module VARCHAR(100),
            function VARCHAR(100),
            line_number INTEGER,
            user_id INTEGER,
            ip_address INET,
            user_agent TEXT,
            request_id VARCHAR(100),
            extra_data JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Таблица логов входов
        CREATE TABLE IF NOT EXISTS login_logs_v3 (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            username VARCHAR(100) NOT NULL,
            ip_address INET NOT NULL,
            user_agent TEXT,
            success BOOLEAN NOT NULL,
            failure_reason VARCHAR(200),
            session_id VARCHAR(100),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Таблица метрик системы
        CREATE TABLE IF NOT EXISTS system_metrics_v3 (
            id SERIAL PRIMARY KEY,
            metric_name VARCHAR(100) NOT NULL,
            metric_value FLOAT NOT NULL,
            metric_unit VARCHAR(20),
            tags JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Таблица событий безопасности
        CREATE TABLE IF NOT EXISTS security_events_v3 (
            id SERIAL PRIMARY KEY,
            event_type VARCHAR(50) NOT NULL,
            severity VARCHAR(20) NOT NULL,
            description TEXT NOT NULL,
            user_id INTEGER,
            ip_address INET,
            user_agent TEXT,
            additional_data JSONB,
            resolved BOOLEAN DEFAULT FALSE,
            resolved_by INTEGER,
            resolved_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Таблица логов резервного копирования
        CREATE TABLE IF NOT EXISTS backup_logs_v3 (
            id SERIAL PRIMARY KEY,
            backup_type VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL,
            file_path VARCHAR(500),
            file_size BIGINT,
            duration_seconds INTEGER,
            error_message TEXT,
            created_by INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Создаем индексы
        CREATE INDEX IF NOT EXISTS idx_roles_v3_name ON roles_v3(name);
        CREATE INDEX IF NOT EXISTS idx_user_roles_v3_user_id ON user_roles_v3(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_roles_v3_role_id ON user_roles_v3(role_id);
        CREATE INDEX IF NOT EXISTS idx_system_logs_v3_level ON system_logs_v3(level);
        CREATE INDEX IF NOT EXISTS idx_system_logs_v3_created_at ON system_logs_v3(created_at);
        CREATE INDEX IF NOT EXISTS idx_login_logs_v3_user_id ON login_logs_v3(user_id);
        CREATE INDEX IF NOT EXISTS idx_login_logs_v3_success ON login_logs_v3(success);
        CREATE INDEX IF NOT EXISTS idx_login_logs_v3_created_at ON login_logs_v3(created_at);
        CREATE INDEX IF NOT EXISTS idx_system_metrics_v3_name ON system_metrics_v3(metric_name);
        CREATE INDEX IF NOT EXISTS idx_system_metrics_v3_created_at ON system_metrics_v3(created_at);
        CREATE INDEX IF NOT EXISTS idx_security_events_v3_type ON security_events_v3(event_type);
        CREATE INDEX IF NOT EXISTS idx_security_events_v3_severity ON security_events_v3(severity);
        CREATE INDEX IF NOT EXISTS idx_security_events_v3_resolved ON security_events_v3(resolved);
        CREATE INDEX IF NOT EXISTS idx_backup_logs_v3_type ON backup_logs_v3(backup_type);
        CREATE INDEX IF NOT EXISTS idx_backup_logs_v3_status ON backup_logs_v3(status);
        """
        
        # Выполняем SQL
        with engine.connect() as conn:
            conn.execute(text(create_tables_sql))
            conn.commit()
        
        logger.info("✅ Таблицы v3 созданы успешно")
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка создания таблиц: {e}")
        return False

def insert_default_data():
    """Вставить данные по умолчанию"""
    try:
        logger.info("Вставка данных по умолчанию...")
        
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        # Вставляем роли
        roles_sql = """
        INSERT INTO roles_v3 (name, description, is_system, color) VALUES
        ('super_admin', 'Супер администратор с полными правами', TRUE, '#dc2626'),
        ('admin', 'Администратор системы', TRUE, '#2563eb'),
        ('moderator', 'Модератор с ограниченными правами', FALSE, '#7c3aed'),
        ('user', 'Обычный пользователь', FALSE, '#059669')
        ON CONFLICT (name) DO NOTHING;
        """
        
        # Вставляем разрешения
        permissions_sql = """
        INSERT INTO role_permissions_v3 (name, description, resource, action) VALUES
        ('users.read', 'Просмотр пользователей', 'users', 'read'),
        ('users.write', 'Создание и редактирование пользователей', 'users', 'write'),
        ('users.delete', 'Удаление пользователей', 'users', 'delete'),
        ('roles.read', 'Просмотр ролей', 'roles', 'read'),
        ('roles.write', 'Создание и редактирование ролей', 'roles', 'write'),
        ('roles.delete', 'Удаление ролей', 'roles', 'delete'),
        ('logs.read', 'Просмотр логов', 'logs', 'read'),
        ('logs.delete', 'Удаление логов', 'logs', 'delete'),
        ('monitoring.read', 'Просмотр мониторинга', 'monitoring', 'read'),
        ('monitoring.write', 'Запись метрик', 'monitoring', 'write'),
        ('security.read', 'Просмотр событий безопасности', 'security', 'read'),
        ('security.write', 'Управление безопасностью', 'security', 'write'),
        ('backup.read', 'Просмотр резервных копий', 'backup', 'read'),
        ('backup.write', 'Создание резервных копий', 'backup', 'write'),
        ('backup.delete', 'Удаление резервных копий', 'backup', 'delete'),
        ('settings.read', 'Просмотр настроек', 'settings', 'read'),
        ('settings.write', 'Изменение настроек', 'settings', 'write'),
        ('notifications.read', 'Просмотр уведомлений', 'notifications', 'read'),
        ('notifications.write', 'Создание уведомлений', 'notifications', 'write')
        ON CONFLICT (name) DO NOTHING;
        """
        
        # Вставляем настройки
        settings_sql = """
        INSERT INTO system_settings_v3 (category, key, value, data_type, is_public, description) VALUES
        ('general', 'app_name', 'Алмазгеобур Platform', 'string', TRUE, 'Название приложения'),
        ('general', 'app_version', '3.0.0', 'string', TRUE, 'Версия приложения'),
        ('general', 'maintenance_mode', 'false', 'bool', TRUE, 'Режим технического обслуживания'),
        ('security', 'max_login_attempts', '5', 'int', FALSE, 'Максимальное количество попыток входа'),
        ('security', 'session_timeout', '3600', 'int', FALSE, 'Таймаут сессии в секундах'),
        ('security', 'password_min_length', '8', 'int', FALSE, 'Минимальная длина пароля'),
        ('logging', 'log_level', 'INFO', 'string', FALSE, 'Уровень логирования'),
        ('logging', 'log_retention_days', '30', 'int', FALSE, 'Количество дней хранения логов'),
        ('backup', 'auto_backup_enabled', 'true', 'bool', FALSE, 'Автоматическое резервное копирование'),
        ('backup', 'backup_retention_days', '30', 'int', FALSE, 'Количество дней хранения резервных копий'),
        ('monitoring', 'metrics_collection_interval', '300', 'int', FALSE, 'Интервал сбора метрик в секундах'),
        ('monitoring', 'alert_cpu_threshold', '80', 'int', FALSE, 'Порог оповещения по загрузке CPU (%)'),
        ('monitoring', 'alert_memory_threshold', '80', 'int', FALSE, 'Порог оповещения по использованию памяти (%)')
        ON CONFLICT (category, key) DO NOTHING;
        """
        
        # Выполняем SQL
        with engine.connect() as conn:
            conn.execute(text(roles_sql))
            conn.execute(text(permissions_sql))
            conn.execute(text(settings_sql))
            conn.commit()
        
        db.close()
        logger.info("✅ Данные по умолчанию вставлены успешно")
        return True
        
    except Exception as e:
        logger.error(f"❌ Ошибка вставки данных: {e}")
        return False

def main():
    """Основная функция"""
    logger.info("🚀 Начало инициализации расширенной системы v3...")
    
    steps = [
        ("Создание таблиц", create_tables_sql),
        ("Вставка данных по умолчанию", insert_default_data)
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
