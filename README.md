# AGB Project - Корпоративная платформа Алмазгеобур

Корпоративная платформа для компании ООО «Алмазгеобур» - производителя бурового оборудования и запасных частей для всех видов горных работ.

## 🚀 Быстрый старт

### Локальное тестирование

```bash
# Клонирование репозитория
git clone <your-repo-url>
cd agb_proj

# Запуск тестового окружения
chmod +x test-deploy.sh
./test-deploy.sh

# Остановка тестового окружения
./test-deploy.sh stop
```

### Деплой на продакшн сервер

```bash
# Настройка переменных окружения
cp env.example .env
# Отредактируйте .env файл

# Запуск деплоя
chmod +x deploy.sh
./deploy.sh
```

## 🏗️ Архитектура проекта

- **Backend**: FastAPI (Python 3.11)
- **Frontend**: Next.js 14 (React)
- **Database**: PostgreSQL 15
- **Reverse Proxy**: Nginx
- **Containerization**: Docker + Docker Compose

## 📁 Структура проекта

```
agb_proj/
├── backend/           # FastAPI бекенд
│   ├── models.py      # Модели базы данных
│   ├── routers/       # API роутеры
│   ├── schemas.py     # Pydantic схемы
│   └── migrations/    # SQL миграции
├── frontend/          # Next.js фронтенд
│   ├── app/           # App Router
│   ├── components/    # React компоненты
│   └── utils/         # Утилиты
├── nginx/             # Nginx конфигурация
├── docker-compose.yml # Docker Compose
├── deploy.sh          # Скрипт деплоя
└── test-deploy.sh     # Скрипт тестирования
```

## 🌐 Доступные URL

- **Frontend**: http://localhost (или IP сервера)
- **Backend API**: http://localhost/api
- **Health Check**: http://localhost/health
- **PostgreSQL**: localhost:15432 (локально) / postgres:5432 (в контейнерах)

## 🔧 Управление сервисами

### Основные команды

```bash
# Статус сервисов
./deploy.sh status

# Просмотр логов
./deploy.sh logs

# Перезапуск
./deploy.sh restart

# Остановка
./deploy.sh stop

# Полная очистка
./deploy.sh clean
```

### Docker Compose команды

```bash
# Запуск
docker-compose up -d

# Остановка
docker-compose down

# Логи
docker-compose logs -f [service_name]

# Пересборка
docker-compose up -d --build
```

## 📊 Мониторинг

Все сервисы имеют встроенные health checks:

- **PostgreSQL**: `pg_isready`
- **Backend**: `/api/health` endpoint
- **Frontend**: HTTP endpoint `/`
- **Nginx**: `/health` endpoint

## 🔒 Безопасность

### Переменные окружения

Создайте файл `.env` на основе `env.example`:

```bash
# База данных
POSTGRES_DB=agb_felix
POSTGRES_USER=felix_user
POSTGRES_PASSWORD=your-secure-password

# Backend
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend
NEXT_PUBLIC_API_URL=http://your-domain/api
```

### SSL сертификаты

Для настройки HTTPS:

1. Поместите SSL сертификаты в папку `ssl/`
2. Раскомментируйте HTTPS секцию в `nginx/nginx.conf`
3. Перезапустите nginx

## 📈 Масштабирование

### Горизонтальное масштабирование

```bash
# Масштабирование бекенда
docker-compose up -d --scale backend=3

# Масштабирование фронтенда
docker-compose up -d --scale frontend=2
```

### Load Balancing

Nginx автоматически распределяет нагрузку между несколькими экземплярами сервисов.

## 🗄️ База данных

### Миграции

Миграции применяются автоматически при запуске бекенда.

### Резервное копирование

```bash
# Создание бэкапа
docker-compose exec postgres pg_dump -U felix_user agb_felix > backup.sql

# Восстановление
docker-compose exec -T postgres psql -U felix_user -d agb_felix < backup.sql
```

## 🐛 Устранение неполадок

### Проблемы с бекендом

```bash
# Проверка логов
docker-compose logs backend

# Проверка статуса
curl http://localhost/api/health

# Перезапуск
docker-compose restart backend
```

### Проблемы с фронтендом

```bash
# Проверка логов
docker-compose logs frontend

# Проверка статуса
curl http://localhost

# Перезапуск
docker-compose restart frontend
```

### Проблемы с базой данных

```bash
# Проверка статуса
docker-compose exec postgres pg_isready -U felix_user -d agb_felix

# Проверка логов
docker-compose logs postgres
```

## 📝 Логи

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
docker-compose logs -f postgres
```

## 🔄 Обновление

```bash
# Остановка сервисов
./deploy.sh stop

# Обновление кода
git pull origin main

# Пересборка и запуск
./deploy.sh
```

## 📚 Дополнительная документация

- [DEPLOYMENT.md](DEPLOYMENT.md) - Подробная инструкция по деплою
- [CHANGELOG.md](CHANGELOG.md) - История изменений
- [RELEASE_NOTES.md](RELEASE_NOTES.md) - Заметки о релизах

## 🤝 Поддержка

При возникновении проблем:

1. Проверьте логи сервисов
2. Убедитесь, что все порты свободны
3. Проверьте права доступа к файлам
4. Убедитесь, что Docker и Docker Compose работают корректно

## 📄 Лицензия

Проект разработан для ООО «Алмазгеобур».
