# Felix - Корпоративная платформа Алмазгеобур

## Описание

Felix - это современная корпоративная платформа для компании Алмазгеобур, предоставляющая функциональность для управления проектами, коммуникации между сотрудниками, планирования событий и ведения новостей.

## Возможности

- 👥 **Управление пользователями** - система ролей и отделов
- 📰 **Новостная лента** - публикация и управление корпоративными новостями
- 📅 **Календарь событий** - планирование и управление мероприятиями
- 💬 **Чат система** - внутренняя коммуникация между сотрудниками
- 🏢 **Управление отделами** - структурирование организационной иерархии
- 📋 **ВЭД паспорта** - управление внешнеэкономической деятельностью
- 🔐 **Система аутентификации** - безопасный вход в систему

## Технологии

### Backend
- **FastAPI** - современный веб-фреймворк для Python
- **SQLAlchemy** - ORM для работы с базой данных
- **PostgreSQL** - реляционная база данных
- **AsyncIO** - асинхронное программирование
- **Pydantic** - валидация данных

### Frontend
- **Next.js 14** - React фреймворк с App Router
- **TypeScript** - типизированный JavaScript
- **Tailwind CSS** - utility-first CSS фреймворк
- **React Hook Form** - управление формами
- **Zustand** - управление состоянием

## Требования

- Docker и Docker Compose
- Минимум 2GB RAM
- Минимум 10GB свободного места на диске

## Быстрый старт

### 1. Клонирование репозитория
```bash
git clone <repository-url>
cd agb_proj
```

### 2. Запуск приложения
```bash
# Автоматический деплой
./deploy.sh

# Или ручной запуск
docker-compose up --build -d
```

### 3. Инициализация базы данных
```bash
# Создание таблиц
docker-compose exec backend python create_tables.py

# Создание администратора
docker-compose exec backend python init_db.py
```

## Доступ к приложению

После успешного запуска:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **База данных**: localhost:5432

## Данные для входа

**Администратор по умолчанию:**
- Логин: `admin`
- Пароль: `neurofork1`

## Структура проекта

```
agb_proj/
├── backend/                 # Backend API (FastAPI)
│   ├── models.py           # Модели базы данных
│   ├── schemas.py          # Pydantic схемы
│   ├── routers/            # API роутеры
│   ├── migrations/         # SQL миграции
│   └── requirements.txt    # Python зависимости
├── frontend/               # Frontend (Next.js)
│   ├── app/                # Next.js App Router
│   ├── components/         # React компоненты
│   └── package.json        # Node.js зависимости
├── docker-compose.yml      # Docker конфигурация
├── deploy.sh               # Скрипт деплоя
└── README.md               # Документация
```

## Управление приложением

### Полезные команды Docker

```bash
# Просмотр логов
docker-compose logs -f

# Остановка приложения
docker-compose down

# Перезапуск
docker-compose restart

# Обновление и перезапуск
docker-compose up --build -d

# Просмотр статуса контейнеров
docker-compose ps
```

### Управление базой данных

```bash
# Подключение к базе данных
docker-compose exec db psql -U felix_user -d agb_felix

# Создание резервной копии
docker-compose exec db pg_dump -U felix_user agb_felix > backup.sql

# Восстановление из резервной копии
docker-compose exec -T db psql -U felix_user -d agb_felix < backup.sql
```

## Конфигурация

### Переменные окружения

Основные настройки находятся в `docker-compose.yml`:

- `POSTGRES_DB`: имя базы данных
- `POSTGRES_USER`: пользователь базы данных
- `POSTGRES_PASSWORD`: пароль базы данных
- `DATABASE_URL`: строка подключения к базе данных
- `NEXT_PUBLIC_API_URL`: URL backend API для frontend

### Изменение портов

Для изменения портов отредактируйте `docker-compose.yml`:

```yaml
ports:
  - "8080:8000"  # Изменить 8080 на нужный порт
```

## Безопасность

- Все пароли хешируются с использованием bcrypt
- JWT токены для аутентификации
- CORS настройки для защиты от межсайтовых запросов
- Валидация всех входных данных

## Мониторинг и логи

```bash
# Логи backend
docker-compose logs -f backend

# Логи frontend
docker-compose logs -f frontend

# Логи базы данных
docker-compose logs -f db
```

## Обновление приложения

```bash
# Остановка
docker-compose down

# Обновление кода
git pull origin main

# Пересборка и запуск
docker-compose up --build -d

# Инициализация обновлений БД (если необходимо)
docker-compose exec backend python create_tables.py
```

## Устранение неполадок

### Проблемы с подключением к базе данных
```bash
# Проверка статуса контейнера БД
docker-compose ps db

# Проверка логов БД
docker-compose logs db

# Перезапуск БД
docker-compose restart db
```

### Проблемы с frontend
```bash
# Очистка кэша Next.js
docker-compose exec frontend rm -rf .next

# Перезапуск frontend
docker-compose restart frontend
```

### Проблемы с backend
```bash
# Проверка зависимостей
docker-compose exec backend pip list

# Перезапуск backend
docker-compose restart backend
```

## Поддержка

При возникновении проблем:

1. Проверьте логи контейнеров
2. Убедитесь, что все порты свободны
3. Проверьте доступность Docker и Docker Compose
4. Обратитесь к документации FastAPI и Next.js

## Лицензия

Внутренний проект компании Алмазгеобур.

---

**Версия**: 1.0.0  
**Дата**: Декабрь 2024  
**Разработчик**: Команда разработки Алмазгеобур
