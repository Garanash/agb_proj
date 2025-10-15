"""
Расширенное управление email настройками с тестированием и мониторингом
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio
import logging

from database import get_db
from ..schemas import (
    EmailSettingsCreate, EmailSettingsUpdate, EmailSettingsResponse,
    EmailTestRequest, EmailTestResponse, EmailStatsResponse,
    SuccessResponse, ErrorResponse
)
from ..models import EmailSettings, SystemLog
from ..utils import (
    PermissionManager, EncryptionManager, 
    ActivityLogger, SettingsValidator, encryption_manager
)
from ...v1.dependencies import get_current_user
from models import User

router = APIRouter()
logger = logging.getLogger(__name__)


class EmailManager:
    """Менеджер для отправки email с различными настройками"""
    
    @staticmethod
    async def test_email_connection(settings: EmailSettings) -> Dict[str, Any]:
        """Тестирует подключение к SMTP серверу"""
        try:
            # Расшифровываем пароль
            password = encryption_manager.decrypt(settings.password)
            
            # Создаем контекст SSL/TLS
            context = ssl.create_default_context()
            
            # Подключаемся к серверу
            if settings.use_ssl:
                server = smtplib.SMTP_SSL(settings.smtp_server, settings.smtp_port, context=context)
            else:
                server = smtplib.SMTP(settings.smtp_server, settings.smtp_port)
                if settings.use_tls:
                    server.starttls(context=context)
            
            # Аутентификация
            server.login(settings.username, password)
            
            # Закрываем соединение
            server.quit()
            
            return {
                "success": True,
                "message": "Подключение успешно установлено",
                "server": settings.smtp_server,
                "port": settings.smtp_port,
                "tls": settings.use_tls,
                "ssl": settings.use_ssl
            }
            
        except smtplib.SMTPAuthenticationError as e:
            return {
                "success": False,
                "error": "Ошибка аутентификации",
                "details": str(e),
                "code": "AUTH_ERROR"
            }
        except smtplib.SMTPConnectError as e:
            return {
                "success": False,
                "error": "Ошибка подключения к серверу",
                "details": str(e),
                "code": "CONNECTION_ERROR"
            }
        except smtplib.SMTPException as e:
            return {
                "success": False,
                "error": "SMTP ошибка",
                "details": str(e),
                "code": "SMTP_ERROR"
            }
        except Exception as e:
            return {
                "success": False,
                "error": "Неожиданная ошибка",
                "details": str(e),
                "code": "UNKNOWN_ERROR"
            }
    
    @staticmethod
    async def send_test_email(
        settings: EmailSettings, 
        to_email: str, 
        subject: str = "Тестовое письмо",
        body: str = "Это тестовое письмо для проверки настроек email"
    ) -> Dict[str, Any]:
        """Отправляет тестовое письмо"""
        try:
            # Расшифровываем пароль
            password = encryption_manager.decrypt(settings.password)
            
            # Создаем сообщение
            msg = MimeMultipart()
            msg['From'] = f"{settings.from_name} <{settings.from_email}>" if settings.from_name else settings.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Добавляем тело письма
            msg.attach(MimeText(body, 'html', 'utf-8'))
            
            # Создаем контекст SSL/TLS
            context = ssl.create_default_context()
            
            # Подключаемся и отправляем
            if settings.use_ssl:
                server = smtplib.SMTP_SSL(settings.smtp_server, settings.smtp_port, context=context)
            else:
                server = smtplib.SMTP(settings.smtp_server, settings.smtp_port)
                if settings.use_tls:
                    server.starttls(context=context)
            
            server.login(settings.username, password)
            server.send_message(msg)
            server.quit()
            
            return {
                "success": True,
                "message": "Тестовое письмо успешно отправлено",
                "to": to_email,
                "subject": subject
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": "Ошибка отправки письма",
                "details": str(e)
            }
    
    @staticmethod
    async def send_email(
        settings: EmailSettings,
        to_emails: List[str],
        subject: str,
        body: str,
        is_html: bool = True,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Отправляет email с возможностью вложений"""
        try:
            password = encryption_manager.decrypt(settings.password)
            
            # Создаем сообщение
            msg = MimeMultipart()
            msg['From'] = f"{settings.from_name} <{settings.from_email}>" if settings.from_name else settings.from_email
            msg['To'] = ", ".join(to_emails)
            msg['Subject'] = subject
            
            # Добавляем тело письма
            if is_html:
                msg.attach(MimeText(body, 'html', 'utf-8'))
            else:
                msg.attach(MimeText(body, 'plain', 'utf-8'))
            
            # Добавляем вложения если есть
            if attachments:
                for attachment in attachments:
                    part = MimeBase('application', 'octet-stream')
                    part.set_payload(attachment['content'])
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {attachment["filename"]}'
                    )
                    msg.attach(part)
            
            # Создаем контекст SSL/TLS
            context = ssl.create_default_context()
            
            # Подключаемся и отправляем
            if settings.use_ssl:
                server = smtplib.SMTP_SSL(settings.smtp_server, settings.smtp_port, context=context)
            else:
                server = smtplib.SMTP(settings.smtp_server, settings.smtp_port)
                if settings.use_tls:
                    server.starttls(context=context)
            
            server.login(settings.username, password)
            server.send_message(msg)
            server.quit()
            
            return {
                "success": True,
                "message": f"Письмо успешно отправлено {len(to_emails)} получателям",
                "recipients": to_emails,
                "subject": subject
            }
            
        except Exception as e:
            logger.error(f"Ошибка отправки email: {str(e)}")
            return {
                "success": False,
                "error": "Ошибка отправки письма",
                "details": str(e)
            }


