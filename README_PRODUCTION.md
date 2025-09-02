# 🚀 AGB Production - Готовое к развертыванию решение

## 🎯 Что это?

Полностью автоматизированное решение для развертывания системы AGB (Алмазгеобур) в production среде. **Все работает из коробки** - никаких дополнительных миграций, настройки или ручной инициализации не требуется.

## ✨ Ключевые особенности

- 🔄 **Автоматическая инициализация** - все данные создаются автоматически при первом запуске
- 📊 **Готовые миграции** - база данных настраивается полностью автоматически
- 🏥 **Health checks** - встроенный мониторинг всех сервисов
- 🔒 **SSL готовность** - поддержка HTTPS из коробки
- 📈 **Мониторинг** - встроенные инструменты наблюдения
- 🔄 **Автообновления** - автоматические бэкапы и обновления
- 🛡️ **Безопасность** - production-ready конфигурация

## 🚀 Быстрый старт (3 команды)

```bash
# 1. Клонируйте проект
git clone <your-repo> agb-production
cd agb-production

# 2. Настройте конфигурацию
cp production.env.example production.env
nano production.env  # Измените пароли!

# 3. Запустите развертывание
./deploy.sh          # Для обычного пользователя
# ИЛИ
./deploy-root.sh     # Для root пользователя
```

**Готово!** 🎉 Система будет доступна по адресу `http://localhost`

## 🔐 Выбор скрипта развертывания

### `./deploy.sh` (рекомендуется)
- ✅ **Для обычного пользователя** с правами на Docker
- ✅ **Безопасно** - не требует root прав
- ✅ **Лучшие практики** - изолированная среда
- ⚠️ Требует добавления пользователя в группу docker

### `./deploy-root.sh`
- ✅ **Для root пользователя** 
- ✅ **Автоматически исправляет** права доступа к файлам
- ⚠️ **Менее безопасно** - запуск от root
- ⚠️ Может создать проблемы с правами доступа

### Как добавить пользователя в группу docker:
```bash
sudo usermod -aG docker $USER
# Перезайдите в систему или выполните:
newgrp docker
```

## 📋 Что происходит автоматически

### При запуске `./deploy.sh`:

1. ✅ **Проверка зависимостей** - Docker, Docker Compose
2. ✅ **Создание директорий** - все необходимые папки
3. ✅ **SSL сертификаты** - самоподписанные для тестирования
4. ✅ **Сборка контейнеров** - все сервисы собираются
5. ✅ **Запуск сервисов** - PostgreSQL, Backend, Frontend, Nginx
6. ✅ **Инициализация БД** - создание всех таблиц
7. ✅ **Загрузка данных** - номенклатура, пользователи, настройки
8. ✅ **Проверка здоровья** - все сервисы работают

### Автоматически создается:

- 👤 **Администратор**: `admin` / `(пароль из production.env)`
- 📊 **37 позиций номенклатуры** ALFA
- 🏢 **Отделы и сотрудники**
- 📰 **Тестовые новости и события**
- 💬 **Чат-система**
- 🔧 **Система заявок на ремонт**

## 🛠️ Управление системой

### Основные команды

```bash
# Проверка статуса
./monitor.sh status

# Проверка здоровья
./monitor.sh health

# Просмотр логов
./monitor.sh logs

# Мониторинг ресурсов
./monitor.sh resources

# Информация о БД
./monitor.sh database
```

### Обновление

```bash
# Полное обновление с бэкапом
./update.sh

# Только бэкап
./update.sh backup

# Только пересборка
./update.sh rebuild
```

### Управление контейнерами

```bash
# Остановка
./deploy.sh stop

# Перезапуск
./deploy.sh restart

# Статус
./deploy.sh status
```

## 🧪 Тестирование

```bash
# Полный тест системы
./test-production.sh

# Тест отдельных компонентов
./test-production.sh api
./test-production.sh db
./test-production.sh nomenclature
```

## 📊 Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │────│    Frontend     │────│     Backend     │
│   (Port 80/443) │    │   (Next.js)     │    │   (FastAPI)     │
│   Load Balancer │    │   React App     │    │   API Server    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (Database)    │
                    │   Auto-init     │
                    └─────────────────┘
```

## 🔐 Безопасность

### Обязательные изменения в production.env:

```bash
# Смените эти значения!
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
SECRET_KEY=YOUR_32_CHAR_SECRET_KEY
ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD
ADMIN_EMAIL=your@email.com
```

### SSL для production:

```bash
# Let's Encrypt
sudo certbot certonly --standalone -d yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
./deploy.sh restart
```

## 📈 Мониторинг

### Автоматический мониторинг

```bash
# Запуск мониторинга каждые 30 секунд
./monitor.sh monitor 30
```

### Логи

```bash
# Все логи
./monitor.sh logs

