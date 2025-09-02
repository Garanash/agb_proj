# 🚀 AGB Production Deployment

## Быстрое развертывание на Linux сервере

### 📋 Требования
- Linux сервер (Ubuntu/Debian/CentOS/RHEL)
- Docker и Docker Compose
- Минимум 4GB RAM, 20GB диск
- Права sudo (для установки Docker)

### ⚡ Развертывание (Всего 2 команды)

```bash
# 1. Клонировать проект и перейти в директорию
git clone <your-repo-url>
cd agb_proj

# 2. Запустить развертывание
./deploy.sh
```

### 🔍 Предварительная проверка системы

```bash
# Проверить готовность системы
./check-system.sh
```

### 🎯 Что делает скрипт:

1. ✅ Проверяет систему и Docker
2. ✅ Создает `production.env` с правильными настройками
3. ✅ Создает необходимые директории
4. ✅ Очищает старые контейнеры
5. ✅ Собирает и запускает все сервисы
6. ✅ Проверяет доступность приложений

### 🌐 Доступ после развертывания:

- **Основной сайт**: http://your-server-ip
- **Фронтенд**: http://your-server-ip:3000
- **API бекенда**: http://your-server-ip:8000
- **Документация API**: http://your-server-ip:8000/docs

### 🔐 Админ доступ:

- **Логин**: admin
- **Пароль**: admin_secure_2024
- ⚠️ **Обязательно измените пароль после первого входа!**

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