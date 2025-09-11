# 🚀 Инструкция по развертыванию AGB Project

## Быстрое развертывание на новой машине

### Для разработки (Development)

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd agb_proj

# Запустите автоматическое развертывание
./deploy-fresh.sh
```

### Для продакшена (Production)

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd agb_proj

# Настройте production переменные
cp production.env.example production.env
nano production.env

# Запустите production развертывание
./deploy-production.sh
```

## Ручное развертывание

### 1. Подготовка окружения

```bash
# Установите Docker и Docker Compose
# Ubuntu/Debian:
sudo apt update
sudo apt install docker.io docker-compose

# CentOS/RHEL:
sudo yum install docker docker-compose

# macOS:
brew install docker docker-compose

# Запустите Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Настройка переменных окружения

#### Для разработки:
```bash
cp .env.example .env
# Отредактируйте .env файл при необходимости
```

#### Для продакшена:
```bash
cp production.env.example production.env
# Обязательно отредактируйте production.env:
# - POSTGRES_PASSWORD (сложный пароль)
# - SECRET_KEY (уникальный ключ)
# - ADMIN_PASSWORD (безопасный пароль)
# - NEXT_PUBLIC_API_URL (ваш домен)
```

### 3. Запуск сервисов

#### Development:
```bash
docker-compose up --build -d
```

#### Production:
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## Что происходит при развертывании

### Автоматическая инициализация базы данных

1. **Создание таблиц**: Все таблицы создаются автоматически из моделей SQLAlchemy
2. **Инициализация данных**: Создаются базовые данные:
   - Отделы компании
   - Пользователи (admin, testuser, заказчики, исполнители)
   - Номенклатура ВЭД
   - Тестовые новости и события
   - Чат-комнаты и боты
   - ВЭД паспорта

### Последовательность запуска

1. **PostgreSQL** - база данных
2. **Backend** - FastAPI сервер с автоматической инициализацией
3. **Frontend** - Next.js приложение
4. **Nginx** - веб-сервер и прокси

## Доступ к системе

### После успешного развертывания:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **База данных**: localhost:15432 (development) / localhost:5432 (production)

### Учетные данные по умолчанию:

| Роль | Логин | Пароль |
|------|-------|--------|
| Администратор | admin | admin123 |
| Тестовый пользователь | testuser | test123 |
| Заказчик | customer1 | customer123 |
| Исполнитель | contractor1 | contractor123 |
| Сервисный инженер | service_engineer | engineer123 |

## Полезные команды

### Просмотр логов
```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Перезапуск сервисов
```bash
# Все сервисы
docker-compose restart

# Конкретный сервис
docker-compose restart backend
```

### Подключение к контейнерам
```bash
# Backend контейнер
docker-compose exec backend bash

# База данных
docker-compose exec postgres psql -U felix_user -d agb_felix
```

### Остановка и очистка
```bash
# Остановка сервисов
docker-compose down

# Остановка с удалением volumes (ВНИМАНИЕ: удалит все данные!)
docker-compose down -v

# Удаление образов
docker-compose down --rmi all
```

## Мониторинг и диагностика

### Проверка здоровья сервисов
```bash
# Backend healthcheck
curl http://localhost:8000/api/health

# Frontend
curl http://localhost:3000
```

### Статус контейнеров
```bash
docker-compose ps
```

### Использование ресурсов
```bash
docker stats
```

## Решение проблем

### База данных не инициализируется
```bash
# Проверьте логи backend
docker-compose logs backend

# Перезапустите backend
docker-compose restart backend
```

### Frontend не загружается
```bash
# Проверьте логи frontend
docker-compose logs frontend

# Проверьте переменные окружения
docker-compose exec frontend env | grep NEXT_PUBLIC
```

### Проблемы с портами
```bash
# Проверьте занятые порты
netstat -tulpn | grep :3000
netstat -tulpn | grep :8000

# Измените порты в docker-compose.yml при необходимости
```

## Production рекомендации

1. **Безопасность**:
   - Используйте сложные пароли
   - Настройте SSL сертификаты
   - Ограничьте доступ к портам базы данных

2. **Мониторинг**:
   - Настройте логирование
   - Используйте мониторинг ресурсов
   - Настройте автоматические бэкапы

3. **Масштабирование**:
   - Используйте внешнюю базу данных для production
   - Настройте load balancer
   - Используйте CDN для статических файлов

## Поддержка

При возникновении проблем:
1. Проверьте логи сервисов
2. Убедитесь в правильности переменных окружения
3. Проверьте доступность портов
4. Обратитесь к документации Docker и Docker Compose
