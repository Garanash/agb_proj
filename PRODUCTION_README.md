# 🚀 AGB Production Deployment

## Быстрый старт на сервере

### 1. Подготовка сервера

```bash
# Клонируем репозиторий
git clone <your-repo-url>
cd agb_proj

# Запускаем Docker сервисы (PostgreSQL + Redis)
docker-compose -f docker-compose.local.yml up -d

# Создаем пользователя и базу данных
docker exec agb_postgres_local psql -U agb_user -d agb_prod -c "CREATE USER felix_dev_user WITH PASSWORD 'dev_password_123';"
docker exec agb_postgres_local psql -U agb_user -d agb_prod -c "CREATE DATABASE agb_felix_dev OWNER felix_dev_user;"
docker exec agb_postgres_local psql -U agb_user -d agb_prod -c "GRANT ALL PRIVILEGES ON DATABASE agb_felix_dev TO felix_dev_user;"
```

### 2. Настройка переменных окружения

Отредактируйте файл `.env.production`:

```bash
nano .env.production
```

**Обязательно измените:**
- `SECRET_KEY` - на случайную строку
- `POSTGRES_PASSWORD` - на безопасный пароль
- `ADMIN_PASSWORD` - на безопасный пароль
- `POLZA_API_KEY` - на реальный API ключ
- `OPENAI_API_KEY` - на реальный API ключ

### 3. Запуск приложения

```bash
# Запуск приложения
./start-production.sh

# Остановка приложения
./stop-server.sh
```

### 4. Проверка работы

- **Frontend**: http://your-server:3000
- **Backend API**: http://your-server:8000/api
- **Health check**: http://your-server:8000/api/health

## Структура проекта

```
agb_proj/
├── backend/                 # FastAPI backend
├── frontend/               # Next.js frontend
├── docker-compose.local.yml # Docker сервисы
├── .env.production         # Переменные окружения для продакшена
├── start-production.sh     # Скрипт запуска
└── stop-server.sh         # Скрипт остановки
```

## Мониторинг

```bash
# Логи backend
tail -f logs/backend.log

# Логи frontend
tail -f logs/frontend.log

# Статус процессов
ps aux | grep -E "(python|node)" | grep -v grep

# Статус портов
lsof -i :8000
lsof -i :3000
```

## Устранение неполадок

### Backend не запускается
1. Проверьте логи: `tail -f logs/backend.log`
2. Убедитесь, что PostgreSQL запущен: `docker ps | grep postgres`
3. Проверьте переменные окружения: `cat .env.production`

### Frontend не запускается
1. Проверьте логи: `tail -f logs/frontend.log`
2. Убедитесь, что backend работает: `curl http://localhost:8000/api/health`
3. Проверьте переменную NEXT_PUBLIC_API_URL

### База данных недоступна
1. Проверьте Docker: `docker ps | grep postgres`
2. Проверьте подключение: `docker exec agb_postgres_local pg_isready -U felix_dev_user -d agb_felix_dev`
3. Перезапустите PostgreSQL: `docker-compose -f docker-compose.local.yml restart agb-db`

## Обновление

```bash
# Получить последние изменения
git pull origin main

# Перезапустить приложение
./stop-server.sh
./start-production.sh
```

## Безопасность

- Используйте HTTPS в продакшене
- Настройте firewall (откройте только порты 80, 443, 22)
- Регулярно обновляйте зависимости
- Используйте сильные пароли
- Настройте мониторинг логов
