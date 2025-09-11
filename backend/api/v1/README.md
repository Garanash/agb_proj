# API v1 - Лучшие практики организации

## 📁 Структура API v1

```
api/v1/
├── __init__.py              # Инициализация пакета
├── router.py                # Основной роутер API v1
├── dependencies.py          # Общие зависимости
├── schemas.py              # Общие схемы данных
├── middleware.py           # Middleware и обработчики
├── validation.py           # Валидация и проверки
├── documentation.py        # Документация API
├── info.py                # Информация о версии
├── endpoints/              # Роутеры по доменам
│   ├── __init__.py
│   ├── auth.py
│   ├── users.py
│   └── ...
└── domains/               # Группировка по доменам (будущее)
    ├── auth/
    ├── users/
    └── ...
```

## 🎯 Принципы организации

### 1. **Версионирование API**
- ✅ Каждая версия в отдельной папке
- ✅ Обратная совместимость
- ✅ Плавная миграция между версиями

### 2. **Разделение по доменам**
- 🔐 **Аутентификация**: auth, users, roles
- 🏢 **Организация**: departments, company_employees, team
- 🔄 **Процессы**: contractors, customers, repair_requests, ved_passports
- 📰 **Контент**: news, events
- 💬 **Коммуникации**: chat, telegram

### 3. **Общие компоненты**
- **dependencies.py** - Общие зависимости (auth, permissions)
- **schemas.py** - Базовые схемы данных
- **validation.py** - Централизованная валидация
- **middleware.py** - Общие middleware

## 🔧 Middleware

### LoggingMiddleware
- Логирование всех запросов
- Измерение времени обработки
- Добавление заголовка `X-Process-Time`

### SecurityHeadersMiddleware
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### RateLimitMiddleware
- Ограничение частоты запросов
- Настраиваемые лимиты
- Заголовок `Retry-After`

### APIVersionMiddleware
- `X-API-Version: 1.0.0`
- `X-API-Status: active`

## ✅ Валидация

### EmailValidator
```python
EmailValidator.validate_or_raise("user@example.com")
```

### PhoneValidator
```python
PhoneValidator.validate_or_raise("+7 (999) 123-45-67")
```

### PasswordValidator
```python
PasswordValidator.validate_or_raise("SecurePass123!")
```

### FileValidator
```python
FileValidator.validate_file("document.pdf", 1024*1024, "document")
```

## 📊 Мониторинг

### Эндпоинты
- `/api/v1/health` - Проверка здоровья
- `/api/v1/info` - Информация о версии
- `/api/v1/stats` - Статистика использования
- `/api/v1/ping` - Простая проверка

### Документация
- `/api/v1/docs` - Полная документация
- `/api/v1/domains` - Информация о доменах
- `/api/v1/status-codes` - Справочник статус кодов
- `/api/v1/examples` - Примеры запросов

## 🚀 Использование

### Создание нового роутера
```python
from fastapi import APIRouter
from ..dependencies import get_current_active_user
from ..schemas import APIResponse

router = APIRouter()

@router.get("/", response_model=APIResponse)
async def get_items(current_user=Depends(get_current_active_user)):
    return APIResponse(
        success=True,
        message="Список элементов",
        data={"items": []}
    )
```

### Добавление в основной роутер
```python
from .endpoints import new_router

api_router.include_router(
    new_router, 
    prefix="/new-endpoint", 
    tags=["🆕 Новый функционал"]
)
```

## 📈 Метрики качества

- ✅ **Покрытие тестами**: >80%
- ✅ **Время ответа**: <200ms
- ✅ **Доступность**: >99.9%
- ✅ **Документация**: 100% эндпоинтов
- ✅ **Валидация**: Все входные данные
- ✅ **Безопасность**: Все заголовки безопасности

## 🔄 Миграция на v2

При создании API v2:
1. Скопировать структуру v1
2. Обновить версию в метаданных
3. Добавить новые эндпоинты
4. Сохранить обратную совместимость
5. Обновить документацию