# Конкретный сервис
docker-compose -f docker-compose.prod.yml logs -f backend
```

## 🗄️ База данных

### Автоматические бэкапы

```bash
# Ручной бэкап
./update.sh backup

# Автоматические бэкапы (cron)
echo "0 2 * * * cd /path/to/agb-production && ./update.sh backup" | crontab -
```

### Восстановление

```bash
# Восстановление из бэкапа
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U felix_prod_user -d agb_felix_prod < backup_file.sql
```

## 🚨 Устранение неполадок

### Проблемы с запуском

```bash
# Проверка логов
./monitor.sh logs

# Перезапуск
./deploy.sh restart

# Полная пересборка
./update.sh rebuild
```

### Проблемы с производительностью

```bash
# Мониторинг ресурсов
./monitor.sh monitor 10

# Очистка Docker
./update.sh cleanup
```

### Проблемы с местом на диске

Если возникают ошибки `no space left on device` или проблемы со сборкой фронтенда:

```bash
# Если вы на сервере (РЕКОМЕНДУЕТСЯ)
./fix-server-complete.sh

# Альтернативно, если вы на локальной машине
./server-fix.sh

# Или если вы на сервере (старая версия)
./server-fix-local.sh
```

### Проблемы с Docker Hub

Если возникают ошибки `toomanyrequests: You have reached your unauthenticated pull rate limit`:

```bash
# Специальный скрипт для обхода лимитов Docker Hub
./fix-docker-limits.sh
```

**Подробнее**: [DOCKER_HUB_FIX.md](DOCKER_HUB_FIX.md)

**Подробнее**: [SERVER_INSTRUCTIONS.md](SERVER_INSTRUCTIONS.md)

## 📁 Структура проекта

```
agb-production/
├── 🚀 deploy.sh              # Основной скрипт развертывания
├── 🔄 update.sh              # Скрипт обновления
├── 📊 monitor.sh             # Мониторинг системы
├── 🧪 test-production.sh     # Тестирование
├── 🔧 fix-server-complete.sh # ПОЛНОЕ исправление проблем на сервере (РЕКОМЕНДУЕТСЯ)
├── 🔧 fix-docker-limits.sh   # Исправление проблем с лимитами Docker Hub
├── 🔧 server-fix.sh          # Исправление проблем на сервере (с локальной машины)
├── 🔧 server-fix-local.sh    # Исправление проблем на сервере (на сервере)
├── 📋 DEPLOYMENT.md          # Подробная документация
├── 📋 SERVER_INSTRUCTIONS.md # Инструкции для работы на сервере
├── 📋 DOCKER_HUB_FIX.md      # Решение проблем с Docker Hub
├── 🐳 docker-compose.prod.yml # Production конфигурация
├── 🐳 docker-compose.prod.offline.yml # Offline конфигурация (обход лимитов)
├── ⚙️ production.env.example  # Шаблон конфигурации
├── 📁 backend/               # Backend приложение
├── 📁 frontend/              # Frontend приложение
├── 📁 nginx/                 # Nginx конфигурация
└── 📁 scripts/               # Вспомогательные скрипты
```

## 🎯 Что включено

### Backend (FastAPI)
- ✅ Автоматическое создание таблиц
- ✅ Инициализация данных
- ✅ Health checks
- ✅ Production оптимизации
- ✅ Безопасность

### Frontend (Next.js)
- ✅ Production сборка
- ✅ Оптимизация производительности
- ✅ Health checks
- ✅ Статические файлы

### Database (PostgreSQL)
- ✅ Автоматическая инициализация
- ✅ Оптимизированные настройки
- ✅ Расширения
- ✅ Health checks

### Nginx
- ✅ Load balancing
- ✅ SSL поддержка
- ✅ Кэширование
- ✅ Gzip сжатие
- ✅ Health checks

## 🎉 Готово к использованию!

После запуска `./deploy.sh` у вас будет:

- 🌐 **Веб-интерфейс**: http://localhost
- 🔧 **API**: http://localhost/api
- 📊 **Health check**: http://localhost/health
- 👤 **Админ**: admin / (пароль из production.env)

## 📞 Поддержка

- 📖 **Документация**: [DEPLOYMENT.md](DEPLOYMENT.md)
- 🐛 **Проблемы**: Проверьте логи `./monitor.sh logs`
- 🔧 **Мониторинг**: `./monitor.sh monitor`

---

**🎯 Одна команда - полная система готова к работе!**
