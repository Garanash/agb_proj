"""
API v1 - Wiki эндпоинты
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from pydantic import BaseModel

from database import get_db
from models import User
from .auth import get_current_user

router = APIRouter()

class WikiSection(BaseModel):
    id: str
    title: str
    description: str
    content: Dict[str, Any]

class WikiResponse(BaseModel):
    sections: List[WikiSection]
    user_role: str

@router.get("/sections", response_model=WikiResponse)
async def get_wiki_sections(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение разделов Wiki для текущего пользователя"""
    
    # Проверяем доступ к Wiki (исключаем заказчиков и исполнителей)
    if current_user.role in ['customer', 'contractor']:
        raise HTTPException(
            status_code=403, 
            detail="Доступ к Wiki ограничен для вашей роли"
        )
    
    # Определяем доступные разделы в зависимости от роли
    sections = [
        {
            "id": "usage",
            "title": "Как пользоваться платформой",
            "description": "Подробное руководство по работе с системой",
            "content": {
                "role_specific_info": get_role_specific_info(current_user.role),
                "features": get_available_features(current_user.role)
            }
        },
        {
            "id": "demo",
            "title": "Демо работы",
            "description": "Интерактивные примеры использования функций",
            "content": {
                "demos": get_available_demos(current_user.role)
            }
        },
        {
            "id": "faq",
            "title": "Часто задаваемые вопросы",
            "description": "Ответы на популярные вопросы пользователей",
            "content": {
                "questions": get_faq_by_role(current_user.role)
            }
        },
        {
            "id": "processes",
            "title": "Схемы бизнес-процессов",
            "description": "Визуальные схемы рабочих процессов",
            "content": {
                "processes": get_processes_by_role(current_user.role)
            }
        }
    ]
    
    return WikiResponse(
        sections=[WikiSection(**section) for section in sections],
        user_role=current_user.role
    )

