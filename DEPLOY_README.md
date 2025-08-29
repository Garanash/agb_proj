# 🚀 Деплой приложения на сервер

## 📋 Требования

- Linux сервер с Ubuntu/Debian
- Минимум 2GB RAM, 2 CPU cores
- SSH доступ с правами root
- Доменное имя (опционально)

## 🔧 Быстрый деплой

### 1. Подготовка сервера

```bash
# Подключаемся к серверу
ssh root@37.252.20.46

# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker и Docker Compose
apt install -y docker.io docker-compose-v2 git

# Включаем Docker
systemctl enable docker && systemctl start docker
```

### 2. Клонирование и настройка

```bash
# Создаем директорию для приложения
mkdir -p /opt/agb_proj
cd /opt/agb_proj

# Клонируем репозиторий (замените на ваш)
git clone https://github.com/your-username/agb_proj.git .

# Настраиваем переменные окружения
cp env.example .env
# Отредактируйте .env по необходимости

# Делаем скрипты исполняемыми
chmod +x deploy-server.sh quick-deploy.sh init-production.sh
```

### 3. Первый запуск

```bash
# Запускаем приложение
docker-compose -f docker-compose.prod.yml up -d --build

# Или используем скрипт деплоя
./deploy-server.sh
```

### 4. Инициализация базы данных

```bash
# Запускаем инициализацию (если не запустилось автоматически)
./init-production.sh
```

## 📊 Проверка деплоя

```bash
# Проверяем статус контейнеров
docker-compose ps

# Проверяем логи
docker-compose logs

# Тестируем API
curl http://localhost/api/health
curl http://localhost/api/

# Тестируем номенклатуру ВЭД
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost/api/ved-passports/nomenclature/
```

## 🔄 Обновление приложения

```bash
# Обновляем код
git pull origin master

# Перезапускаем сервисы
docker-compose down
docker-compose up -d --build

# Или используем быстрый скрипт
./quick-deploy.sh
```

## 🛠️ Управление

```bash
# Остановить все сервисы
docker-compose down

# Запустить все сервисы
docker-compose up -d

# Перезапустить конкретный сервис
docker-compose restart backend

# Просмотр логов
docker-compose logs -f backend

# Войти в контейнер
docker-compose exec backend bash
```

## 🔒 Безопасность

1. **Измените пароли** в `.env` файле
2. **Настройте SSL** с помощью Let's Encrypt
3. **Ограничьте SSH доступ** - используйте ключи вместо паролей
4. **Настройте firewall** (ufw)
5. **Регулярно обновляйте** систему и Docker образы

## 🌐 Настройка домена

```bash
# Устанавливаем Nginx (если не установлен)
apt install -y nginx

# Создаем конфиг для домена
nano /etc/nginx/sites-available/your-domain.com

# Пример конфига:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Включаем сайт
ln -s /etc/nginx/sites-available/your-domain.com /etc/nginx/sites-enabled/
systemctl reload nginx
```

## 📞 Мониторинг

```bash
# Проверяем использование ресурсов
docker stats

# Мониторим логи
docker-compose logs -f

# Проверяем здоровье сервисов
curl http://localhost/api/health
```

## 🆘 Troubleshooting

### Проблема: PostgreSQL не запускается
```bash
# Проверьте логи
docker-compose logs postgres

# Очистите volume и перезапустите
docker-compose down -v
docker-compose up -d postgres
```

### Проблема: Backend не может подключиться к БД
```bash
# Проверьте переменные окружения
docker-compose exec backend env | grep DATABASE

# Проверьте подключение к PostgreSQL
docker-compose exec backend python -c "import asyncpg; print('OK')"
```

### Проблема: Frontend не собирается
```bash
# Очистите кеш Next.js
docker-compose exec frontend rm -rf .next

# Пересоберите
docker-compose up --build frontend
```

## 📋 Структура проекта

```
/opt/agb_proj/
├── backend/           # FastAPI приложение
├── frontend/          # Next.js приложение
├── nginx/            # Nginx конфиги
├── docker-compose.yml # Docker Compose для разработки
├── docker-compose.prod.yml # Docker Compose для продакшена
├── deploy-server.sh   # Скрипт первого деплоя
├── quick-deploy.sh    # Скрипт быстрого обновления
├── init-production.sh # Скрипт инициализации БД
└── .env              # Переменные окружения
```

## 🎯 API Endpoints

- `GET /api/health` - Проверка здоровья
- `GET /api/` - Список всех endpoints
- `GET /api/news/` - Новости
- `GET /api/ved-passports/nomenclature/` - Номенклатура ВЭД
- `POST /api/auth/login` - Авторизация

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs`
2. Проверьте статус: `docker-compose ps`
3. Проверьте ресурсы: `docker stats`
4. Проверьте сеть: `docker-compose exec backend ping postgres`
