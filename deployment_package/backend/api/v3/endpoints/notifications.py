"""
Система уведомлений и логирования
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
import asyncio
import logging

from database import get_db
from ..schemas import (
    NotificationCreate, NotificationResponse, NotificationUpdate,
    NotificationTemplate, NotificationStats, SuccessResponse, ErrorResponse
)
from ..models import SystemSettings, SystemLog
from models import User
from ..utils import PermissionManager, ActivityLogger, encryption_manager
from ...v1.dependencies import get_current_user
from .integrations import IntegrationManager

router = APIRouter()
logger = logging.getLogger(__name__)


class NotificationManager:
    """Менеджер уведомлений"""
    
    @staticmethod
    async def send_notification(
        db: AsyncSession,
        user_id: int,
        title: str,
        message: str,
        notification_type: str = "info",
        data: Optional[Dict[str, Any]] = None,
        channels: List[str] = ["email", "in_app"]
    ) -> Dict[str, Any]:
        """Отправить уведомление пользователю"""
        try:
            # Получаем пользователя
            user_result = await db.execute(select(User).where(User.id == user_id))
            user = user_result.scalar_one_or_none()
            
            if not user:
                return {"success": False, "error": "Пользователь не найден"}
            
            # Создаем запись уведомления в базе данных
            notification_data = {
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": notification_type,
                "data": data or {},
                "channels": channels,
                "status": "pending",
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Логируем уведомление
            await ActivityLogger.log_activity(
                db, user_id, "notification_sent", "notification", str(user_id),
                details=notification_data
            )
            
            # Отправляем через различные каналы
            results = {}
            
            for channel in channels:
                if channel == "email":
                    result = await NotificationManager._send_email_notification(
                        db, user, title, message, notification_type, data
                    )
                    results["email"] = result
                
                elif channel == "telegram":
                    result = await NotificationManager._send_telegram_notification(
                        db, user, title, message, notification_type, data
                    )
                    results["telegram"] = result
                
                elif channel == "slack":
                    result = await NotificationManager._send_slack_notification(
                        db, user, title, message, notification_type, data
                    )
                    results["slack"] = result
                
                elif channel == "discord":
                    result = await NotificationManager._send_discord_notification(
                        db, user, title, message, notification_type, data
                    )
                    results["discord"] = result
                
                elif channel == "webhook":
                    result = await NotificationManager._send_webhook_notification(
                        db, user, title, message, notification_type, data
                    )
                    results["webhook"] = result
            
            return {
                "success": True,
                "message": "Уведомление отправлено",
                "channels": results,
                "notification_data": notification_data
            }
            
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления: {str(e)}")
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def _send_email_notification(
        db: AsyncSession,
        user: User,
        title: str,
        message: str,
        notification_type: str,
        data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Отправить email уведомление"""
        try:
            # Получаем настройки email по умолчанию
            email_settings_result = await db.execute(
                select(SystemSettings).where(
                    and_(
                        SystemSettings.category == "integrations",
                        SystemSettings.key.like("%email%"),
                        SystemSettings.is_public == True
                    )
                )
            )
            email_settings = email_settings_result.scalars().first()
            
            if not email_settings:
                return {"success": False, "error": "Email настройки не найдены"}
            
            config = json.loads(email_settings.value) if email_settings.data_type == "json" else {}
            
            if not config.get("is_active", True):
                return {"success": False, "error": "Email интеграция неактивна"}
            
            # Формируем HTML сообщение
            html_message = f"""
            <html>
            <body>
                <h2>{title}</h2>
                <p>{message}</p>
                <p><small>Тип: {notification_type}</small></p>
                {f'<p><small>Дополнительные данные: {json.dumps(data, ensure_ascii=False)}</small></p>' if data else ''}
                <hr>
                <p><small>AGB Platform - {datetime.utcnow().strftime('%d.%m.%Y %H:%M')}</small></p>
            </body>
            </html>
            """
            
            # Используем IntegrationManager для отправки
            result = await IntegrationManager.send_notification(
                "email",
                config,
                html_message,
                data
            )
            
            return result
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def _send_telegram_notification(
        db: AsyncSession,
        user: User,
        title: str,
        message: str,
        notification_type: str,
        data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Отправить Telegram уведомление"""
        try:
            # Получаем настройки Telegram
            telegram_settings_result = await db.execute(
                select(SystemSettings).where(
                    and_(
                        SystemSettings.category == "integrations",
                        SystemSettings.key.like("%telegram%"),
                        SystemSettings.is_public == True
                    )
                )
            )
            telegram_settings = telegram_settings_result.scalars().first()
            
            if not telegram_settings:
                return {"success": False, "error": "Telegram настройки не найдены"}
            
            config = json.loads(telegram_settings.value) if telegram_settings.data_type == "json" else {}
            
            if not config.get("is_active", True):
                return {"success": False, "error": "Telegram интеграция неактивна"}
            
            # Формируем сообщение для Telegram
            telegram_message = f"🔔 *{title}*\n\n{message}\n\n📋 Тип: {notification_type}"
            
            if data:
                telegram_message += f"\n\n📊 Данные: {json.dumps(data, ensure_ascii=False)}"
            
            # Используем IntegrationManager для отправки
            result = await IntegrationManager.send_notification(
                "telegram",
                config,
                telegram_message,
                data
            )
            
            return result
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def _send_slack_notification(
        db: AsyncSession,
        user: User,
        title: str,
        message: str,
        notification_type: str,
        data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Отправить Slack уведомление"""
        try:
            # Получаем настройки Slack
            slack_settings_result = await db.execute(
                select(SystemSettings).where(
                    and_(
                        SystemSettings.category == "integrations",
                        SystemSettings.key.like("%slack%"),
                        SystemSettings.is_public == True
                    )
                )
            )
            slack_settings = slack_settings_result.scalars().first()
            
            if not slack_settings:
                return {"success": False, "error": "Slack настройки не найдены"}
            
            config = json.loads(slack_settings.value) if slack_settings.data_type == "json" else {}
            
            if not config.get("is_active", True):
                return {"success": False, "error": "Slack интеграция неактивна"}
            
            # Формируем сообщение для Slack
            slack_message = f"🔔 *{title}*\n\n{message}\n\n📋 Тип: {notification_type}"
            
            if data:
                slack_message += f"\n\n📊 Данные: {json.dumps(data, ensure_ascii=False)}"
            
            # Используем IntegrationManager для отправки
            result = await IntegrationManager.send_notification(
                "slack",
                config,
                slack_message,
                data
            )
            
            return result
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def _send_discord_notification(
        db: AsyncSession,
        user: User,
        title: str,
        message: str,
        notification_type: str,
        data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Отправить Discord уведомление"""
        try:
            # Получаем настройки Discord
            discord_settings_result = await db.execute(
                select(SystemSettings).where(
                    and_(
                        SystemSettings.category == "integrations",
                        SystemSettings.key.like("%discord%"),
                        SystemSettings.is_public == True
                    )
                )
            )
            discord_settings = discord_settings_result.scalars().first()
            
            if not discord_settings:
                return {"success": False, "error": "Discord настройки не найдены"}
            
            config = json.loads(discord_settings.value) if discord_settings.data_type == "json" else {}
            
            if not config.get("is_active", True):
                return {"success": False, "error": "Discord интеграция неактивна"}
            
            # Формируем сообщение для Discord
            discord_message = f"🔔 **{title}**\n\n{message}\n\n📋 Тип: {notification_type}"
            
            if data:
                discord_message += f"\n\n📊 Данные: {json.dumps(data, ensure_ascii=False)}"
            
            # Используем IntegrationManager для отправки
            result = await IntegrationManager.send_notification(
                "discord",
                config,
                discord_message,
                data
            )
            
            return result
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def _send_webhook_notification(
        db: AsyncSession,
        user: User,
        title: str,
        message: str,
        notification_type: str,
        data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Отправить webhook уведомление"""
        try:
            # Получаем настройки webhook
            webhook_settings_result = await db.execute(
                select(SystemSettings).where(
                    and_(
                        SystemSettings.category == "integrations",
                        SystemSettings.key.like("%webhook%"),
                        SystemSettings.is_public == True
                    )
                )
            )
            webhook_settings = webhook_settings_result.scalars().first()
            
            if not webhook_settings:
                return {"success": False, "error": "Webhook настройки не найдены"}
            
            config = json.loads(webhook_settings.value) if webhook_settings.data_type == "json" else {}
            
            if not config.get("is_active", True):
                return {"success": False, "error": "Webhook интеграция неактивна"}
            
            # Формируем данные для webhook
            webhook_data = {
                "title": title,
                "message": message,
                "type": notification_type,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email
                },
                "timestamp": datetime.utcnow().isoformat(),
                "data": data or {}
            }
            
            # Используем IntegrationManager для отправки
            result = await IntegrationManager.send_notification(
                "webhook",
                config,
                json.dumps(webhook_data, ensure_ascii=False),
                webhook_data
            )
            
            return result
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def get_notification_stats(db: AsyncSession, days: int = 30) -> Dict[str, Any]:
        """Получить статистику уведомлений"""
        try:
            start_date = datetime.utcnow() - timedelta(days=days)
            
            # Подсчитываем уведомления по типам
            stats_query = select(
                func.count(SystemLog.id).label('total'),
                func.count(SystemLog.id).filter(
                    SystemLog.details.like('%"notification_sent"%')
                ).label('notifications_sent')
            ).where(
                SystemLog.created_at >= start_date
            )
            
            result = await db.execute(stats_query)
            stats = result.fetchone()
            
            return {
                "period_days": days,
                "total_activities": stats.total or 0,
                "notifications_sent": stats.notifications_sent or 0,
                "success_rate": (stats.notifications_sent / stats.total * 100) if stats.total > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Ошибка получения статистики уведомлений: {str(e)}")
            return {"error": str(e)}


# Эндпоинты для управления уведомлениями
@router.post("/notifications/send", response_model=SuccessResponse)
async def send_notification(
    notification_data: NotificationCreate,
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отправить уведомление"""
    await PermissionManager.require_permission(db, current_user.id, "notifications.send")
    
    if background_tasks:
        background_tasks.add_task(
            NotificationManager.send_notification,
            db,
            notification_data.user_id,
            notification_data.title,
            notification_data.message,
            notification_data.type,
            notification_data.data,
            notification_data.channels
        )
        
        return SuccessResponse(message="Уведомление поставлено в очередь")
    else:
        result = await NotificationManager.send_notification(
            db,
            notification_data.user_id,
            notification_data.title,
            notification_data.message,
            notification_data.type,
            notification_data.data,
            notification_data.channels
        )
        
        if result["success"]:
            return SuccessResponse(message=result["message"])
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["error"]
            )


@router.post("/notifications/broadcast", response_model=SuccessResponse)
async def broadcast_notification(
    title: str,
    message: str,
    notification_type: str = "info",
    channels: List[str] = ["email", "in_app"],
    user_ids: Optional[List[int]] = None,
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отправить массовое уведомление"""
    await PermissionManager.require_permission(db, current_user.id, "notifications.send")
    
    # Если не указаны пользователи, отправляем всем активным
    if not user_ids:
        users_result = await db.execute(select(User.id).where(User.is_active == True))
        user_ids = [row[0] for row in users_result.fetchall()]
    
    if background_tasks:
        for user_id in user_ids:
            background_tasks.add_task(
                NotificationManager.send_notification,
                db,
                user_id,
                title,
                message,
                notification_type,
                {},
                channels
            )
        
        return SuccessResponse(message=f"Массовое уведомление поставлено в очередь для {len(user_ids)} пользователей")
    else:
        results = []
        for user_id in user_ids:
            result = await NotificationManager.send_notification(
                db,
                user_id,
                title,
                message,
                notification_type,
                {},
                channels
            )
            results.append(result)
        
        successful = sum(1 for r in results if r["success"])
        return SuccessResponse(message=f"Отправлено {successful} из {len(user_ids)} уведомлений")


@router.get("/notifications/stats", response_model=NotificationStats)
async def get_notification_stats(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить статистику уведомлений"""
    await PermissionManager.require_permission(db, current_user.id, "analytics.read")
    
    stats = await NotificationManager.get_notification_stats(db, days)
    
    return NotificationStats(**stats)


@router.get("/notifications/templates", response_model=List[NotificationTemplate])
async def get_notification_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить шаблоны уведомлений"""
    await PermissionManager.require_permission(db, current_user.id, "notifications.manage")
    
    # Получаем шаблоны из системных настроек
    templates_result = await db.execute(
        select(SystemSettings).where(
            and_(
                SystemSettings.category == "notification_templates",
                SystemSettings.is_public == True
            )
        )
    )
    templates = templates_result.scalars().all()
    
    notification_templates = []
    for template in templates:
        try:
            config = json.loads(template.value) if template.data_type == "json" else {"value": template.value}
            notification_templates.append({
                "id": template.id,
                "name": template.key,
                "title_template": config.get("title_template", ""),
                "message_template": config.get("message_template", ""),
                "type": config.get("type", "info"),
                "channels": config.get("channels", ["email"]),
                "variables": config.get("variables", []),
                "description": template.description,
                "created_at": template.created_at,
                "updated_at": template.updated_at
            })
        except json.JSONDecodeError:
            continue
    
    return notification_templates


@router.post("/notifications/templates", response_model=NotificationTemplate)
async def create_notification_template(
    template_data: NotificationTemplate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать шаблон уведомления"""
    await PermissionManager.require_permission(db, current_user.id, "notifications.manage")
    
    # Создаем конфигурацию шаблона
    config = {
        "title_template": template_data.title_template,
        "message_template": template_data.message_template,
        "type": template_data.type,
        "channels": template_data.channels,
        "variables": template_data.variables
    }
    
    # Сохраняем в системных настройках
    template = SystemSettings(
        category="notification_templates",
        key=template_data.name,
        value=json.dumps(config),
        data_type="json",
        is_public=True,
        description=template_data.description
    )
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "create", "notification_template", str(template.id)
    )
    
    return {
        "id": template.id,
        "name": template.key,
        "title_template": template_data.title_template,
        "message_template": template_data.message_template,
        "type": template_data.type,
        "channels": template_data.channels,
        "variables": template_data.variables,
        "description": template_data.description,
        "created_at": template.created_at,
        "updated_at": template.updated_at
    }


@router.post("/notifications/test", response_model=SuccessResponse)
async def test_notification(
    user_id: int,
    title: str = "Тестовое уведомление",
    message: str = "Это тестовое уведомление для проверки системы",
    channels: List[str] = ["email"],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отправить тестовое уведомление"""
    await PermissionManager.require_permission(db, current_user.id, "notifications.send")
    
    result = await NotificationManager.send_notification(
        db,
        user_id,
        title,
        message,
        "test",
        {"test": True},
        channels
    )
    
    if result["success"]:
        return SuccessResponse(message="Тестовое уведомление отправлено")
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result["error"]
        )