# Эндпоинты для управления email настройками
@router.get("/email-settings", response_model=List[EmailSettingsResponse])
async def get_email_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить все настройки email"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    result = await db.execute(select(EmailSettings).order_by(EmailSettings.created_at.desc()))
    settings = result.scalars().all()
    
    return settings


@router.post("/email-settings", response_model=EmailSettingsResponse)
async def create_email_settings(
    settings_data: EmailSettingsCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать настройки email"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    # Валидация
    errors = SettingsValidator.validate_email_settings(settings_data.dict())
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"errors": errors}
        )
    
    # Если это настройки по умолчанию, убираем флаг у других
    if settings_data.is_default:
        await db.execute(
            EmailSettings.__table__.update().where(
                EmailSettings.is_default == True
            ).values(is_default=False)
        )
    
    # Создаем настройки
    settings = EmailSettings(
        name=settings_data.name,
        smtp_server=settings_data.smtp_server,
        smtp_port=settings_data.smtp_port,
        username=settings_data.username,
        password=encryption_manager.encrypt(settings_data.password),
        use_tls=settings_data.use_tls,
        use_ssl=settings_data.use_ssl,
        from_email=settings_data.from_email,
        from_name=settings_data.from_name,
        is_active=settings_data.is_active,
        is_default=settings_data.is_default
    )
    
    db.add(settings)
    await db.commit()
    await db.refresh(settings)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "create", "email_settings", str(settings.id)
    )
    
    return settings


@router.put("/email-settings/{settings_id}", response_model=EmailSettingsResponse)
async def update_email_settings(
    settings_id: int,
    settings_data: EmailSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Обновить настройки email"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    # Получаем существующие настройки
    result = await db.execute(select(EmailSettings).where(EmailSettings.id == settings_id))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройки email не найдены"
        )
    
    # Обновляем поля
    update_data = settings_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "password" and value:
            setattr(settings, field, encryption_manager.encrypt(value))
        else:
            setattr(settings, field, value)
    
    # Если делаем настройки по умолчанию, убираем флаг у других
    if settings_data.is_default:
        await db.execute(
            EmailSettings.__table__.update().where(
                and_(
                    EmailSettings.id != settings_id,
                    EmailSettings.is_default == True
                )
            ).values(is_default=False)
        )
    
    settings.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(settings)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "update", "email_settings", str(settings.id)
    )
    
    return settings


@router.delete("/email-settings/{settings_id}", response_model=SuccessResponse)
async def delete_email_settings(
    settings_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить настройки email"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    # Получаем настройки
    result = await db.execute(select(EmailSettings).where(EmailSettings.id == settings_id))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройки email не найдены"
        )
    
    # Нельзя удалить настройки по умолчанию
    if settings.is_default:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Нельзя удалить настройки по умолчанию"
        )
    
    await db.delete(settings)
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "delete", "email_settings", str(settings_id)
    )
    
    return SuccessResponse(message="Настройки email удалены")


