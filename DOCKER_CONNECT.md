# 🐳 Подключение к Docker контейнерам

## 🔍 Диагностика проблем

### Запустите диагностику:
```bash
./debug-docker.sh
```

## 🔧 Подключение к контейнерам

### 1. Backend (FastAPI)
```bash
# Подключение к bash
docker exec -it agb_backend_prod /bin/bash

# Если bash недоступен, используйте sh
docker exec -it agb_backend_prod /bin/sh

# Проверка переменных окружения
docker exec agb_backend_prod env | grep DATABASE_URL
```

### 2. Frontend (Next.js)
```bash
# Подключение к sh (в Alpine Linux)
docker exec -it agb_frontend_prod /bin/sh

# Проверка переменных окружения
docker exec agb_frontend_prod env | grep NEXT_PUBLIC_API_URL

# Проверка файлов приложения
docker exec agb_frontend_prod ls -la /app
```

### 3. PostgreSQL
```bash
# Подключение к базе данных
docker exec -it agb_postgres_prod psql -U felix_prod_user -d agb_felix_prod

# Проверка таблиц
docker exec agb_postgres_prod psql -U felix_prod_user -d agb_felix_prod -c "\dt"
```

### 4. Nginx
```bash
# Подключение к контейнеру
docker exec -it agb_nginx_prod /bin/sh

# Проверка конфигурации
docker exec agb_nginx_prod nginx -t
```

## 📊 Полезные команды

### Мониторинг логов
```bash
# Все сервисы
docker-compose -f docker-compose.prod.yml logs -f

# Конкретный сервис
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Перезапуск сервисов
```bash
# Перезапуск конкретного сервиса
docker-compose -f docker-compose.prod.yml restart frontend
docker-compose -f docker-compose.prod.yml restart backend

# Полный перезапуск
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

### Проверка статуса
```bash
# Статус контейнеров
docker ps -a

# Статус сервисов
docker-compose -f docker-compose.prod.yml ps

# Использование ресурсов
docker stats
```

## 🚨 Решение проблем

### Если контейнер не запускается:
```bash
# Проверьте логи
docker-compose -f docker-compose.prod.yml logs frontend

# Пересоберите контейнер
docker-compose -f docker-compose.prod.yml up -d --build --force-recreate frontend
```

### Если переменные окружения не работают:
```bash
# Проверьте файл production.env
cat production.env

# Проверьте переменные в контейнере
docker exec agb_frontend_prod env | grep NEXT_PUBLIC_API_URL
```

### Если проблемы с базой данных:
```bash
# Подключитесь к PostgreSQL
docker exec -it agb_postgres_prod psql -U felix_prod_user -d agb_felix_prod

# Проверьте подключение
docker exec agb_backend_prod python -c "import os; print(os.getenv('DATABASE_URL'))"
```

## 📋 Быстрые команды

```bash
# Диагностика
./debug-docker.sh

# Исправление проблем с Docker Hub
./fix-docker-limits.sh

# Полное исправление
./fix-server-complete.sh

# Мониторинг
./monitor.sh
```

## 🔍 Частые проблемы

| Проблема | Решение |
|----------|---------|
| Контейнер не запускается | `docker-compose logs [service]` |
| Переменные не работают | Проверьте `production.env` |
| База данных недоступна | `docker exec -it agb_postgres_prod psql -U felix_prod_user -d agb_felix_prod` |
| Фронтенд не собирается | `docker exec -it agb_frontend_prod /bin/sh` |
| Нет места на диске | `docker system prune -af --volumes` |
