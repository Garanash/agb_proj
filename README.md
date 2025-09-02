# 🚀 AGB Project - Корпоративная платформа

## ⚡ Быстрое развертывание на новой машине

### 📋 Требования
- Docker и Docker Compose
- Минимум 4GB RAM, 20GB диск
- Linux/macOS/Windows с Docker

### 🎯 Автоматическое развертывание (1 команда)

```bash
# Клонировать и развернуть
git clone <your-repo-url>
cd agb_proj
./deploy-fresh.sh
```

**Готово!** Система автоматически:
- ✅ Создает все таблицы базы данных
- ✅ Инициализирует тестовые данные
- ✅ Настраивает все сервисы
- ✅ Проверяет готовность системы

### 🧪 Тестирование развертывания

```bash
# Проверить все компоненты системы
./test-deployment.sh
```

### 🏭 Production развертывание

```bash
# Для production сервера
./deploy-production.sh
```

### 🎯 Что делает скрипт:

1. ✅ Проверяет систему и Docker
2. ✅ Создает `production.env` с правильными настройками
3. ✅ Создает необходимые директории
4. ✅ Очищает старые контейнеры
5. ✅ Собирает и запускает все сервисы
6. ✅ Проверяет доступность приложений

### 🌐 Доступ к системе:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **База данных**: localhost:15432

### 👤 Учетные данные по умолчанию:

| Роль | Логин | Пароль |
|------|-------|--------|
| Администратор | admin | admin123 |
| Тестовый пользователь | testuser | test123 |
| Заказчик | customer1 | customer123 |
| Исполнитель | contractor1 | contractor123 |
| Сервисный инженер | service_engineer | engineer123 |

⚠️ **Обязательно измените пароли в production!**

### 📊 Управление:

```bash
# Просмотр статуса
./deploy.sh status

# Просмотр логов
./deploy.sh logs

# Остановка сервисов
./deploy.sh stop

# Очистка Docker
./deploy.sh cleanup
```

### 🆘 Проблемы:

#### Если сборка фронтенда падает:
```bash
# Очистить и пересобрать
./deploy.sh cleanup
./deploy.sh
```

#### Если проблемы с Docker Hub лимитами:
```bash
# Авторизоваться в Docker Hub
docker login

# Затем запустить развертывание
./deploy.sh
```

#### Если не хватает места:
```bash
# Очистить систему
docker system prune -af --volumes
apt-get clean && apt-get autoremove -y
```

### 📞 Поддержка:

При проблемах проверьте логи:
```bash
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs backend
```

---

## 🏗️ Архитектура

- **Frontend**: Next.js 14 (React)
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL
- **Cache/Queue**: Redis (опционально)
- **Web Server**: Nginx
- **Container**: Docker + Docker Compose

## 📁 Структура проекта

```
agb_proj/
├── backend/           # FastAPI приложение
├── frontend/          # Next.js приложение
├── nginx/            # Nginx конфигурация
├── scripts/          # Скрипты инициализации
├── docker-compose.prod.yml    # Production конфигурация
├── docker-compose.prod.offline.yml  # Offline конфигурация
├── production.env.example     # Шаблон переменных окружения
└── deploy.sh         # 🚀 Единый скрипт деплоя
```

---

**🎉 Удачного развертывания!**