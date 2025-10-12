# Деплой AGB проекта

## Быстрый старт

### 1. Подготовка окружения

```bash
# Клонирование репозитория
git clone <repository-url>
cd agb_proj

# Создание файла конфигурации
cp config/env/production.env.example config/env/production.env
# Отредактируйте файл config/env/production.env с вашими настройками
```

### 2. Запуск проекта

```bash
# Запуск в продакшн режиме
./deploy.sh prod up

# Запуск в режиме разработки
./deploy.sh dev up

# Только сборка образов
./deploy.sh prod build

# Просмотр логов
./deploy.sh prod logs

# Остановка сервисов
./deploy.sh prod down

# Перезапуск сервисов
./deploy.sh prod restart

# Статус сервисов
./deploy.sh prod status
```

## Структура проекта

```
agb_proj/
├── backend/                 # FastAPI бекенд
├── frontend/               # Next.js фронтенд
├── infrastructure/         # Инфраструктура (Nginx, OCR)
├── config/                 # Конфигурационные файлы
├── docs/                   # Документация
├── tests/                  # Тесты
├── docker-compose.yml      # Основная конфигурация Docker
├── docker-compose.dev.yml  # Конфигурация для разработки
├── deploy.sh              # Скрипт деплоя
└── .dockerignore          # Исключения для Docker
```

## Сервисы

### Основные сервисы
- **postgres** - База данных PostgreSQL
- **redis** - Redis для кеширования и очередей
- **backend** - FastAPI приложение
- **frontend** - Next.js приложение
- **nginx** - Веб-сервер и прокси
- **ocr** - Сервис распознавания текста

### Дополнительные сервисы
- **n8n** - Платформа автоматизации (опционально)

## Конфигурация

### Переменные окружения

Создайте файл `config/env/production.env` на основе `config/env/production.env.example`:

```env
# База данных
POSTGRES_DB=agb_felix_prod
POSTGRES_USER=felix_prod_user
POSTGRES_PASSWORD=your_secure_password
DATABASE_URL=postgresql://felix_prod_user:your_secure_password@postgres:5432/agb_felix_prod

# Безопасность
SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Администратор
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
ADMIN_EMAIL=admin@example.com
ADMIN_FIRST_NAME=Администратор
ADMIN_LAST_NAME=Системы

# API
NEXT_PUBLIC_API_URL=http://localhost/api

# Nginx
NGINX_PORT=80
NGINX_SSL_PORT=443

# n8n (опционально)
N8N_DB_NAME=n8n_prod
N8N_DB_USER=n8n_prod_user
N8N_DB_PASSWORD=your_n8n_password
N8N_USER=admin
N8N_PASSWORD=your_n8n_admin_password
```

### Порты

- **80** - HTTP (Nginx)
- **443** - HTTPS (Nginx)
- **8000** - Backend API (внутренний)
- **3000** - Frontend (внутренний)
- **5432** - PostgreSQL (внутренний)
- **6379** - Redis (внутренний)
- **8001** - OCR сервис (внутренний)
- **5678** - n8n (внутренний)

## Мониторинг

### Проверка статуса

```bash
# Статус всех сервисов
docker-compose ps

# Логи конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Использование ресурсов
docker stats
```

### Health checks

- **Backend**: `http://localhost/api/health`
- **Frontend**: `http://localhost`
- **Nginx**: `http://localhost/health`

## Обслуживание

### Обновление

```bash
# Остановка сервисов
./deploy.sh prod down

# Обновление кода
git pull

# Пересборка и запуск
./deploy.sh prod up
```

### Резервное копирование

```bash
# Резервное копирование базы данных
docker-compose exec postgres pg_dump -U felix_prod_user agb_felix_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление базы данных
docker-compose exec -T postgres psql -U felix_prod_user agb_felix_prod < backup_file.sql
```

### Очистка

```bash
# Очистка неиспользуемых ресурсов
docker system prune -f

# Очистка volumes (ОСТОРОЖНО!)
docker-compose down -v
```

## Устранение неполадок

### Проблемы с запуском

1. **Проверьте логи**:
   ```bash
   docker-compose logs -f
   ```

2. **Проверьте статус сервисов**:
   ```bash
   docker-compose ps
   ```

3. **Проверьте конфигурацию**:
   ```bash
   docker-compose config
   ```

### Проблемы с базой данных

1. **Проверьте подключение**:
   ```bash
   docker-compose exec postgres psql -U felix_prod_user -d agb_felix_prod -c "SELECT 1;"
   ```

2. **Проверьте миграции**:
   ```bash
   docker-compose exec backend alembic current
   ```

### Проблемы с сетью

1. **Проверьте сеть**:
   ```bash
   docker network ls
   docker network inspect agb_proj_app-network
   ```

2. **Пересоздайте сеть**:
   ```bash
   docker-compose down
   docker network prune -f
   docker-compose up -d
   ```

## Безопасность

### SSL сертификаты

1. Поместите SSL сертификаты в `infrastructure/ssl/`:
   - `cert.pem` - сертификат
   - `key.pem` - приватный ключ

2. Раскомментируйте HTTPS конфигурацию в `infrastructure/nginx/nginx.prod.conf`

3. Обновите переменные окружения:
   ```env
   N8N_PROTOCOL=https
   N8N_WEBHOOK_URL=https://yourdomain.com
   ```

### Firewall

```bash
# Открыть только необходимые порты
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## Производительность

### Оптимизация Docker

1. **Увеличьте лимиты**:
   ```bash
   # В /etc/docker/daemon.json
   {
     "default-ulimits": {
       "memlock": {
         "Hard": -1,
         "Name": "memlock",
         "Soft": -1
       }
     }
   }
   ```

2. **Мониторинг ресурсов**:
   ```bash
   docker stats --no-stream
   ```

### Оптимизация базы данных

1. **Настройте PostgreSQL** в `config/env/production.env`:
   ```env
   POSTGRES_INITDB_ARGS="--encoding=UTF-8 --lc-collate=C --lc-ctype=C --shared-preload-libraries=pg_stat_statements"
   ```

2. **Создайте индексы**:
   ```sql
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_agb ON matching_nomenclature(agb_article);
   CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_articles_bl ON matching_nomenclature(bl_article);
   ```