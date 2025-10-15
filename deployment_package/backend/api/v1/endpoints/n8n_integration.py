"""
API endpoints для интеграции с n8n
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime
import requests
import json
from pydantic import BaseModel

from database import SessionLocal
from models import User, UserRole
from .auth import get_current_user
from ..schemas import APIResponse

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

class N8NWorkflowStatus(BaseModel):
    """Статус выполнения workflow в n8n"""
    execution_id: str
    status: str
    started_at: str
    finished_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None

@router.get("/workflows", response_model=APIResponse)
def get_n8n_workflows(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка workflows из n8n"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Возвращаем моковые данные для демонстрации
        mock_workflows = [
            {
                "id": "1",
                "name": "Автоматическая обработка заявок",
                "active": True,
                "createdAt": "2024-01-15T10:00:00Z",
                "updatedAt": "2024-01-20T15:30:00Z"
            },
            {
                "id": "2", 
                "name": "Уведомления по email",
                "active": False,
                "createdAt": "2024-01-10T09:00:00Z",
                "updatedAt": "2024-01-18T12:00:00Z"
            },
            {
                "id": "3",
                "name": "Синхронизация данных",
                "active": True,
                "createdAt": "2024-01-05T14:00:00Z",
                "updatedAt": "2024-01-22T11:15:00Z"
            }
        ]
        
        return APIResponse(
            success=True,
            message="Workflows получены",
            data={"workflows": mock_workflows}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения workflows: {str(e)}")

@router.get("/executions", response_model=APIResponse)
def get_n8n_executions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка executions из n8n"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Возвращаем моковые данные для демонстрации
        mock_executions = [
            {
                "id": "exec_1",
                "workflowId": "1",
                "workflowName": "Автоматическая обработка заявок",
                "status": "success",
                "startedAt": "2024-01-22T10:30:00Z",
                "finishedAt": "2024-01-22T10:32:00Z",
                "duration": 120000
            },
            {
                "id": "exec_2",
                "workflowId": "3", 
                "workflowName": "Синхронизация данных",
                "status": "running",
                "startedAt": "2024-01-22T11:00:00Z",
                "finishedAt": None,
                "duration": None
            },
            {
                "id": "exec_3",
                "workflowId": "1",
                "workflowName": "Автоматическая обработка заявок", 
                "status": "error",
                "startedAt": "2024-01-22T09:15:00Z",
                "finishedAt": "2024-01-22T09:16:30Z",
                "duration": 90000
            }
        ]
        
        return APIResponse(
            success=True,
            message="Executions получены",
            data={"executions": mock_executions}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения executions: {str(e)}")

@router.get("/stats", response_model=APIResponse)
def get_n8n_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получение статистики n8n"""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Доступ запрещен")
    
    try:
        # Возвращаем моковые данные для демонстрации
        mock_stats = {
            "totalWorkflows": 3,
            "activeWorkflows": 2,
            "totalExecutions": 156,
            "successfulExecutions": 142,
            "failedExecutions": 14,
            "averageExecutionTime": 95000,
            "lastExecution": "2024-01-22T11:00:00Z"
        }
        
        return APIResponse(
            success=True,
            message="Статистика получена",
            data=mock_stats
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка получения статистики: {str(e)}")

@router.get("/health", response_model=APIResponse)
def check_n8n_health():
    """Проверка доступности n8n"""
    try:
        # Возвращаем моковый статус
        return APIResponse(
            success=True,
            message="n8n доступен",
            data={"status": "healthy"}
        )
                
    except Exception as e:
        return APIResponse(
            success=False,
            message=f"Ошибка проверки n8n: {str(e)}",
            data={"status": "error"}
        )