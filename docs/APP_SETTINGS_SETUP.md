# Настройка приложения

## Важно! Безопасность данных

Чувствительные данные теперь хранятся в настройках приложения в базе данных, а не в .env файле.

## Настройка .env файла

Обновите ваш .env файл, оставив только нечувствительные настройки:

```env
# Local Development Environment Variables
# Только нечувствительные настройки окружения

# Application Settings
DEBUG=true
ENVIRONMENT=development
AUTO_INIT_DATA=true

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NODE_ENV=development

# Database Host (без паролей)
POSTGRES_HOST=localhost
POSTGRES_PORT=15432

# Чувствительные данные теперь хранятся в настройках приложения
# и управляются через админ-панель
```

## Инициализация настроек приложения

После первого запуска приложения выполните:

```bash
cd backend
python scripts/init_app_settings.py
```

## Управление настройками

Настройки приложения можно управлять через:
- API эндпоинты: `/api/v1/settings/app-settings/`
- Админ-панель: `/admin/settings`

## Чувствительные настройки

Следующие настройки теперь хранятся в базе данных:
- SECRET_KEY (зашифровано)
- DATABASE_URL (зашифровано)
- CORS_ORIGINS
- MAX_UPLOAD_SIZE
- ALLOWED_EXTENSIONS
- LOG_LEVEL
- ACCESS_TOKEN_EXPIRE_MINUTES
- ALGORITHM

## Безопасность

- Зашифрованные настройки автоматически расшифровываются при использовании
- Доступ к настройкам только у администраторов
- Ключи шифрования хранятся в переменных окружения
