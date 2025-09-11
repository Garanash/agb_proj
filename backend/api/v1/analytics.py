"""
API v1 - Аналитика и метрики
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import time

from .middleware import MetricsMiddleware
from .shared.constants import APITags
from .shared.utils import create_response

router = APIRouter()

# Глобальная переменная для хранения экземпляра MetricsMiddleware
metrics_middleware: Optional[MetricsMiddleware] = None

def set_metrics_middleware(middleware: MetricsMiddleware):
    """Устанавливает экземпляр MetricsMiddleware"""
    global metrics_middleware
    metrics_middleware = middleware

@router.get("/metrics", tags=[APITags.INFO])
async def get_metrics():
    """Получить метрики API"""
    if not metrics_middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Метрики недоступны"
        )
    
    metrics = metrics_middleware.get_metrics()
    
    return create_response(
        success=True,
        message="Метрики API",
        data=metrics
    )

@router.get("/metrics/summary", tags=[APITags.INFO])
async def get_metrics_summary():
    """Получить краткую сводку метрик"""
    if not metrics_middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Метрики недоступны"
        )
    
    metrics = metrics_middleware.get_metrics()
    
    # Форматируем время работы
    uptime_hours = metrics["uptime_seconds"] / 3600
    uptime_str = f"{uptime_hours:.1f} часов" if uptime_hours >= 1 else f"{metrics['uptime_seconds']:.0f} секунд"
    
    summary = {
        "uptime": uptime_str,
        "total_requests": metrics["total_requests"],
        "success_rate": f"{metrics['success_rate']:.1f}%",
        "average_response_time": f"{metrics['average_response_time']:.3f}s",
        "requests_per_second": f"{metrics['requests_per_second']:.2f}",
        "top_endpoints": sorted(
            metrics["endpoints"].items(), 
            key=lambda x: x[1], 
            reverse=True
        )[:5],
        "status_codes": metrics["status_codes"]
    }
    
    return create_response(
        success=True,
        message="Сводка метрик API",
        data=summary
    )

@router.get("/metrics/health", tags=[APITags.INFO])
async def get_health_metrics():
    """Получить метрики здоровья API"""
    if not metrics_middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Метрики недоступны"
        )
    
    metrics = metrics_middleware.get_metrics()
    
    # Определяем статус здоровья
    health_status = "healthy"
    if metrics["success_rate"] < 95:
        health_status = "warning"
    if metrics["success_rate"] < 90:
        health_status = "critical"
    
    if metrics["average_response_time"] > 2.0:
        health_status = "warning"
    if metrics["average_response_time"] > 5.0:
        health_status = "critical"
    
    health_metrics = {
        "status": health_status,
        "success_rate": metrics["success_rate"],
        "average_response_time": metrics["average_response_time"],
        "uptime_seconds": metrics["uptime_seconds"],
        "total_requests": metrics["total_requests"],
        "failed_requests": metrics["failed_requests"],
        "timestamp": metrics["timestamp"]
    }
    
    return create_response(
        success=True,
        message="Метрики здоровья API",
        data=health_metrics
    )

@router.get("/analytics/performance", tags=[APITags.INFO])
async def get_performance_analytics():
    """Получить аналитику производительности"""
    if not metrics_middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Метрики недоступны"
        )
    
    metrics = metrics_middleware.get_metrics()
    
    # Анализируем производительность
    performance_data = {
        "response_time_analysis": {
            "average": metrics["average_response_time"],
            "status": "excellent" if metrics["average_response_time"] < 0.5 else
                     "good" if metrics["average_response_time"] < 1.0 else
                     "acceptable" if metrics["average_response_time"] < 2.0 else
                     "slow"
        },
        "throughput_analysis": {
            "requests_per_second": metrics["requests_per_second"],
            "status": "high" if metrics["requests_per_second"] > 10 else
                     "medium" if metrics["requests_per_second"] > 5 else
                     "low"
        },
        "reliability_analysis": {
            "success_rate": metrics["success_rate"],
            "status": "excellent" if metrics["success_rate"] > 99 else
                     "good" if metrics["success_rate"] > 95 else
                     "acceptable" if metrics["success_rate"] > 90 else
                     "poor"
        },
        "top_performing_endpoints": sorted(
            metrics["endpoints"].items(),
            key=lambda x: x[1],
            reverse=True
        )[:10],
        "error_analysis": {
            "total_errors": metrics["failed_requests"],
            "error_rate": (metrics["failed_requests"] / max(metrics["total_requests"], 1)) * 100,
            "status_codes": metrics["status_codes"]
        }
    }
    
    return create_response(
        success=True,
        message="Аналитика производительности API",
        data=performance_data
    )

@router.get("/analytics/usage", tags=[APITags.INFO])
async def get_usage_analytics():
    """Получить аналитику использования API"""
    if not metrics_middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Метрики недоступны"
        )
    
    metrics = metrics_middleware.get_metrics()
    
    # Анализируем использование
    usage_data = {
        "total_usage": {
            "total_requests": metrics["total_requests"],
            "uptime_hours": metrics["uptime_seconds"] / 3600,
            "requests_per_hour": metrics["total_requests"] / max(metrics["uptime_seconds"] / 3600, 1)
        },
        "endpoint_usage": {
            "most_popular": sorted(
                metrics["endpoints"].items(),
                key=lambda x: x[1],
                reverse=True
            )[:5],
            "least_popular": sorted(
                metrics["endpoints"].items(),
                key=lambda x: x[1]
            )[:5]
        },
        "method_distribution": {},
        "hourly_pattern": "Недоступно (требуется расширенная аналитика)",
        "peak_usage": {
            "requests_per_second": metrics["requests_per_second"],
            "timestamp": metrics["timestamp"]
        }
    }
    
    # Анализируем распределение по методам
    method_counts = {}
    for endpoint, count in metrics["endpoints"].items():
        method = endpoint.split()[0]
        if method not in method_counts:
            method_counts[method] = 0
        method_counts[method] += count
    
    usage_data["method_distribution"] = method_counts
    
    return create_response(
        success=True,
        message="Аналитика использования API",
        data=usage_data
    )

@router.post("/analytics/reset", tags=[APITags.INFO])
async def reset_analytics():
    """Сбросить собранную аналитику"""
    if not metrics_middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Метрики недоступны"
        )
    
    # Сбрасываем метрики
    metrics_middleware.metrics = {
        "total_requests": 0,
        "successful_requests": 0,
        "failed_requests": 0,
        "response_times": [],
        "endpoints": {},
        "status_codes": {},
        "start_time": time.time()
    }
    
    return create_response(
        success=True,
        message="Аналитика сброшена"
    )
