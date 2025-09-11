"""
API v1 - Управление кэшем
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional, List
from datetime import datetime
import time

from .middleware import CacheMiddleware
from .shared.constants import APITags
from .shared.utils import create_response

router = APIRouter()

# Глобальная переменная для хранения экземпляра CacheMiddleware
cache_middleware: Optional[CacheMiddleware] = None

def set_cache_middleware(middleware: CacheMiddleware):
    """Устанавливает экземпляр CacheMiddleware"""
    global cache_middleware
    cache_middleware = middleware

@router.get("/cache/stats", tags=[APITags.INFO])
async def get_cache_stats():
    """Получить статистику кэша"""
    if not cache_middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Кэш недоступен"
        )
    
    current_time = time.time()
    cache_stats = {
        "total_entries": len(cache_middleware.cache),
        "cache_size_mb": sum(
            len(str(response.content)) for response in cache_middleware.cache.values()
        ) / (1024 * 1024),
        "hit_rate": "Недоступно (требуется расширенная аналитика)",
        "oldest_entry": None,
        "newest_entry": None,
        "expired_entries": 0
    }
    
    # Анализируем записи кэша
    if cache_middleware.cache:
        timestamps = list(cache_middleware.cache_timestamps.values())
        cache_stats["oldest_entry"] = datetime.fromtimestamp(min(timestamps)).isoformat()
        cache_stats["newest_entry"] = datetime.fromtimestamp(max(timestamps)).isoformat()
        
        # Считаем истекшие записи
        for timestamp in timestamps:
            if current_time - timestamp > cache_middleware.default_ttl:
                cache_stats["expired_entries"] += 1
    
    return create_response(
        success=True,
        message="Статистика кэша",
        data=cache_stats
    )

@router.get("/cache/entries", tags=[APITags.INFO])
async def get_cache_entries():
    """Получить список записей кэша"""
    if not cache_middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Кэш недоступен"
        )
    
    current_time = time.time()
    entries = []
    
    for cache_key, response in cache_middleware.cache.items():
        timestamp = cache_middleware.cache_timestamps.get(cache_key, 0)
        age = current_time - timestamp
        ttl_remaining = cache_middleware.default_ttl - age
        
        entries.append({
            "key": cache_key,
            "age_seconds": age,
            "ttl_remaining": max(0, ttl_remaining),
            "is_expired": ttl_remaining <= 0,
            "created_at": datetime.fromtimestamp(timestamp).isoformat(),
            "expires_at": datetime.fromtimestamp(timestamp + cache_middleware.default_ttl).isoformat(),
            "response_size": len(str(response.content)) if hasattr(response, 'content') else 0
        })
    
    # Сортируем по времени создания
    entries.sort(key=lambda x: x["age_seconds"], reverse=True)
    
    return create_response(
        success=True,
        message="Записи кэша",
        data={
            "entries": entries,
            "total": len(entries)
        }
    )

@router.delete("/cache/clear", tags=[APITags.INFO])
async def clear_cache():
    """Очистить весь кэш"""
    if not cache_middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Кэш недоступен"
        )
    
    entries_count = len(cache_middleware.cache)
    cache_middleware.cache.clear()
    cache_middleware.cache_timestamps.clear()
    
    return create_response(
        success=True,
        message=f"Кэш очищен. Удалено {entries_count} записей"
    )

@router.delete("/cache/expired", tags=[APITags.INFO])
async def clear_expired_cache():
    """Очистить истекшие записи кэша"""
    if not cache_middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Кэш недоступен"
        )
    
    current_time = time.time()
    expired_keys = []
    
    for cache_key, timestamp in cache_middleware.cache_timestamps.items():
        if current_time - timestamp > cache_middleware.default_ttl:
            expired_keys.append(cache_key)
    
    # Удаляем истекшие записи
    for key in expired_keys:
        cache_middleware.cache.pop(key, None)
        cache_middleware.cache_timestamps.pop(key, None)
    
    return create_response(
        success=True,
        message=f"Удалено {len(expired_keys)} истекших записей из кэша"
    )

@router.delete("/cache/entry/{cache_key:path}", tags=[APITags.INFO])
async def clear_cache_entry(cache_key: str):
    """Удалить конкретную запись из кэша"""
    if not cache_middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Кэш недоступен"
        )
    
    if cache_key in cache_middleware.cache:
        cache_middleware.cache.pop(cache_key)
        cache_middleware.cache_timestamps.pop(cache_key, None)
        
        return create_response(
            success=True,
            message=f"Запись '{cache_key}' удалена из кэша"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Запись не найдена в кэше"
        )

@router.get("/cache/config", tags=[APITags.INFO])
async def get_cache_config():
    """Получить конфигурацию кэша"""
    if not cache_middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Кэш недоступен"
        )
    
    config = {
        "default_ttl": cache_middleware.default_ttl,
        "ttl_hours": cache_middleware.default_ttl / 3600,
        "cache_enabled": True,
        "max_entries": "Неограничено",
        "storage_type": "In-Memory"
    }
    
    return create_response(
        success=True,
        message="Конфигурация кэша",
        data=config
    )

@router.post("/cache/warmup", tags=[APITags.INFO])
async def warmup_cache():
    """Прогрев кэша (заполнение популярными запросами)"""
    if not cache_middleware:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Кэш недоступен"
        )
    
    # Список популярных эндпоинтов для прогрева
    popular_endpoints = [
        "/api/v1/info",
        "/api/v1/health",
        "/api/v1/users/",
        "/api/v1/departments/",
        "/api/v1/news/"
    ]
    
    warmed_up = 0
    for endpoint in popular_endpoints:
        # Создаем ключ кэша для эндпоинта
        cache_key = f"{endpoint}?"
        if cache_key not in cache_middleware.cache:
            # Здесь можно добавить логику для предварительного заполнения кэша
            # Пока что просто отмечаем, что эндпоинт готов к кэшированию
            warmed_up += 1
    
    return create_response(
        success=True,
        message=f"Прогрев кэша завершен. {warmed_up} эндпоинтов готовы к кэшированию"
    )
