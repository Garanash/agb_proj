#!/usr/bin/env python3
"""Упрощенная версия роутера новостей без аутентификации"""

from fastapi import APIRouter
from typing import List

# Создаем простой роутер
simple_news_router = APIRouter()

@simple_news_router.get("/list")
async def get_news():
    """Получение списка новостей (без аутентификации)"""
    return {
        "message": "Новости получены!",
        "news": [
            {
                "id": 1,
                "title": "Добро пожаловать в Felix!",
                "content": "Корпоративная платформа запущена",
                "category": "Общие",
                "is_published": True
            },
            {
                "id": 2,
                "title": "Новые возможности",
                "content": "Добавлены новые функции управления",
                "category": "Обновления",
                "is_published": True
            }
        ]
    }

@simple_news_router.get("/{news_id}")
async def get_news_item(news_id: int):
    """Получение новости по ID (без аутентификации)"""
    return {
        "message": f"Новость {news_id} получена!",
        "news": {
            "id": news_id,
            "title": f"Новость номер {news_id}",
            "content": f"Содержание новости {news_id}",
            "category": "Общие",
            "is_published": True
        }
    }

@simple_news_router.post("/create")
async def create_news():
    """Создание новости (без аутентификации)"""
    return {
        "message": "Новость создана!",
        "news": {
            "id": 999,
            "title": "Новая новость",
            "content": "Содержание новой новости",
            "category": "Общие",
            "is_published": True
        }
    }
