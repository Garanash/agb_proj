# 🚀 AGB Production Deployment Guide

## Обзор архитектуры

В продакшн среде используется следующая архитектура:

- **Backend** (FastAPI) - запускается локально на порту 8000
- **Frontend** (Next.js) - запускается локально на порту 3000  
- **PostgreSQL** - в Docker контейнере на порту 5432
- **Redis** - в Docker контейнере на порту 6379
- **N8N** - в Docker контейнере на порту 5678
- **Nginx** - в Docker контейнере на портах 80/443 (reverse proxy)

## Быстрый старт

### 1. Подготовка сервера

```bash
# Клонируем репозиторий
git clone <repository-url>
cd agb_proj

# Создаем .env файл
./create-env.sh

# Редактируем конфигурацию
nano .env.production
```

### 2. Запуск Docker сервисов

```bash
# Запускаем инфраструктуру (БД, Redis, N8N, Nginx)
./scripts/production/deploy-production.sh
```

### 3. Запуск приложения

```bash
# В отдельном терминале - Backend
./scripts/production/start-backend.sh

# В отдельном терминале - Frontend  
./scripts/production/start-frontend.sh
```

## Детальная настройка

### Переменные окружения

Основные переменные в `.env.production`:

```bash
# База данных
POSTGRES_DB=agb_production
POSTGRES_USER=agb_user
POSTGRES_PASSWORD=<сгенерированный_пароль>

# Redis
REDIS_PASSWORD=<сгенерированный_пароль>

# N8N
N8N_USER=admin
N8N_PASSWORD=<сгенерированный_пароль>

# API ключи (ОБЯЗАТЕЛЬНО измените!)
POLZA_API_KEY=your_polza_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Роутинг

Nginx настроен для маршрутизации:

- `http://yourdomain.com/` → Frontend (порт 3000)
- `http://yourdomain.com/api/` → Backend (порт 8000)
- `http://yourdomain.com/n8n/` → N8N (порт 5678)
- `http://yourdomain.com/health` → Health check

### Мониторинг

```bash
# Просмотр логов всех сервисов
docker-compose -f docker-compose.production.yml logs -f

# Просмотр логов конкретного сервиса
docker-compose -f docker-compose.production.yml logs -f postgres
docker-compose -f docker-compose.production.yml logs -f nginx

# Статус сервисов
docker-compose -f docker-compose.production.yml ps
```

### Управление сервисами

```bash
# Остановка всех Docker сервисов
docker-compose -f docker-compose.production.yml down

# Перезапуск сервиса
docker-compose -f docker-compose.production.yml restart nginx

# Обновление образов
docker-compose -f docker-compose.production.yml pull
docker-compose -f docker-compose.production.yml up -d
```

## Безопасность

### SSL/TLS (опционально)

Для HTTPS добавьте сертификаты в `infrastructure/ssl/`:

```bash
# Структура SSL директории
infrastructure/ssl/
├── cert.pem      # Сертификат
├── key.pem       # Приватный ключ
└── chain.pem     # Цепочка сертификатов
```

### Firewall

```bash
# Открываем только необходимые порты
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS (если используется)
sudo ufw enable
```

## Резервное копирование

### База данных

```bash
# Создание бэкапа
docker exec agb_postgres pg_dump -U agb_user agb_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление
docker exec -i agb_postgres psql -U agb_user agb_production < backup_file.sql
```

### Файлы

```bash
# Бэкап загруженных файлов
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/

# Бэкап логов
tar -czf logs_backup_$(date +%Y%m%d_%H%M%S).tar.gz logs/
```

## Обновление

### Обновление кода

```bash
# Получаем последние изменения
git pull origin main

# Перезапускаем сервисы
docker-compose -f docker-compose.production.yml restart nginx
# Перезапускаем backend и frontend вручную
```

### Обновление зависимостей

```bash
# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
npm run build
```

## Устранение неполадок

### Проверка подключений

```bash
# База данных
docker exec agb_postgres pg_isready -U agb_user -d agb_production

# Redis
docker exec agb_redis redis-cli ping

# N8N
curl http://localhost:5678/healthz

# Nginx
curl http://localhost/health
```

### Логи

```bash
# Backend логи
tail -f logs/backend.log

# Frontend логи  
tail -f logs/frontend.log

# Docker логи
docker-compose -f docker-compose.production.yml logs -f
```

### Производительность

```bash
# Использование ресурсов
docker stats

# Место на диске
df -h
docker system df
```

## Автозапуск (systemd)

Создайте systemd сервисы для автозапуска:

### Backend сервис

```bash
sudo nano /etc/systemd/system/agb-backend.service
```

```ini
[Unit]
Description=AGB Backend Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/path/to/agb_proj
ExecStart=/path/to/agb_proj/scripts/production/start-backend.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Frontend сервис

```bash
sudo nano /etc/systemd/system/agb-frontend.service
```

```ini
[Unit]
Description=AGB Frontend Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/path/to/agb_proj
ExecStart=/path/to/agb_proj/scripts/production/start-frontend.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Активация сервисов

```bash
sudo systemctl daemon-reload
sudo systemctl enable agb-backend
sudo systemctl enable agb-frontend
sudo systemctl start agb-backend
sudo systemctl start agb-frontend
```

## Поддержка

При возникновении проблем:

1. Проверьте логи всех сервисов
2. Убедитесь, что все порты свободны
3. Проверьте переменные окружения
4. Убедитесь, что Docker сервисы запущены
5. Проверьте подключение к базе данных и Redis
