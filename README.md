# 🚀 AGB Project - Корпоративная платформа

> Современная корпоративная платформа для управления проектами, пользователями и документами

## ⚡ Быстрое развертывание

### 📋 Требования
- Docker и Docker Compose
- Минимум 4GB RAM, 20GB диск
- Linux/macOS/Windows с Docker

### 🎯 Автоматическое развертывание (1 команда)

```bash
# Клонировать и развернуть
git clone <your-repo-url>
cd agb_proj

# Развертывание для разработки
./deploy.sh dev

# Production развертывание
./deploy.sh prod

# Тестовое развертывание
./deploy.sh test
```

**Готово!** Система автоматически:
- ✅ Создает все таблицы базы данных
- ✅ Инициализирует тестовые данные
- ✅ Настраивает все сервисы
- ✅ Проверяет готовность системы

## 🏗️ Архитектура

- **Frontend**: Next.js 14 (React) с TypeScript
- **Backend**: FastAPI (Python) с async/await
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis (опционально)
- **Web Server**: Nginx
- **Container**: Docker + Docker Compose
- **Monitoring**: Watchtower (опционально)

## 📁 Структура проекта

```
agb_proj/
├── 📱 frontend/              # Next.js приложение
│   ├── src/                 # Исходный код (реорганизован)
│   │   ├── components/      # React компоненты
│   │   ├── hooks/          # Кастомные хуки
│   │   ├── contexts/       # React контексты
│   │   ├── types/          # TypeScript типы
│   │   ├── utils/          # Утилиты
│   │   └── constants/      # Константы
│   └── app/                # Next.js App Router
├── 🔧 backend/              # FastAPI приложение
│   ├── api/                # API роутеры
│   ├── core/               # Основная логика
│   ├── config/             # Конфигурации
│   └── utils/              # Утилиты
├── 🐳 config/               # Конфигурации
│   ├── docker/             # Docker Compose файлы
│   └── env/                # Переменные окружения
├── 🚀 scripts/              # Скрипты автоматизации
│   ├── deploy/             # Развертывание
│   ├── setup/              # Настройка
│   └── maintenance/        # Обслуживание
├── 🏗️ infrastructure/       # Инфраструктура
│   ├── nginx/              # Nginx конфигурации
│   └── ssl/                # SSL сертификаты
├── 📊 data/                 # Данные
│   ├── exports/            # Экспорты
│   ├── imports/            # Импорты
│   └── uploads/            # Загруженные файлы
├── 📚 docs/                 # Документация
├── 🛠️ tools/                # Инструменты
└── 📝 logs/                 # Логи
```

## 🎮 Управление системой

### Основные команды

```bash
# Развертывание
./deploy.sh dev              # Разработка
./deploy.sh prod             # Production
./deploy.sh test             # Тестирование

# Управление
./deploy.sh status           # Статус сервисов
./deploy.sh logs [service]   # Логи сервисов
./deploy.sh stop             # Остановка
./deploy.sh restart          # Перезапуск

# Обслуживание
./deploy.sh cleanup          # Очистка Docker
./deploy.sh health           # Проверка здоровья
```

### Дополнительные опции

```bash
# Свежее развертывание (с очисткой)
./deploy.sh dev --fresh

# Сборка без кэша
./deploy.sh prod --no-cache

# Подробный вывод
./deploy.sh dev --verbose
```

## 🌐 Доступ к системе

| Сервис | URL | Описание |
|--------|-----|----------|
| **Frontend** | http://localhost:3000 | Пользовательский интерфейс |
| **Backend API** | http://localhost:8000 | REST API |
| **API Docs** | http://localhost:8000/docs | Swagger документация |
| **База данных** | localhost:15432 | PostgreSQL |
| **Production** | http://localhost | Через Nginx |

## 👤 Учетные данные по умолчанию

| Роль | Логин | Пароль |
|------|-------|--------|
| Администратор | admin | admin123 |
| Тестовый пользователь | testuser | test123 |
| Заказчик | customer1 | customer123 |
| Исполнитель | contractor1 | contractor123 |
| Сервисный инженер | service_engineer | engineer123 |

⚠️ **Обязательно измените пароли в production!**

## 🔧 Разработка

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

**Новая структура компонентов:**
- `src/components/ui/` - базовые UI компоненты
- `src/components/features/` - компоненты по функциям
- `src/hooks/` - кастомные хуки
- `src/types/` - TypeScript типы

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

## 📊 Мониторинг

### Проверка здоровья

```bash
# Проверка всех сервисов
./deploy.sh health

# Логи конкретного сервиса
./deploy.sh logs frontend
./deploy.sh logs backend
./deploy.sh logs postgres
```

### Статус системы

```bash
# Статус Docker контейнеров
./deploy.sh status

# Использование ресурсов
docker stats
```

## 🆘 Решение проблем

### Частые проблемы

#### Сборка фронтенда падает
```bash
./deploy.sh cleanup
./deploy.sh dev --fresh
```

#### Проблемы с Docker Hub лимитами
```bash
docker login
./deploy.sh dev
```

#### Не хватает места
```bash
./deploy.sh cleanup
docker system prune -af --volumes
```

#### Проблемы с базой данных
```bash
./deploy.sh stop
docker volume rm agb_proj_postgres_data
./deploy.sh dev
```

### Логи и отладка

```bash
# Все логи
./deploy.sh logs

# Конкретный сервис
./deploy.sh logs backend

# Следить за логами в реальном времени
docker-compose -f config/docker/docker-compose.yml logs -f
```

## 🔒 Безопасность

### Production настройки

1. **Измените пароли** в `config/env/production.env`
2. **Настройте SSL** сертификаты в `infrastructure/ssl/`
3. **Ограничьте доступ** к базе данных
4. **Настройте брандмауэр** для портов 80/443

### Переменные окружения

Основные переменные в `config/env/production.env`:

```env
# База данных
POSTGRES_DB=agb_felix_prod
POSTGRES_USER=felix_prod_user
POSTGRES_PASSWORD=your_secure_password

# Безопасность
SECRET_KEY=your_super_secret_key
ADMIN_PASSWORD=your_admin_password

# API
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
```

## 📈 Производительность

### Рекомендуемые настройки

- **RAM**: минимум 4GB, рекомендуется 8GB+
- **CPU**: минимум 2 ядра, рекомендуется 4+
- **Диск**: SSD рекомендуется для базы данных
- **Сеть**: стабильное подключение к интернету

### Оптимизация

```bash
# Очистка неиспользуемых ресурсов
./deploy.sh cleanup

# Мониторинг ресурсов
docker stats

# Проверка логов на ошибки
./deploy.sh logs | grep ERROR
```

## 🤝 Поддержка

### Получение помощи

1. **Проверьте логи**: `./deploy.sh logs`
2. **Проверьте статус**: `./deploy.sh status`
3. **Проверьте здоровье**: `./deploy.sh health`
4. **Очистите систему**: `./deploy.sh cleanup`

### Полезные команды

```bash
# Полная перезагрузка
./deploy.sh stop
./deploy.sh cleanup
./deploy.sh dev --fresh

# Проверка конфигурации
docker-compose -f config/docker/docker-compose.yml config

# Вход в контейнер
docker exec -it agb_backend_prod bash
docker exec -it agb_frontend_prod sh
```

---

## 🎉 Готово к использованию!

Ваша корпоративная платформа готова к работе. Система автоматически настроена и оптимизирована для production использования.

**Следующие шаги:**
1. Настройте домен и SSL сертификаты
2. Измените пароли по умолчанию
3. Настройте мониторинг
4. Создайте резервные копии

**Удачного использования!** 🚀