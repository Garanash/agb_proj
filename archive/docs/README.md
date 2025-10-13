# AGB Project - Система управления артикулами

## 🚀 Быстрый старт

### 1. Клонирование и настройка

```bash
# Клонирование репозитория
git clone <repository-url>
cd agb_proj

# Создание конфигурации
cp config/env/production.env.example config/env/production.env
# Отредактируйте файл config/env/production.env
```

### 2. Запуск проекта

```bash
# Полный деплой
make deploy

# Или через скрипт
./deploy.sh prod up

# Просмотр статуса
make status

# Просмотр логов
make logs
```

### 3. Доступ к приложению

- **Веб-интерфейс**: http://localhost
- **API**: http://localhost/api
- **Документация API**: http://localhost/api/docs
- **n8n (автоматизация)**: http://localhost:5678

## 📁 Структура проекта

```
agb_proj/
├── backend/                 # FastAPI бекенд
│   ├── api/                # API эндпоинты
│   ├── core/               # Основная логика
│   ├── utils/              # Утилиты
│   └── requirements.txt    # Python зависимости
├── frontend/               # Next.js фронтенд
│   ├── app/                # Страницы приложения
│   ├── components/         # React компоненты
│   └── package.json        # Node.js зависимости
├── infrastructure/         # Инфраструктура
│   ├── nginx/              # Nginx конфигурация
│   └── ocr/                # OCR сервис
├── config/                 # Конфигурационные файлы
│   ├── env/                # Переменные окружения
│   └── docker/             # Docker конфигурации
├── docs/                   # Документация
├── tests/                  # Тесты
├── docker-compose.yml      # Основная конфигурация
├── deploy.sh              # Скрипт деплоя
└── Makefile               # Команды управления
```

## 🛠 Управление проектом

### Основные команды

```bash
# Сборка и запуск
make build          # Сборка образов
make up             # Запуск сервисов
make down           # Остановка сервисов
make restart        # Перезапуск сервисов

# Мониторинг
make status         # Статус сервисов
make logs           # Просмотр логов
make monitor        # Мониторинг ресурсов
make health         # Проверка здоровья

# Тестирование
make test           # Запуск тестов
make deploy         # Полный деплой

# Очистка
make clean          # Очистка ресурсов
```

### Команды для разработки

```bash
# Режим разработки
make dev-up         # Запуск в режиме разработки
make dev-down       # Остановка режима разработки

# Логи конкретных сервисов
make logs-backend   # Логи бекенда
make logs-frontend  # Логи фронтенда
make logs-nginx     # Логи nginx
make logs-db        # Логи базы данных
```

### Управление базой данных

```bash
# Резервное копирование
make db-backup      # Создать резервную копию

# Восстановление
make db-restore FILE=backup.sql  # Восстановить из файла
```

## 🔧 Конфигурация

### Переменные окружения

Основные переменные в `config/env/production.env`:

```env
# База данных
POSTGRES_DB=agb_felix_prod
POSTGRES_USER=felix_prod_user
POSTGRES_PASSWORD=your_password

# Безопасность
SECRET_KEY=your_secret_key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password

# API
NEXT_PUBLIC_API_URL=http://localhost/api

# AI сервисы
OPENAI_API_KEY=your_openai_key
POLZA_API_KEY=your_polza_key
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

## 🐳 Docker сервисы

### Основные сервисы

- **postgres** - База данных PostgreSQL
- **redis** - Redis для кеширования
- **backend** - FastAPI приложение
- **frontend** - Next.js приложение
- **nginx** - Веб-сервер и прокси
- **ocr** - Сервис распознавания текста

### Дополнительные сервисы

- **n8n** - Платформа автоматизации (опционально)

## 🧪 Тестирование

### Запуск тестов

```bash
# Тест развертывания
make test

# Тест конкретного сервиса
python tests/test_deployment.py
```

### Проверка здоровья

```bash
# Проверка всех сервисов
make health

# Ручная проверка
curl http://localhost/health        # Nginx
curl http://localhost/api/health    # Backend
curl http://localhost/              # Frontend
```

## 📚 Документация

- [Руководство по развертыванию](DEPLOYMENT.md)
- [Функционал сопоставления артикулов](docs/ENHANCED_AI_MATCHING_FEATURE.md)
- [API документация](http://localhost/api/docs)

## 🔒 Безопасность

### SSL сертификаты

1. Поместите сертификаты в `infrastructure/ssl/`:
   - `cert.pem` - сертификат
   - `key.pem` - приватный ключ

2. Раскомментируйте HTTPS конфигурацию в `infrastructure/nginx/nginx.prod.conf`

### Firewall

```bash
# Открыть только необходимые порты
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🚨 Устранение неполадок

### Проблемы с запуском

1. **Проверьте логи**:
   ```bash
   make logs
   ```

2. **Проверьте статус**:
   ```bash
   make status
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
   make down
   docker network prune -f
   make up
   ```

## 📈 Мониторинг

### Логи

```bash
# Все логи
make logs

# Логи конкретного сервиса
make logs-backend
make logs-frontend
make logs-nginx
```

### Ресурсы

```bash
# Использование ресурсов
make monitor

# Статус сервисов
make status
```

## 🔄 Обновление

```bash
# Обновление проекта
make update

# Или вручную
git pull
make down
make build
make up
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `make logs`
2. Проверьте статус: `make status`
3. Проверьте здоровье: `make health`
4. Обратитесь к документации в папке `docs/`

## 📄 Лицензия

Проект разработан для внутреннего использования компании AGB.