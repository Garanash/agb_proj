# 🚀 Инструкции по деплою AGB проекта на сервер

## Подготовка проекта

Проект откачен к коммиту `1a227be76f65aa5ed7564911ca72931754c812d7` и готов к деплою.

## Быстрый старт

### 1. Подготовка сервера

```bash
# Клонируем репозиторий
git clone https://github.com/Garanash/agb_proj.git
cd agb_proj

# Исправляем проблемы с зависимостями (если есть ошибки)
sudo ./scripts/production/fix-server-issues.sh

# Перезагружаем сервер
sudo reboot
```

### 2. Создание конфигурации

```bash
# Создаем .env файл
./create-env.sh

# Редактируем конфигурацию
nano .env.production
```

**Важно изменить в .env.production:**
- `POLZA_API_KEY` - ваш API ключ от Polza
- `OPENAI_API_KEY` - ваш OpenAI API ключ
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота (если используется)
- `SMTP_*` - настройки email (если используется)

### 3. Запуск сервисов

```bash
# 1. Запускаем Docker сервисы (БД, Redis, N8N, Nginx)
./scripts/production/deploy-production.sh

# 2. В отдельном терминале - Backend
./scripts/production/start-backend.sh

# 3. В отдельном терминале - Frontend
./scripts/production/start-frontend.sh
```

## Архитектура системы

- **Frontend**: http://localhost:3000 → http://localhost/
- **Backend**: http://localhost:8000 → http://localhost/api/
- **N8N**: http://localhost:5678 → http://localhost/n8n/
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Проверка работы

```bash
# Проверяем статус Docker сервисов
docker-compose -f docker-compose.production.yml ps

# Проверяем доступность
curl http://localhost/health
curl http://localhost/api/v1/auth/me
curl http://localhost/n8n/
```

## Мониторинг

```bash
# Логи всех сервисов
docker-compose -f docker-compose.production.yml logs -f

# Логи приложения
tail -f logs/backend.log
tail -f logs/frontend.log
```

## Остановка

```bash
# Остановка Docker сервисов
docker-compose -f docker-compose.production.yml down

# Остановка приложения (Ctrl+C в терминалах backend/frontend)
```

## Структура проекта

```
agb_proj/
├── backend/                 # Backend приложение (FastAPI)
├── frontend/               # Frontend приложение (Next.js)
├── scripts/production/     # Скрипты для деплоя
├── docker-compose.production.yml  # Docker конфигурация
├── create-env.sh          # Создание .env файла
└── QUICK_DEPLOY.md        # Краткая инструкция
```

## Возможные проблемы

### Ошибки зависимостей
```bash
sudo ./scripts/production/fix-server-issues.sh
sudo reboot
```

### Проблемы с PostgreSQL (пользователи не созданы)
```bash
# Быстрое исправление
./scripts/production/quick-fix-postgres.sh

# Или полное исправление
./scripts/production/fix-postgres-issues.sh
```

### Конфликт Docker сетей
```bash
docker network prune -f
docker-compose -f docker-compose.production.yml down
./scripts/production/deploy-production.sh
```

### Проблемы с правами
```bash
sudo chown -R $USER:$USER .
chmod +x scripts/production/*.sh
chmod +x create-env.sh
```

### CORS ошибки (frontend не может подключиться к backend)
```bash
# БЫСТРОЕ ИСПРАВЛЕНИЕ - пересборка frontend с правильным API URL:
./scripts/production/quick-fix-cors.sh

# ПОЛНОЕ ИСПРАВЛЕНИЕ - деплой с проверками:
./scripts/production/deploy-with-cors-fix.sh

# РУЧНОЕ ИСПРАВЛЕНИЕ:
# 1. Установите правильный NEXT_PUBLIC_API_URL:
export NEXT_PUBLIC_API_URL="http://89.23.99.86:8000/api"

# 2. Пересоберите frontend:
cd frontend
rm -rf .next
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" npm run build
NEXT_PUBLIC_API_URL="$NEXT_PUBLIC_API_URL" npm start
```

**ВАЖНО:** Переменная `NEXT_PUBLIC_API_URL` должна быть установлена **во время сборки**, а не во время выполнения!

### N8N не может подключиться к БД
```bash
# Проверьте, что PostgreSQL работает
docker exec agb_postgres pg_isready -U agb_user -d agb_db

# Если не работает, исправьте PostgreSQL
./scripts/production/quick-fix-postgres.sh
```

## Безопасность

⚠️ **ВАЖНО:**
- Не коммитьте файл `.env.production` в Git
- Измените все пароли по умолчанию
- Настройте SSL сертификаты для продакшна
- Ограничьте доступ к серверу через firewall

## Поддержка

При возникновении проблем проверьте:
1. Логи сервисов: `docker-compose -f docker-compose.production.yml logs`
2. Статус контейнеров: `docker-compose -f docker-compose.production.yml ps`
3. Подключение к БД: `docker exec agb_postgres pg_isready`
4. Подключение к Redis: `docker exec agb_redis redis-cli ping`
