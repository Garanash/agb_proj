#!/usr/bin/env/python3
"""Упрощенная версия роутера отделов без аутентификации"""

from fastapi import APIRouter
from typing import List

# Создаем простой роутер
simple_departments_router = APIRouter()

@simple_departments_router.get("/list")
async def get_departments():
    """Получение списка отделов (без аутентификации)"""
    return {
        "message": "Отделы получены!",
        "departments": [
            {
                "id": 1,
                "name": "Администрация",
                "description": "Административный отдел компании"
            },
            {
                "id": 2,
                "name": "Разработка",
                "description": "Отдел разработки программного обеспечения"
            },
            {
                "id": 3,
                "name": "Маркетинг",
                "description": "Отдел маркетинга и продаж"
            }
        ]
    }

@simple_departments_router.get("/{department_id}")
async def get_department(department_id: int):
    """Получение отдела по ID (без аутентификации)"""
    return {
        "message": f"Отдел {department_id} получен!",
        "department": {
            "id": department_id,
            "name": f"Отдел номер {department_id}",
            "description": f"Описание отдела {department_id}"
        }
    }

@simple_departments_router.post("/create")
async def create_department():
    """Создание отдела (без аутентификации)"""
    return {
        "message": "Отдел создан!",
        "department": {
            "id": 999,
            "name": "Новый отдел",
            "description": "Описание нового отдела"
        }
    }