@router.post("/email-settings/{settings_id}/test-connection", response_model=EmailTestResponse)
async def test_email_connection(
    settings_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Тестировать подключение к email серверу"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    # Получаем настройки
    result = await db.execute(select(EmailSettings).where(EmailSettings.id == settings_id))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройки email не найдены"
        )
    
    # Тестируем подключение
    test_result = await EmailManager.test_email_connection(settings)
    
    # Логируем результат теста
    await ActivityLogger.log_activity(
        db, current_user.id, "test_connection", "email_settings", str(settings_id),
        details=test_result
    )
    
    return EmailTestResponse(**test_result)


@router.post("/email-settings/{settings_id}/test-email", response_model=EmailTestResponse)
async def test_email_send(
    settings_id: int,
    test_request: EmailTestRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отправить тестовое письмо"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    # Получаем настройки
    result = await db.execute(select(EmailSettings).where(EmailSettings.id == settings_id))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройки email не найдены"
        )
    
    # Отправляем тестовое письмо
    test_result = await EmailManager.send_test_email(
        settings, 
        test_request.to_email,
        test_request.subject or "Тестовое письмо",
        test_request.body or "Это тестовое письмо для проверки настроек email"
    )
    
    # Логируем результат теста
    await ActivityLogger.log_activity(
        db, current_user.id, "test_email", "email_settings", str(settings_id),
        details=test_result
    )
    
    return EmailTestResponse(**test_result)


@router.get("/email-settings/{settings_id}/stats", response_model=EmailStatsResponse)
async def get_email_stats(
    settings_id: int,
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить статистику использования email настроек"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    # Получаем настройки
    result = await db.execute(select(EmailSettings).where(EmailSettings.id == settings_id))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройки email не найдены"
        )
    
    # Получаем статистику из логов (примерная реализация)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Здесь можно добавить более детальную статистику
    stats = {
        "settings_id": settings_id,
        "period_days": days,
        "total_emails_sent": 0,  # TODO: реализовать подсчет
        "successful_emails": 0,
        "failed_emails": 0,
        "last_used": None,
        "average_response_time": 0.0
    }
    
    return EmailStatsResponse(**stats)


@router.post("/email-settings/{settings_id}/set-default", response_model=SuccessResponse)
async def set_default_email_settings(
    settings_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Установить настройки email по умолчанию"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    # Получаем настройки
    result = await db.execute(select(EmailSettings).where(EmailSettings.id == settings_id))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройки email не найдены"
        )
    
    # Убираем флаг по умолчанию у всех других настроек
    await db.execute(
        EmailSettings.__table__.update().where(
            EmailSettings.id != settings_id
        ).values(is_default=False)
    )
    
    # Устанавливаем флаг по умолчанию для выбранных настроек
    settings.is_default = True
    settings.updated_at = datetime.utcnow()
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "set_default", "email_settings", str(settings_id)
    )
    
    return SuccessResponse(message="Настройки email установлены по умолчанию")


@router.post("/email-settings/send-bulk", response_model=SuccessResponse)
async def send_bulk_email(
    settings_id: int,
    to_emails: List[str],
    subject: str,
    body: str,
    is_html: bool = True,
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отправить массовое письмо"""
    await PermissionManager.require_permission(db, current_user.id, "settings.manage_email")
    
    # Получаем настройки
    result = await db.execute(select(EmailSettings).where(EmailSettings.id == settings_id))
    settings = result.scalar_one_or_none()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройки email не найдены"
        )
    
    if not settings.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Настройки email неактивны"
        )
    
    # Добавляем задачу в фоновые задачи
    if background_tasks:
        background_tasks.add_task(
            EmailManager.send_email,
            settings,
            to_emails,
            subject,
            body,
            is_html
        )
        
        # Логируем активность
        await ActivityLogger.log_activity(
            db, current_user.id, "send_bulk_email", "email_settings", str(settings_id),
            details={"recipients_count": len(to_emails), "subject": subject}
        )
        
        return SuccessResponse(message=f"Массовая рассылка запущена для {len(to_emails)} получателей")
    else:
        # Синхронная отправка
        result = await EmailManager.send_email(settings, to_emails, subject, body, is_html)
        
        if result["success"]:
            return SuccessResponse(message=result["message"])
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["error"]
            )
