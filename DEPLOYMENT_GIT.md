# 🚀 AGB Project - Развертывание через Git

## 📋 Быстрое развертывание

### Вариант 1: Автоматическое развертывание (рекомендуется)

```bash
# Скачайте и запустите скрипт развертывания
curl -sSL https://raw.githubusercontent.com/Garanash/agb_proj/master/scripts/deploy_via_git.sh | bash

# Или для конкретной версии
curl -sSL https://raw.githubusercontent.com/Garanash/agb_proj/master/scripts/deploy_via_git.sh | bash -s v1.0.0
```

### Вариант 2: Ручное развертывание

```bash
# 1. Клонируйте репозиторий
git clone https://github.com/Garanash/agb_proj.git
cd agb_proj

# 2. Переключитесь на нужную версию
git checkout v1.0.0  # или master для последней версии

# 3. Запустите развертывание
chmod +x scripts/deploy_via_git.sh
./scripts/deploy_via_git.sh
```

## 🏷️ Доступные версии

- **`v1.0.0`** - Стабильная версия с полным функционалом
- **`master`** - Последняя версия (может быть нестабильной)

## 📦 Что включено

### ✅ Полностью функциональное приложение:
- Исправлена вкладка сопоставления артикулов с базой данных
- Исправлено ИИ сопоставление
- Исправлены все API endpoints
- Созданы тестовые пользователи со всеми ролями
- Заполнены тестовые данные
- Созданы рабочие чаты

### 🗄️ База данных:
- **53 таблицы** с полной схемой
- **7 пользователей** со всеми ролями
- **5 отделов** компании
- **10 сотрудников** для раздела "О нас"
- **7 чатов** (общие и личные)
- **13 тестовых сообщений**
- **Функциональность сопоставления артикулов**
- **ИИ сопоставление**

### 📦 Включено:
- Полный дамп базы данных (`database_backup_full.sql`)
- Скрипты для автоматического развертывания
- Docker Compose конфигурация для продакшена
- Nginx конфигурация
- Environment файлы

## 🔑 Данные для входа

После развертывания используйте следующие учетные данные:

| Роль | Логин | Пароль |
|------|-------|--------|
| Администратор | `admin` | `admin123` |
| Менеджер 1 | `manager1` | `ManagerPass123!` |
| Менеджер 2 | `manager2` | `ManagerPass123!` |
| Сотрудник 1 | `employee1` | `EmployeePass123!` |
| Сотрудник 2 | `employee2` | `EmployeePass123!` |
| ВЭД специалист | `ved_passport1` | `VedPass123!` |
| Пользователь | `user1` | `UserPass123!` |

## 🌐 Доступ к приложению

После успешного развертывания приложение будет доступно по адресам:

- **Frontend:** `http://YOUR_SERVER_IP`
- **Backend API:** `http://YOUR_SERVER_IP:8000`
- **API Docs:** `http://YOUR_SERVER_IP:8000/docs`

## 🛠️ Управление сервисами

```bash
# Перейдите в директорию проекта
cd agb_proj

# Просмотр статуса контейнеров
docker ps

# Просмотр логов
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env logs

# Перезапуск сервисов
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart

# Остановка сервисов
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down

# Запуск сервисов
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d
```

## 🔄 Обновление приложения

```bash
# Перейдите в директорию проекта
cd agb_proj

# Получите обновления
git fetch origin

# Переключитесь на нужную версию
git checkout v1.0.1  # или master для последней версии

# Перезапустите сервисы
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart
```

## 📝 Требования к серверу

- **ОС:** Ubuntu 20.04+ или CentOS 8+
- **RAM:** Минимум 4GB
- **Диск:** Минимум 20GB свободного места
- **Docker:** 20.10+ (устанавливается автоматически)
- **Git:** 2.0+ (устанавливается автоматически)

## 🔧 Настройка

### Изменение портов:
Отредактируйте `config/docker/docker-compose.prod.yml`:
```yaml
ports:
  - "80:80"      # Frontend
  - "8000:8000"  # Backend
```

### Изменение паролей:
Отредактируйте `config/env/production.env`:
```env
ADMIN_PASSWORD=your_new_password
```

## 🐛 Устранение неполадок

### Проблема: Docker не запускается
```bash
# Запустите Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER
# Перелогиньтесь
```

### Проблема: Порты заняты
```bash
# Найдите процесс, занимающий порт
sudo lsof -i :80
sudo lsof -i :8000

# Остановите процесс
sudo kill -9 PID
```

### Проблема: База данных не восстанавливается
```bash
# Проверьте логи PostgreSQL
docker logs agb_postgres_prod

# Пересоздайте контейнер
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d postgres
```

### Проблема: Frontend не загружается
```bash
# Проверьте логи frontend
docker logs agb_frontend_prod

# Пересоберите frontend
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env build frontend
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env up -d frontend
```

## 📞 Поддержка

При возникновении проблем:

1. **Проверьте логи:** `docker logs CONTAINER_NAME`
2. **Проверьте статус:** `docker ps`
3. **Перезапустите сервисы:** `docker-compose restart`
4. **Проверьте версию:** `git describe --tags`

## 🔒 Безопасность

После развертывания:

1. **Измените пароли** администратора и пользователей
2. **Настройте SSL сертификаты** для HTTPS
3. **Ограничьте доступ** к портам через файрвол
4. **Настройте бэкапы** базы данных
5. **Обновите секретные ключи** в environment файлах

## 📊 Мониторинг

```bash
# Просмотр использования ресурсов
docker stats

# Просмотр логов в реальном времени
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env logs -f

# Проверка здоровья сервисов
curl http://YOUR_SERVER_IP:8000/api/health
```

## 🎯 Функциональность

### ✅ Реализованные функции:
- **Аутентификация и авторизация** с ролевой моделью
- **Управление пользователями** и отделами
- **Чат-система** с групповыми и личными чатами
- **Сопоставление артикулов** с базой данных
- **ИИ сопоставление** для автоматического поиска
- **Календарь событий** и планирование
- **Новости и уведомления**
- **Административная панель** v3
- **API документация** (Swagger/OpenAPI)
- **Адаптивный дизайн** для всех устройств

### 🔧 Технические особенности:
- **Backend:** FastAPI + SQLAlchemy + PostgreSQL
- **Frontend:** Next.js + React + TypeScript + Tailwind CSS
- **Контейнеризация:** Docker + Docker Compose
- **Прокси:** Nginx
- **Кэширование:** Redis
- **База данных:** PostgreSQL 15

---

**Версия:** v1.0.0  
**Дата:** 15 октября 2025  
**Репозиторий:** https://github.com/Garanash/agb_proj
