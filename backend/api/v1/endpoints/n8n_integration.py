"""
API endpoints для интеграции с n8n
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx
import json
import asyncio
from pydantic import BaseModel

from database import get_db
from models import User, UserRole
from .auth import get_current_user
from ..schemas import BaseResponseModel

router = APIRouter()

# Конфигурация n8n
N8N_BASE_URL = "http://n8n:5678"
N8N_WEBHOOK_BASE_URL = "http://n8n:5678/webhook"

class N8NWebhookData(BaseModel):
    """Данные для отправки в n8n webhook"""
    event_type: str
    data: Dict[str, Any]
    timestamp: str
    source: str = "agb_platform"

class N8NWorkflowTrigger(BaseModel):
    """Триггер для запуска workflow в n8n"""
    workflow_id: str
    data: Dict[str, Any]
    wait_for_result: bool = False

class N8NWorkflowStatus(BaseModel):
    """Статус выполнения workflow"""
    workflow_id: str
    execution_id: str
    status: str
    started_at: str
    finished_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None

@router.post("/webhook/trigger", response_model=BaseResponseModel)
async def trigger_n8n_webhook(
    webhook_data: N8NWebhookData,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Отправка данных в n8n webhook"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Отправляем данные в n8n
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{N8N_WEBHOOK_BASE_URL}/agb-platform",
                json=webhook_data.dict(),
                timeout=30.0
            )
            
            if response.status_code >= 400:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Ошибка отправки в n8n: {response.text}"
                )
            
            return BaseResponseModel(
                success=True,
                message="Данные успешно отправлены в n8n",
                data={"webhook_response": response.json()}
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Таймаут при отправке в n8n")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка интеграции с n8n: {str(e)}")

@router.post("/workflow/execute", response_model=BaseResponseModel)
async def execute_n8n_workflow(
    workflow_trigger: N8NWorkflowTrigger,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Выполнение workflow в n8n"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Получаем API ключ для n8n (в реальном проекте из переменных окружения)
        n8n_api_key = "your-n8n-api-key"  # TODO: добавить в переменные окружения
        
        async with httpx.AsyncClient() as client:
            headers = {
                "X-N8N-API-KEY": n8n_api_key,
                "Content-Type": "application/json"
            }
            
            payload = {
                "workflowId": workflow_trigger.workflow_id,
                "data": workflow_trigger.data
            }
            
            response = await client.post(
                f"{N8N_BASE_URL}/api/v1/workflows/{workflow_trigger.workflow_id}/execute",
                json=payload,
                headers=headers,
                timeout=60.0
            )
            
            if response.status_code >= 400:
                raise HTTPException(
                    status_code=500,
                    detail=f"Ошибка выполнения workflow: {response.text}"
                )
            
            result = response.json()
            
            return BaseResponseModel(
                success=True,
                message="Workflow успешно запущен",
                data={
                    "execution_id": result.get("executionId"),
                    "workflow_id": workflow_trigger.workflow_id,
                    "status": "running"
                }
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Таймаут при выполнении workflow")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка выполнения workflow: {str(e)}")

@router.get("/workflow/status/{execution_id}", response_model=BaseResponseModel)
async def get_workflow_status(
    execution_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение статуса выполнения workflow"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        n8n_api_key = "your-n8n-api-key"  # TODO: добавить в переменные окружения
        
        async with httpx.AsyncClient() as client:
            headers = {"X-N8N-API-KEY": n8n_api_key}
            
            response = await client.get(
                f"{N8N_BASE_URL}/api/v1/executions/{execution_id}",
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code >= 400:
                raise HTTPException(
                    status_code=500,
                    detail=f"Ошибка получения статуса: {response.text}"
                )
            
            execution_data = response.json()
            
            return BaseResponseModel(
                success=True,
                message="Статус получен",
                data={
                    "execution_id": execution_id,
                    "status": execution_data.get("status"),
                    "started_at": execution_data.get("startedAt"),
                    "finished_at": execution_data.get("finishedAt"),
                    "result": execution_data.get("data")
                }
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Таймаут при получении статуса")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения статуса: {str(e)}")

@router.get("/workflows", response_model=BaseResponseModel)
async def get_n8n_workflows(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка доступных workflows в n8n"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        n8n_api_key = "your-n8n-api-key"  # TODO: добавить в переменные окружения
        
        async with httpx.AsyncClient() as client:
            headers = {"X-N8N-API-KEY": n8n_api_key}
            
            response = await client.get(
                f"{N8N_BASE_URL}/api/v1/workflows",
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code >= 400:
                raise HTTPException(
                    status_code=500,
                    detail=f"Ошибка получения workflows: {response.text}"
                )
            
            workflows = response.json()
            
            return BaseResponseModel(
                success=True,
                message="Workflows получены",
                data={
                    "workflows": workflows,
                    "count": len(workflows)
                }
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Таймаут при получении workflows")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения workflows: {str(e)}")

@router.post("/events/passport-created")
async def handle_passport_created_event(
    passport_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обработка события создания паспорта ВЭД"""
    try:
        # Создаем данные для отправки в n8n
        webhook_data = N8NWebhookData(
            event_type="passport_created",
            data=passport_data,
            timestamp=datetime.now().isoformat(),
            source="agb_platform"
        )
        
        # Отправляем в фоновом режиме
        background_tasks.add_task(send_to_n8n_webhook, webhook_data)
        
        return BaseResponseModel(
            success=True,
            message="Событие отправлено в n8n"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки события: {str(e)}")

@router.post("/events/user-registered")
async def handle_user_registered_event(
    user_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обработка события регистрации пользователя"""
    try:
        webhook_data = N8NWebhookData(
            event_type="user_registered",
            data=user_data,
            timestamp=datetime.now().isoformat(),
            source="agb_platform"
        )
        
        background_tasks.add_task(send_to_n8n_webhook, webhook_data)
        
        return BaseResponseModel(
            success=True,
            message="Событие отправлено в n8n"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки события: {str(e)}")

@router.post("/events/request-created")
async def handle_request_created_event(
    request_data: Dict[str, Any],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Обработка события создания заявки"""
    try:
        webhook_data = N8NWebhookData(
            event_type="request_created",
            data=request_data,
            timestamp=datetime.now().isoformat(),
            source="agb_platform"
        )
        
        background_tasks.add_task(send_to_n8n_webhook, webhook_data)
        
        return BaseResponseModel(
            success=True,
            message="Событие отправлено в n8n"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка обработки события: {str(e)}")

async def send_to_n8n_webhook(webhook_data: N8NWebhookData):
    """Фоновая задача для отправки данных в n8n"""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{N8N_WEBHOOK_BASE_URL}/agb-platform",
                json=webhook_data.dict(),
                timeout=30.0
            )
    except Exception as e:
        print(f"Ошибка отправки в n8n: {e}")

@router.get("/executions", response_model=BaseResponseModel)
async def get_n8n_executions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение списка выполнений n8n"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        n8n_api_key = "your-n8n-api-key"  # TODO: добавить в переменные окружения
        
        async with httpx.AsyncClient() as client:
            headers = {"X-N8N-API-KEY": n8n_api_key}
            
            response = await client.get(
                f"{N8N_BASE_URL}/api/v1/executions",
                headers=headers,
                timeout=30.0
            )
            
            if response.status_code >= 400:
                raise HTTPException(
                    status_code=500,
                    detail=f"Ошибка получения выполнений: {response.text}"
                )
            
            executions = response.json()
            
            return BaseResponseModel(
                success=True,
                message="Выполнения получены",
                data={
                    "executions": executions,
                    "count": len(executions)
                }
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Таймаут при получении выполнений")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения выполнений: {str(e)}")

@router.get("/stats", response_model=BaseResponseModel)
async def get_n8n_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение статистики n8n"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        n8n_api_key = "your-n8n-api-key"  # TODO: добавить в переменные окружения
        
        async with httpx.AsyncClient() as client:
            headers = {"X-N8N-API-KEY": n8n_api_key}
            
            # Получаем workflows
            workflows_response = await client.get(
                f"{N8N_BASE_URL}/api/v1/workflows",
                headers=headers,
                timeout=30.0
            )
            
            # Получаем executions
            executions_response = await client.get(
                f"{N8N_BASE_URL}/api/v1/executions",
                headers=headers,
                timeout=30.0
            )
            
            if workflows_response.status_code >= 400 or executions_response.status_code >= 400:
                raise HTTPException(
                    status_code=500,
                    detail="Ошибка получения статистики"
                )
            
            workflows = workflows_response.json()
            executions = executions_response.json()
            
            # Подсчитываем статистику
            total_workflows = len(workflows)
            active_workflows = len([w for w in workflows if w.get('active', False)])
            total_executions = len(executions)
            
            # Подсчитываем успешные выполнения
            successful_executions = len([e for e in executions if e.get('finished', False) and e.get('data', {}).get('resultData', {}).get('runData', {}).get('error') is None])
            success_rate = (successful_executions / total_executions * 100) if total_executions > 0 else 0
            
            return BaseResponseModel(
                success=True,
                message="Статистика получена",
                data={
                    "workflows": total_workflows,
                    "activeWorkflows": active_workflows,
                    "executions": total_executions,
                    "successRate": round(success_rate, 2)
                }
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Таймаут при получении статистики")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения статистики: {str(e)}")

@router.post("/workflows/{workflow_id}/toggle", response_model=BaseResponseModel)
async def toggle_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Переключение статуса workflow"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        n8n_api_key = "your-n8n-api-key"  # TODO: добавить в переменные окружения
        
        async with httpx.AsyncClient() as client:
            headers = {
                "X-N8N-API-KEY": n8n_api_key,
                "Content-Type": "application/json"
            }
            
            # Получаем текущий workflow
            get_response = await client.get(
                f"{N8N_BASE_URL}/api/v1/workflows/{workflow_id}",
                headers=headers,
                timeout=30.0
            )
            
            if get_response.status_code >= 400:
                raise HTTPException(
                    status_code=500,
                    detail=f"Ошибка получения workflow: {get_response.text}"
                )
            
            workflow_data = get_response.json()
            current_active = workflow_data.get('active', False)
            
            # Обновляем статус
            update_response = await client.put(
                f"{N8N_BASE_URL}/api/v1/workflows/{workflow_id}",
                headers=headers,
                json={**workflow_data, "active": not current_active},
                timeout=30.0
            )
            
            if update_response.status_code >= 400:
                raise HTTPException(
                    status_code=500,
                    detail=f"Ошибка обновления workflow: {update_response.text}"
                )
            
            return BaseResponseModel(
                success=True,
                message=f"Workflow {'активирован' if not current_active else 'деактивирован'}",
                data={"active": not current_active}
            )
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Таймаут при переключении workflow")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка переключения workflow: {str(e)}")

@router.get("/health", response_model=BaseResponseModel)
async def check_n8n_health():
    """Проверка доступности n8n"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{N8N_BASE_URL}/healthz",
                timeout=10.0
            )
            
            if response.status_code == 200:
                return BaseResponseModel(
                    success=True,
                    message="n8n доступен",
                    data={"status": "healthy"}
                )
            else:
                return BaseResponseModel(
                    success=False,
                    message="n8n недоступен",
                    data={"status": "unhealthy"}
                )
                
    except Exception as e:
        return BaseResponseModel(
            success=False,
            message=f"Ошибка проверки n8n: {str(e)}",
            data={"status": "error"}
        )