@router.get("/content/{section_id}")
async def get_wiki_content(
    section_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Получение контента конкретного раздела Wiki"""
    
    # Проверяем доступ к Wiki
    if current_user.role in ['customer', 'contractor']:
        raise HTTPException(
            status_code=403, 
            detail="Доступ к Wiki ограничен для вашей роли"
        )
    
    # Возвращаем контент в зависимости от раздела
    if section_id == "usage":
        return {
            "role_specific_info": get_role_specific_info(current_user.role),
            "features": get_available_features(current_user.role),
            "tutorials": get_tutorials_by_role(current_user.role)
        }
    elif section_id == "demo":
        return {
            "demos": get_available_demos(current_user.role),
            "interactive_examples": get_interactive_examples(current_user.role)
        }
    elif section_id == "faq":
        return {
            "questions": get_faq_by_role(current_user.role),
            "troubleshooting": get_troubleshooting_guide(current_user.role)
        }
    elif section_id == "processes":
        return {
            "processes": get_processes_by_role(current_user.role),
            "workflows": get_workflows_by_role(current_user.role)
        }
    else:
        raise HTTPException(status_code=404, detail="Раздел не найден")

def get_role_specific_info(role: str) -> Dict[str, Any]:
    """Получение информации, специфичной для роли"""
    role_info = {
        "admin": {
            "description": "Полный доступ ко всем функциям системы",
            "key_responsibilities": [
                "Управление пользователями и ролями",
                "Настройка системных параметров",
                "Мониторинг работы системы",
                "Создание и управление отчетами"
            ],
            "quick_actions": [
                "Управление пользователями",
                "Системные настройки",
                "Просмотр аналитики",
                "Управление автоматизацией"
            ]
        },
        "manager": {
            "description": "Управление проектами и координация работы команды",
            "key_responsibilities": [
                "Планирование и контроль проектов",
                "Анализ отчетов и метрик",
                "Координация работы сотрудников",
                "Принятие управленческих решений"
            ],
            "quick_actions": [
                "Просмотр проектов",
                "Анализ отчетов",
                "Создание новостей",
                "Управление ресурсами"
            ]
        },
        "employee": {
            "description": "Выполнение рабочих задач и участие в проектах",
            "key_responsibilities": [
                "Работа с заявками и задачами",
                "Участие в рабочих процессах",
                "Взаимодействие с коллегами",
                "Обновление статусов работ"
            ],
            "quick_actions": [
                "Просмотр задач",
                "Участие в чатах",
                "Обновление профиля",
                "Работа с документами"
            ]
        },
        "ved_passport": {
            "description": "Специализированная работа с паспортами ВЭД",
            "key_responsibilities": [
                "Создание и ведение паспортов ВЭД",
                "Работа с внешнеторговой документацией",
                "Взаимодействие с таможенными органами",
                "Ведение архивов документов"
            ],
            "quick_actions": [
                "Создание паспортов ВЭД",
                "Работа с архивами",
                "Управление документами",
                "Отчетность по ВЭД"
            ]
        },
        "service_engineer": {
            "description": "Техническое обслуживание и поддержка системы",
            "key_responsibilities": [
                "Обработка технических заявок",
                "Координация с исполнителями",
                "Контроль качества работ",
                "Техническая поддержка пользователей"
            ],
            "quick_actions": [
                "Просмотр текущих заявок",
                "Управление исполнителями",
                "Контроль качества",
                "Техническая поддержка"
            ]
        }
    }
    
    return role_info.get(role, {})

def get_available_features(role: str) -> List[Dict[str, Any]]:
    """Получение доступных функций для роли"""
    features = {
        "admin": [
            {"name": "Управление пользователями", "description": "Создание, редактирование и удаление пользователей"},
            {"name": "Системные настройки", "description": "Конфигурация параметров системы"},
            {"name": "Аналитика", "description": "Просмотр детальной аналитики и отчетов"},
            {"name": "Автоматизация", "description": "Настройка автоматических процессов"},
            {"name": "Управление ботами", "description": "Создание и настройка чат-ботов"}
        ],
        "manager": [
            {"name": "Управление проектами", "description": "Планирование и контроль проектов"},
            {"name": "Отчеты", "description": "Создание и анализ отчетов"},
            {"name": "Новости", "description": "Создание и публикация новостей"},
            {"name": "Аналитика", "description": "Просмотр ключевых метрик"}
        ],
        "employee": [
            {"name": "Рабочий чат", "description": "Общение с коллегами"},
            {"name": "Профиль", "description": "Управление личной информацией"},
            {"name": "Задачи", "description": "Просмотр и выполнение задач"},
            {"name": "Документы", "description": "Работа с документами"}
        ],
        "ved_passport": [
            {"name": "Паспорта ВЭД", "description": "Создание и управление паспортами ВЭД"},
            {"name": "Архив документов", "description": "Ведение архива документов"},
            {"name": "Отчетность", "description": "Формирование отчетов по ВЭД"},
            {"name": "Документооборот", "description": "Управление документооборотом"}
        ],
        "service_engineer": [
            {"name": "Текущие заявки", "description": "Просмотр и обработка заявок"},
            {"name": "Исполнители", "description": "Управление исполнителями"},
            {"name": "Контроль качества", "description": "Контроль качества выполнения работ"},
            {"name": "Техподдержка", "description": "Оказание технической поддержки"}
        ]
    }
    
    return features.get(role, [])

def get_available_demos(role: str) -> List[Dict[str, Any]]:
    """Получение доступных демонстраций для роли"""
    demos = {
        "admin": [
            {"name": "Управление пользователями", "type": "interactive", "duration": "5 мин"},
            {"name": "Настройка системы", "type": "video", "duration": "10 мин"},
            {"name": "Аналитика и отчеты", "type": "interactive", "duration": "8 мин"}
        ],
        "manager": [
            {"name": "Создание проекта", "type": "interactive", "duration": "6 мин"},
            {"name": "Анализ отчетов", "type": "video", "duration": "7 мин"},
            {"name": "Управление ресурсами", "type": "interactive", "duration": "5 мин"}
        ],
        "employee": [
            {"name": "Работа с заявками", "type": "interactive", "duration": "4 мин"},
            {"name": "Использование чата", "type": "video", "duration": "3 мин"},
            {"name": "Обновление профиля", "type": "interactive", "duration": "2 мин"}
        ],
        "ved_passport": [
            {"name": "Создание паспорта ВЭД", "type": "interactive", "duration": "8 мин"},
            {"name": "Работа с архивами", "type": "video", "duration": "5 мин"},
            {"name": "Формирование отчетов", "type": "interactive", "duration": "6 мин"}
        ],
        "service_engineer": [
            {"name": "Обработка заявок", "type": "interactive", "duration": "6 мин"},
            {"name": "Координация с исполнителями", "type": "video", "duration": "5 мин"},
            {"name": "Контроль качества", "type": "interactive", "duration": "4 мин"}
        ]
    }
    
    return demos.get(role, [])

def get_faq_by_role(role: str) -> List[Dict[str, Any]]:
    """Получение FAQ для конкретной роли"""
    faq = {
        "admin": [
            {
                "question": "Как добавить нового пользователя?",
                "answer": "Перейдите в раздел 'Управление пользователями' → 'Добавить пользователя' и заполните необходимые поля."
            },
            {
                "question": "Как настроить права доступа?",
                "answer": "В профиле пользователя выберите соответствующую роль из выпадающего списка."
            }
        ],
        "manager": [
            {
                "question": "Как создать новый проект?",
                "answer": "В разделе 'Проекты' нажмите 'Создать проект' и заполните основную информацию."
            },
            {
                "question": "Как просмотреть отчеты?",
                "answer": "Перейдите в раздел 'Отчеты' и выберите нужный тип отчета."
            }
        ],
        "employee": [
            {
                "question": "Как обновить свой профиль?",
                "answer": "Перейдите в 'Настройки' → 'Профиль' и внесите необходимые изменения."
            },
            {
                "question": "Как участвовать в чатах?",
                "answer": "В разделе 'Рабочий чат' выберите нужную комнату и начните общение."
            }
        ],
        "ved_passport": [
            {
                "question": "Как создать паспорт ВЭД?",
                "answer": "В разделе 'Паспорта ВЭД' → 'Создание паспортов' заполните форму с данными о товаре."
            },
            {
                "question": "Как найти документ в архиве?",
                "answer": "Используйте поиск по номеру паспорта или дате создания в разделе 'Архив паспортов'."
            }
        ],
        "service_engineer": [
            {
                "question": "Как назначить исполнителя на заявку?",
                "answer": "В детальном просмотре заявки нажмите 'Назначить исполнителя' и выберите из списка."
            },
            {
                "question": "Как контролировать качество работ?",
                "answer": "Используйте раздел 'Контроль качества' для проверки выполненных работ."
            }
        ]
    }
    
    return faq.get(role, [])

def get_processes_by_role(role: str) -> List[Dict[str, Any]]:
    """Получение бизнес-процессов для роли"""
    processes = {
        "admin": [
            {
                "name": "Управление пользователями",
                "steps": ["Создание", "Назначение роли", "Активация", "Мониторинг"]
            },
            {
                "name": "Настройка системы",
                "steps": ["Конфигурация", "Тестирование", "Развертывание", "Мониторинг"]
            }
        ],
        "manager": [
            {
                "name": "Управление проектом",
                "steps": ["Планирование", "Назначение ресурсов", "Контроль", "Завершение"]
            },
            {
                "name": "Анализ отчетов",
                "steps": ["Сбор данных", "Анализ", "Интерпретация", "Принятие решений"]
            }
        ],
        "employee": [
            {
                "name": "Выполнение задачи",
                "steps": ["Получение", "Выполнение", "Отчет", "Завершение"]
            }
        ],
        "ved_passport": [
            {
                "name": "Создание паспорта ВЭД",
                "steps": ["Ввод данных", "Проверка", "Одобрение", "Регистрация"]
            }
        ],
        "service_engineer": [
            {
                "name": "Обработка заявки",
                "steps": ["Получение", "Анализ", "Назначение исполнителя", "Контроль", "Завершение"]
            }
        ]
    }
    
    return processes.get(role, [])

def get_tutorials_by_role(role: str) -> List[Dict[str, Any]]:
    """Получение обучающих материалов для роли"""
    return [
        {"title": f"Быстрый старт для {role}", "duration": "10 мин", "type": "video"},
        {"title": f"Основные функции для {role}", "duration": "15 мин", "type": "interactive"},
        {"title": f"Продвинутые возможности для {role}", "duration": "20 мин", "type": "video"}
    ]

def get_interactive_examples(role: str) -> List[Dict[str, Any]]:
    """Получение интерактивных примеров для роли"""
    return [
        {"name": "Симуляция рабочего процесса", "type": "simulation"},
        {"name": "Интерактивная форма", "type": "form"},
        {"name": "Пошаговый мастер", "type": "wizard"}
    ]

def get_troubleshooting_guide(role: str) -> List[Dict[str, Any]]:
    """Получение руководства по устранению неполадок для роли"""
    return [
        {"issue": "Проблемы с авторизацией", "solution": "Проверьте логин и пароль"},
        {"issue": "Медленная работа системы", "solution": "Очистите кэш браузера"},
        {"issue": "Ошибки загрузки файлов", "solution": "Проверьте размер и формат файла"}
    ]

def get_workflows_by_role(role: str) -> List[Dict[str, Any]]:
    """Получение рабочих процессов для роли"""
    return [
        {"name": "Ежедневный рабочий процесс", "steps": 5},
        {"name": "Еженедельный отчет", "steps": 3},
        {"name": "Месячный анализ", "steps": 7}
    ]
