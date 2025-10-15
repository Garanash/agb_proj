"""
Система интеграций с внешними сервисами
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import httpx
import json
import asyncio
import logging

from database import get_db
from ..schemas import (
    IntegrationCreate, IntegrationUpdate, IntegrationResponse,
    WebhookConfig, IntegrationTestResult, SuccessResponse, ErrorResponse
)
from ..models import SystemSettings, SystemLog
from ..utils import PermissionManager, ActivityLogger, encryption_manager
from ...v1.dependencies import get_current_user
from models import User

router = APIRouter()
logger = logging.getLogger(__name__)


class IntegrationManager:
    """Менеджер интеграций с внешними сервисами"""
    
    SUPPORTED_SERVICES = {
        "telegram": {
            "name": "Telegram Bot",
            "description": "Интеграция с Telegram ботом для уведомлений",
            "config_fields": ["bot_token", "chat_id", "parse_mode"],
            "webhook_supported": True
        },
        "slack": {
            "name": "Slack",
            "description": "Интеграция со Slack для уведомлений",
            "config_fields": ["webhook_url", "channel", "username"],
            "webhook_supported": True
        },
        "discord": {
            "name": "Discord",
            "description": "Интеграция с Discord для уведомлений",
            "config_fields": ["webhook_url", "username", "avatar_url"],
            "webhook_supported": True
        },
        "webhook": {
            "name": "Generic Webhook",
            "description": "Универсальный webhook для интеграций",
            "config_fields": ["url", "method", "headers", "auth_type"],
            "webhook_supported": False
        },
        "n8n": {
            "name": "n8n Automation",
            "description": "Интеграция с n8n для автоматизации",
            "config_fields": ["webhook_url", "api_key", "workflow_id"],
            "webhook_supported": True
        },
        "zapier": {
            "name": "Zapier",
            "description": "Интеграция с Zapier для автоматизации",
            "config_fields": ["webhook_url", "api_key"],
            "webhook_supported": True
        }
    }
    
    @staticmethod
    async def test_integration(integration_type: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Тестирует интеграцию с внешним сервисом"""
        try:
            if integration_type == "telegram":
                return await IntegrationManager._test_telegram(config)
            elif integration_type == "slack":
                return await IntegrationManager._test_slack(config)
            elif integration_type == "discord":
                return await IntegrationManager._test_discord(config)
            elif integration_type == "webhook":
                return await IntegrationManager._test_webhook(config)
            elif integration_type == "n8n":
                return await IntegrationManager._test_n8n(config)
            elif integration_type == "zapier":
                return await IntegrationManager._test_zapier(config)
            else:
                return {
                    "success": False,
                    "error": "Неподдерживаемый тип интеграции",
                    "details": f"Тип {integration_type} не поддерживается"
                }
        except Exception as e:
            logger.error(f"Ошибка тестирования интеграции {integration_type}: {str(e)}")
            return {
                "success": False,
                "error": "Ошибка тестирования",
                "details": str(e)
            }
    
    @staticmethod
    async def _test_telegram(config: Dict[str, Any]) -> Dict[str, Any]:
        """Тестирует интеграцию с Telegram"""
        bot_token = config.get("bot_token")
        chat_id = config.get("chat_id")
        
        if not bot_token or not chat_id:
            return {
                "success": False,
                "error": "Отсутствуют обязательные параметры",
                "details": "Требуются bot_token и chat_id"
            }
        
        try:
            async with httpx.AsyncClient() as client:
                # Проверяем токен бота
                response = await client.get(f"https://api.telegram.org/bot{bot_token}/getMe")
                if response.status_code != 200:
                    return {
                        "success": False,
                        "error": "Неверный токен бота",
                        "details": response.text
                    }
                
                # Отправляем тестовое сообщение
                test_message = {
                    "chat_id": chat_id,
                    "text": "🧪 Тестовое сообщение от AGB Platform",
                    "parse_mode": config.get("parse_mode", "HTML")
                }
                
                response = await client.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json=test_message
                )
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "message": "Интеграция с Telegram работает корректно",
                        "bot_info": response.json().get("result", {}).get("from", {})
                    }
                else:
                    return {
                        "success": False,
                        "error": "Ошибка отправки сообщения",
                        "details": response.text
                    }
        except Exception as e:
            return {
                "success": False,
                "error": "Ошибка подключения к Telegram",
                "details": str(e)
            }
    
    @staticmethod
    async def _test_slack(config: Dict[str, Any]) -> Dict[str, Any]:
        """Тестирует интеграцию со Slack"""
        webhook_url = config.get("webhook_url")
        
        if not webhook_url:
            return {
                "success": False,
                "error": "Отсутствует webhook URL",
                "details": "Требуется webhook_url"
            }
        
        try:
            async with httpx.AsyncClient() as client:
                test_payload = {
                    "text": "🧪 Тестовое сообщение от AGB Platform",
                    "channel": config.get("channel"),
                    "username": config.get("username", "AGB Platform")
                }
                
                response = await client.post(webhook_url, json=test_payload)
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "message": "Интеграция со Slack работает корректно"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Ошибка отправки в Slack",
                        "details": response.text
                    }
        except Exception as e:
            return {
                "success": False,
                "error": "Ошибка подключения к Slack",
                "details": str(e)
            }
    
    @staticmethod
    async def _test_discord(config: Dict[str, Any]) -> Dict[str, Any]:
        """Тестирует интеграцию с Discord"""
        webhook_url = config.get("webhook_url")
        
        if not webhook_url:
            return {
                "success": False,
                "error": "Отсутствует webhook URL",
                "details": "Требуется webhook_url"
            }
        
        try:
            async with httpx.AsyncClient() as client:
                test_payload = {
                    "content": "🧪 Тестовое сообщение от AGB Platform",
                    "username": config.get("username", "AGB Platform"),
                    "avatar_url": config.get("avatar_url")
                }
                
                response = await client.post(webhook_url, json=test_payload)
                
                if response.status_code in [200, 204]:
                    return {
                        "success": True,
                        "message": "Интеграция с Discord работает корректно"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Ошибка отправки в Discord",
                        "details": response.text
                    }
        except Exception as e:
            return {
                "success": False,
                "error": "Ошибка подключения к Discord",
                "details": str(e)
            }
    
    @staticmethod
    async def _test_webhook(config: Dict[str, Any]) -> Dict[str, Any]:
        """Тестирует универсальный webhook"""
        url = config.get("url")
        method = config.get("method", "POST")
        
        if not url:
            return {
                "success": False,
                "error": "Отсутствует URL",
                "details": "Требуется url"
            }
        
        try:
            async with httpx.AsyncClient() as client:
                test_payload = {
                    "test": True,
                    "message": "Тестовое сообщение от AGB Platform",
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                headers = config.get("headers", {})
                if config.get("auth_type") == "bearer":
                    headers["Authorization"] = f"Bearer {config.get('auth_token', '')}"
                elif config.get("auth_type") == "basic":
                    import base64
                    auth_string = f"{config.get('username', '')}:{config.get('password', '')}"
                    headers["Authorization"] = f"Basic {base64.b64encode(auth_string.encode()).decode()}"
                
                if method.upper() == "POST":
                    response = await client.post(url, json=test_payload, headers=headers)
                elif method.upper() == "PUT":
                    response = await client.put(url, json=test_payload, headers=headers)
                else:
                    response = await client.get(url, headers=headers)
                
                return {
                    "success": response.status_code < 400,
                    "message": f"Webhook отвечает со статусом {response.status_code}",
                    "status_code": response.status_code,
                    "response": response.text[:500]  # Ограничиваем размер ответа
                }
        except Exception as e:
            return {
                "success": False,
                "error": "Ошибка подключения к webhook",
                "details": str(e)
            }
    
    @staticmethod
    async def _test_n8n(config: Dict[str, Any]) -> Dict[str, Any]:
        """Тестирует интеграцию с n8n"""
        webhook_url = config.get("webhook_url")
        api_key = config.get("api_key")
        
        if not webhook_url:
            return {
                "success": False,
                "error": "Отсутствует webhook URL",
                "details": "Требуется webhook_url"
            }
        
        try:
            async with httpx.AsyncClient() as client:
                test_payload = {
                    "test": True,
                    "message": "Тестовое сообщение от AGB Platform",
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                headers = {}
                if api_key:
                    headers["X-N8N-API-KEY"] = api_key
                
                response = await client.post(webhook_url, json=test_payload, headers=headers)
                
                if response.status_code in [200, 201]:
                    return {
                        "success": True,
                        "message": "Интеграция с n8n работает корректно"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Ошибка отправки в n8n",
                        "details": response.text
                    }
        except Exception as e:
            return {
                "success": False,
                "error": "Ошибка подключения к n8n",
                "details": str(e)
            }
    
    @staticmethod
    async def _test_zapier(config: Dict[str, Any]) -> Dict[str, Any]:
        """Тестирует интеграцию с Zapier"""
        webhook_url = config.get("webhook_url")
        
        if not webhook_url:
            return {
                "success": False,
                "error": "Отсутствует webhook URL",
                "details": "Требуется webhook_url"
            }
        
        try:
            async with httpx.AsyncClient() as client:
                test_payload = {
                    "test": True,
                    "message": "Тестовое сообщение от AGB Platform",
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                response = await client.post(webhook_url, json=test_payload)
                
                if response.status_code in [200, 201]:
                    return {
                        "success": True,
                        "message": "Интеграция с Zapier работает корректно"
                    }
                else:
                    return {
                        "success": False,
                        "error": "Ошибка отправки в Zapier",
                        "details": response.text
                    }
        except Exception as e:
            return {
                "success": False,
                "error": "Ошибка подключения к Zapier",
                "details": str(e)
            }
    
    @staticmethod
    async def send_notification(
        integration_type: str, 
        config: Dict[str, Any], 
        message: str, 
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Отправляет уведомление через интеграцию"""
        try:
            if integration_type == "telegram":
                return await IntegrationManager._send_telegram_message(config, message, data)
            elif integration_type == "slack":
                return await IntegrationManager._send_slack_message(config, message, data)
            elif integration_type == "discord":
                return await IntegrationManager._send_discord_message(config, message, data)
            elif integration_type == "webhook":
                return await IntegrationManager._send_webhook_message(config, message, data)
            elif integration_type == "n8n":
                return await IntegrationManager._send_n8n_message(config, message, data)
            elif integration_type == "zapier":
                return await IntegrationManager._send_zapier_message(config, message, data)
            else:
                return {
                    "success": False,
                    "error": "Неподдерживаемый тип интеграции"
                }
        except Exception as e:
            logger.error(f"Ошибка отправки уведомления через {integration_type}: {str(e)}")
            return {
                "success": False,
                "error": "Ошибка отправки уведомления",
                "details": str(e)
            }
    
    @staticmethod
    async def _send_telegram_message(config: Dict[str, Any], message: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Отправляет сообщение в Telegram"""
        bot_token = config.get("bot_token")
        chat_id = config.get("chat_id")
        
        if not bot_token or not chat_id:
            return {"success": False, "error": "Отсутствуют обязательные параметры"}
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": config.get("parse_mode", "HTML")
                }
                
                if data:
                    payload.update(data)
                
                response = await client.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json=payload
                )
                
                return {
                    "success": response.status_code == 200,
                    "response": response.json() if response.status_code == 200 else None
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def _send_slack_message(config: Dict[str, Any], message: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Отправляет сообщение в Slack"""
        webhook_url = config.get("webhook_url")
        
        if not webhook_url:
            return {"success": False, "error": "Отсутствует webhook URL"}
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "text": message,
                    "channel": config.get("channel"),
                    "username": config.get("username", "AGB Platform")
                }
                
                if data:
                    payload.update(data)
                
                response = await client.post(webhook_url, json=payload)
                
                return {
                    "success": response.status_code == 200,
                    "response": response.text
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def _send_discord_message(config: Dict[str, Any], message: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Отправляет сообщение в Discord"""
        webhook_url = config.get("webhook_url")
        
        if not webhook_url:
            return {"success": False, "error": "Отсутствует webhook URL"}
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "content": message,
                    "username": config.get("username", "AGB Platform"),
                    "avatar_url": config.get("avatar_url")
                }
                
                if data:
                    payload.update(data)
                
                response = await client.post(webhook_url, json=payload)
                
                return {
                    "success": response.status_code in [200, 204],
                    "response": response.text
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def _send_webhook_message(config: Dict[str, Any], message: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Отправляет сообщение через webhook"""
        url = config.get("url")
        method = config.get("method", "POST")
        
        if not url:
            return {"success": False, "error": "Отсутствует URL"}
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "message": message,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                if data:
                    payload.update(data)
                
                headers = config.get("headers", {})
                if config.get("auth_type") == "bearer":
                    headers["Authorization"] = f"Bearer {config.get('auth_token', '')}"
                elif config.get("auth_type") == "basic":
                    import base64
                    auth_string = f"{config.get('username', '')}:{config.get('password', '')}"
                    headers["Authorization"] = f"Basic {base64.b64encode(auth_string.encode()).decode()}"
                
                if method.upper() == "POST":
                    response = await client.post(url, json=payload, headers=headers)
                elif method.upper() == "PUT":
                    response = await client.put(url, json=payload, headers=headers)
                else:
                    response = await client.get(url, headers=headers)
                
                return {
                    "success": response.status_code < 400,
                    "status_code": response.status_code,
                    "response": response.text
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def _send_n8n_message(config: Dict[str, Any], message: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Отправляет сообщение в n8n"""
        webhook_url = config.get("webhook_url")
        
        if not webhook_url:
            return {"success": False, "error": "Отсутствует webhook URL"}
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "message": message,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                if data:
                    payload.update(data)
                
                headers = {}
                if config.get("api_key"):
                    headers["X-N8N-API-KEY"] = config["api_key"]
                
                response = await client.post(webhook_url, json=payload, headers=headers)
                
                return {
                    "success": response.status_code in [200, 201],
                    "response": response.text
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    @staticmethod
    async def _send_zapier_message(config: Dict[str, Any], message: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Отправляет сообщение в Zapier"""
        webhook_url = config.get("webhook_url")
        
        if not webhook_url:
            return {"success": False, "error": "Отсутствует webhook URL"}
        
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "message": message,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                if data:
                    payload.update(data)
                
                response = await client.post(webhook_url, json=payload)
                
                return {
                    "success": response.status_code in [200, 201],
                    "response": response.text
                }
        except Exception as e:
            return {"success": False, "error": str(e)}


# Эндпоинты для управления интеграциями
@router.get("/integrations/supported", response_model=List[Dict[str, Any]])
async def get_supported_integrations():
    """Получить список поддерживаемых интеграций"""
    return [
        {
            "type": service_type,
            "name": service_info["name"],
            "description": service_info["description"],
            "config_fields": service_info["config_fields"],
            "webhook_supported": service_info["webhook_supported"]
        }
        for service_type, service_info in IntegrationManager.SUPPORTED_SERVICES.items()
    ]


@router.get("/integrations", response_model=List[IntegrationResponse])
async def get_integrations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Получить список настроенных интеграций"""
    await PermissionManager.require_permission(db, current_user.id, "settings.read")
    
    # Получаем настройки интеграций из системных настроек
    result = await db.execute(
        select(SystemSettings).where(
            and_(
                SystemSettings.category == "integrations",
                SystemSettings.is_public == True
            )
        )
    )
    settings = result.scalars().all()
    
    integrations = []
    for setting in settings:
        try:
            config = json.loads(setting.value) if setting.data_type == "json" else {"value": setting.value}
            integrations.append({
                "id": setting.id,
                "name": setting.key,
                "type": config.get("type", "unknown"),
                "is_active": config.get("is_active", True),
                "config": {k: v for k, v in config.items() if k not in ["type", "is_active"]},
                "created_at": setting.created_at,
                "updated_at": setting.updated_at
            })
        except json.JSONDecodeError:
            continue
    
    return integrations


@router.post("/integrations", response_model=IntegrationResponse)
async def create_integration(
    integration_data: IntegrationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создать новую интеграцию"""
    await PermissionManager.require_permission(db, current_user.id, "settings.update")
    
    # Проверяем, что тип интеграции поддерживается
    if integration_data.type not in IntegrationManager.SUPPORTED_SERVICES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неподдерживаемый тип интеграции"
        )
    
    # Создаем конфигурацию
    config = {
        "type": integration_data.type,
        "is_active": integration_data.is_active,
        **integration_data.config
    }
    
    # Сохраняем в системных настройках
    setting = SystemSettings(
        category="integrations",
        key=integration_data.name,
        value=json.dumps(config),
        data_type="json",
        is_public=True,
        description=f"Интеграция {integration_data.type}"
    )
    
    db.add(setting)
    await db.commit()
    await db.refresh(setting)
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "create", "integration", str(setting.id)
    )
    
    return {
        "id": setting.id,
        "name": setting.key,
        "type": integration_data.type,
        "is_active": integration_data.is_active,
        "config": integration_data.config,
        "created_at": setting.created_at,
        "updated_at": setting.updated_at
    }


@router.post("/integrations/{integration_id}/test", response_model=IntegrationTestResult)
async def test_integration(
    integration_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Тестировать интеграцию"""
    await PermissionManager.require_permission(db, current_user.id, "settings.read")
    
    # Получаем настройки интеграции
    result = await db.execute(
        select(SystemSettings).where(SystemSettings.id == integration_id)
    )
    setting = result.scalar_one_or_none()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Интеграция не найдена"
        )
    
    try:
        config = json.loads(setting.value) if setting.data_type == "json" else {"value": setting.value}
        integration_type = config.get("type")
        
        if not integration_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверная конфигурация интеграции"
            )
        
        # Тестируем интеграцию
        test_result = await IntegrationManager.test_integration(integration_type, config)
        
        # Логируем результат теста
        await ActivityLogger.log_activity(
            db, current_user.id, "test_integration", "integration", str(integration_id),
            details=test_result
        )
        
        return IntegrationTestResult(**test_result)
        
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный формат конфигурации"
        )


@router.post("/integrations/{integration_id}/send", response_model=SuccessResponse)
async def send_notification(
    integration_id: int,
    message: str,
    data: Optional[Dict[str, Any]] = None,
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Отправить уведомление через интеграцию"""
    await PermissionManager.require_permission(db, current_user.id, "notifications.send")
    
    # Получаем настройки интеграции
    result = await db.execute(
        select(SystemSettings).where(SystemSettings.id == integration_id)
    )
    setting = result.scalar_one_or_none()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Интеграция не найдена"
        )
    
    try:
        config = json.loads(setting.value) if setting.data_type == "json" else {"value": setting.value}
        integration_type = config.get("type")
        
        if not integration_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Неверная конфигурация интеграции"
            )
        
        if not config.get("is_active", True):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Интеграция неактивна"
            )
        
        # Отправляем уведомление
        if background_tasks:
            background_tasks.add_task(
                IntegrationManager.send_notification,
                integration_type,
                config,
                message,
                data
            )
            
            # Логируем активность
            await ActivityLogger.log_activity(
                db, current_user.id, "send_notification", "integration", str(integration_id),
                details={"message": message[:100], "type": integration_type}
            )
            
            return SuccessResponse(message="Уведомление отправлено")
        else:
            result = await IntegrationManager.send_notification(
                integration_type, config, message, data
            )
            
            if result["success"]:
                return SuccessResponse(message="Уведомление отправлено успешно")
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=result["error"]
                )
                
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный формат конфигурации"
        )


@router.delete("/integrations/{integration_id}", response_model=SuccessResponse)
async def delete_integration(
    integration_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удалить интеграцию"""
    await PermissionManager.require_permission(db, current_user.id, "settings.update")
    
    # Получаем настройки интеграции
    result = await db.execute(
        select(SystemSettings).where(SystemSettings.id == integration_id)
    )
    setting = result.scalar_one_or_none()
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Интеграция не найдена"
        )
    
    # Удаляем настройки
    await db.delete(setting)
    await db.commit()
    
    # Логируем активность
    await ActivityLogger.log_activity(
        db, current_user.id, "delete", "integration", str(integration_id)
    )
    
    return SuccessResponse(message="Интеграция удалена")
