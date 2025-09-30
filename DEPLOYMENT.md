# 🚀 AGB Project - Руководство по деплою

## 📋 Быстрый деплой

### 1. Подготовка сервера

```bash
# Установка Docker и Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Клонирование проекта

```bash
git clone <your-repo-url>
cd agb_proj
```

### 3. Автоматический деплой

```bash
# Деплой на localhost (для тестирования)
./quick-deploy.sh localhost myadminpassword

# Деплой на домен
./quick-deploy.sh yourdomain.com myadminpassword
```

## 🔧 Ручной деплой

### 1. Создание production.env

```bash
cp config/env/production.env.example config/env/production.env
```

Отредактируйте `config/env/production.env`:
- Измените `SECRET_KEY` на случайную строку
- Измените `ADMIN_PASSWORD` на безопасный пароль
- Укажите ваш домен в `NEXT_PUBLIC_API_URL`
- Настройте CORS для вашего домена

### 2. Запуск сервисов

```bash
# Остановка существующих контейнеров
docker-compose -f config/docker/docker-compose.prod.yml down

# Сборка и запуск
docker-compose -f config/docker/docker-compose.prod.yml up -d --build
```

### 3. Проверка статуса

```bash
# Статус сервисов
docker-compose -f config/docker/docker-compose.prod.yml ps

# Логи
docker-compose -f config/docker/docker-compose.prod.yml logs -f
```

## 🌐 Настройка домена и SSL

### 1. Настройка Nginx

Отредактируйте `infrastructure/nginx/nginx.prod.conf`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL сертификаты
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # Остальная конфигурация...
}
```

### 2. SSL сертификаты

```bash
# Создание папки для SSL
mkdir -p infrastructure/ssl

# Let's Encrypt (рекомендуется)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem infrastructure/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem infrastructure/ssl/key.pem
sudo chown $USER:$USER infrastructure/ssl/*
```

## 📊 Мониторинг

### 1. Проверка здоровья

```bash
# Проверка всех сервисов
curl -f https://yourdomain.com/api/health

# Проверка фронтенда
curl -f https://yourdomain.com

# Проверка n8n
curl -f https://yourdomain.com/n8n
```

### 2. Логи

```bash
# Все логи
docker-compose -f config/docker/docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker-compose -f config/docker/docker-compose.prod.yml logs -f backend
docker-compose -f config/docker/docker-compose.prod.yml logs -f frontend
```

### 3. Мониторинг ресурсов

```bash
# Использование ресурсов
docker stats

# Место на диске
docker system df
```

## 🔄 Обновление

### 1. Обновление кода

```bash
# Получение обновлений
git pull origin main

# Пересборка и перезапуск
docker-compose -f config/docker/docker-compose.prod.yml up -d --build
```

### 2. Обновление только фронтенда

```bash
docker-compose -f config/docker/docker-compose.prod.yml up -d --build frontend
```

### 3. Обновление только бэкенда

```bash
docker-compose -f config/docker/docker-compose.prod.yml up -d --build backend
```

## 🛠️ Обслуживание

### 1. Резервное копирование

```bash
# Создание резервной копии БД
docker exec agb_postgres_prod pg_dump -U felix_prod_user agb_felix_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из резервной копии
docker exec -i agb_postgres_prod psql -U felix_prod_user agb_felix_prod < backup.sql
```

### 2. Очистка

```bash
# Очистка неиспользуемых ресурсов
docker system prune -f

# Очистка volumes (ОСТОРОЖНО!)
docker volume prune -f
```

### 3. Перезапуск сервисов

```bash
# Перезапуск всех сервисов
docker-compose -f config/docker/docker-compose.prod.yml restart

# Перезапуск конкретного сервиса
docker-compose -f config/docker/docker-compose.prod.yml restart backend
```

## 🆘 Решение проблем

### 1. Сервис не запускается

```bash
# Проверка логов
docker-compose -f config/docker/docker-compose.prod.yml logs service_name

# Проверка конфигурации
docker-compose -f config/docker/docker-compose.prod.yml config
```

### 2. Проблемы с базой данных

```bash
# Проверка подключения к БД
docker exec agb_postgres_prod pg_isready -U felix_prod_user

# Вход в БД
docker exec -it agb_postgres_prod psql -U felix_prod_user agb_felix_prod
```

### 3. Проблемы с фронтендом

```bash
# Проверка сборки фронтенда
docker logs agb_frontend_prod

# Пересборка фронтенда
docker-compose -f config/docker/docker-compose.prod.yml up -d --build frontend
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose -f config/docker/docker-compose.prod.yml logs -f`
2. Проверьте статус: `docker-compose -f config/docker/docker-compose.prod.yml ps`
3. Проверьте конфигурацию: `docker-compose -f config/docker/docker-compose.prod.yml config`
4. Очистите систему: `docker system prune -f`

## 🎉 Готово!

Ваша система AGB развернута и готова к работе!

**Доступ:**
- Frontend: https://yourdomain.com
- API: https://yourdomain.com/api
- API Docs: https://yourdomain.com/api/docs
- n8n: https://yourdomain.com/n8n

**Учетные данные:**
- Администратор: admin / [ваш пароль]
