# 🏢 AGB - Алмазгеобур Platform

Корпоративная платформа для компании Алмазгеобур с функциями управления пользователями, сопоставления статей, ВЭД паспортов, чата и автоматизации.

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Клонируем репозиторий
git clone <repository-url>
cd agb_proj

# Запускаем локальную разработку
./docker-compose.dev.yml up -d
```

### Продакшн деплой

```bash
# Создаем конфигурацию
./create-env.sh

# Запускаем продакшн
./scripts/production/deploy-production.sh
```

## 📋 Основные функции

- **👥 Управление пользователями** - роли, отделы, права доступа
- **🔍 Сопоставление статей** - поиск и сопоставление товаров
- **📋 ВЭД паспорта** - управление таможенными документами
- **💬 Рабочий чат** - внутренняя коммуникация
- **🔄 Автоматизация** - интеграция с N8N
- **📊 Админ панель** - управление системой

## 🏗️ Архитектура

### Продакшн архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Docker        │
│   (Next.js)     │    │   (FastAPI)     │    │   Services      │
│   Port: 3000    │    │   Port: 8000    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Nginx        │
                    │  (Reverse Proxy) │
                    │   Port: 80/443   │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │      N8N        │
│   Port: 5432    │    │   Port: 6379    │    │   Port: 5678    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Технологии

### Backend
- **FastAPI** - веб-фреймворк
- **SQLAlchemy** - ORM
- **PostgreSQL** - база данных
- **Redis** - кэширование
- **Alembic** - миграции

### Frontend
- **Next.js** - React фреймворк
- **TypeScript** - типизация
- **Tailwind CSS** - стилизация
- **Axios** - HTTP клиент

### DevOps
- **Docker** - контейнеризация
- **Nginx** - reverse proxy
- **N8N** - автоматизация

## 📁 Структура проекта

```
agb_proj/
├── backend/                 # Backend приложение
│   ├── api/                # API endpoints
│   ├── models.py          # Модели базы данных
│   ├── main.py            # Точка входа
│   └── requirements.txt   # Python зависимости
├── frontend/               # Frontend приложение
│   ├── app/               # Next.js страницы
│   ├── components/        # React компоненты
│   ├── src/               # Исходный код
│   └── package.json       # Node.js зависимости
├── infrastructure/         # Инфраструктура
│   ├── nginx/             # Nginx конфигурация
│   └── postgres/          # PostgreSQL настройки
├── scripts/               # Скрипты
│   └── production/        # Продакшн скрипты
├── archive/               # Архивные файлы
│   ├── docs/              # Документация
│   └── scripts/           # Старые скрипты
├── docker-compose.production.yml  # Продакшн конфигурация
├── create-env.sh          # Генератор .env файла
└── DEPLOYMENT.md          # Документация по деплою
```

## 🔧 Настройка

### Переменные окружения

Создайте `.env.production` файл:

```bash
# Запустите генератор
./create-env.sh

# Отредактируйте конфигурацию
nano .env.production
```

Основные переменные:
- `POSTGRES_*` - настройки базы данных
- `REDIS_*` - настройки Redis
- `JWT_SECRET_KEY` - секретный ключ JWT
- `POLZA_API_KEY` - API ключ для поиска
- `N8N_*` - настройки N8N

## 🚀 Деплой

### Автоматический деплой

```bash
# Запуск всех сервисов
./scripts/production/deploy-production.sh

# Запуск backend
./scripts/production/start-backend.sh

# Запуск frontend
./scripts/production/start-frontend.sh
```

### Ручной деплой

```bash
# Docker сервисы
docker-compose -f docker-compose.production.yml up -d

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python3 main.py

# Frontend
cd frontend
npm install
npm run build
npm start
```

## 📊 Мониторинг

```bash
# Статус сервисов
docker-compose -f docker-compose.production.yml ps

# Логи
docker-compose -f docker-compose.production.yml logs -f

# Health check
curl http://localhost/health
```

## 🔒 Безопасность

- Все пароли генерируются автоматически
- JWT токены с ограниченным временем жизни
- Rate limiting для API
- CORS настройки
- Security headers в Nginx

## 📚 Документация

- [DEPLOYMENT.md](DEPLOYMENT.md) - Подробная документация по деплою
- [archive/docs/](archive/docs/) - Архивная документация

## 🤝 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose logs -f`
2. Убедитесь в правильности `.env.production`
3. Проверьте доступность портов
4. Убедитесь, что Docker сервисы запущены

## 📄 Лицензия

Проект разработан для компании Алмазгеобур.
