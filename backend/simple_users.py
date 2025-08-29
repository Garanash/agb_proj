#!/usr/bin/env python3
"""Упрощенная версия роутера users без аутентификации"""

from fastapi import APIRouter
from typing import List

# Создаем простой роутер
simple_users_router = APIRouter()

@simple_users_router.get("/list")
async def get_users():
    """Получение списка пользователей (без аутентификации)"""
    return {
        "message": "Пользователи получены!",
        "users": [
            {"id": 1, "username": "admin", "first_name": "Администратор", "last_name": "Системы"},
            {"id": 2, "username": "user1", "first_name": "Пользователь", "last_name": "Один"},
            {"id": 3, "username": "user2", "first_name": "Пользователь", "last_name": "Два"}
        ]
    }

@simple_users_router.get("/{user_id}")
async def get_user(user_id: int):
    """Получение пользователя по ID (без аутентификации)"""
    return {
        "message": f"Пользователь {user_id} получен!",
        "user": {
            "id": user_id,
            "username": f"user{user_id}",
            "first_name": "Пользователь",
            "last_name": f"Номер {user_id}"
        }
    }

@simple_users_router.post("/create")
async def create_user():
    """Создание пользователя (без аутентификации)"""
    return {
        "message": "Пользователь создан!",
        "user": {
            "id": 999,
            "username": "newuser",
            "first_name": "Новый",
            "last_name": "Пользователь"
        }
    }
