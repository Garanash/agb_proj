# 🚀 Руководство по развертыванию AGB Production

## 📋 Обзор

Это руководство описывает процесс развертывания системы AGB (Алмазгеобур) в production среде с автоматической инициализацией всех компонентов.

## 🎯 Особенности

- ✅ **Автоматическая инициализация** - все данные создаются автоматически
- ✅ **Готовые миграции** - база данных настраивается из коробки
- ✅ **Health checks** - мониторинг состояния всех сервисов
- ✅ **SSL поддержка** - готовность к HTTPS
- ✅ **Автоматические бэкапы** - при обновлениях
- ✅ **Мониторинг** - встроенные инструменты наблюдения

## 🛠️ Требования

### Системные требования
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Минимум 4GB, рекомендуется 8GB+
- **CPU**: 2+ ядра
- **Диск**: 20GB+ свободного места
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### Сетевые требования
- **Порты**: 80, 443 (HTTP/HTTPS)
- **Домен**: для SSL сертификатов (опционально)

## 🚀 Быстрый старт

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перезагрузка для применения изменений
sudo reboot
```

### 2. Клонирование проекта

```bash
# Клонирование репозитория
git clone <your-repo-url> agb-production
cd agb-production

# Или загрузка архива
wget <your-archive-url>
tar -xzf agb-production.tar.gz
cd agb-production
```

### 3. Настройка конфигурации

```bash
# Копирование и редактирование конфигурации
cp production.env.example production.env
nano production.env
```

**Обязательно измените в `production.env`:**
- `POSTGRES_PASSWORD` - надежный пароль для БД
- `SECRET_KEY` - секретный ключ (минимум 32 символа)
- `ADMIN_PASSWORD` - пароль администратора
- `ADMIN_EMAIL` - email администратора

### 4. Развертывание

```bash
# Запуск автоматического развертывания
./deploy.sh
```

Скрипт автоматически:
- ✅ Проверит зависимости
- ✅ Создаст необходимые директории
- ✅ Сгенерирует SSL сертификаты
- ✅ Соберет и запустит контейнеры
- ✅ Инициализирует базу данных
- ✅ Проверит работоспособность

## 📊 Архитектура системы

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Nginx       │────│    Frontend     │────│     Backend     │
│   (Port 80/443) │    │   (Next.js)     │    │   (FastAPI)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (Database)    │
                    └─────────────────┘
```

## 🔧 Управление системой

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

### Обновление системы

```bash
# Полное обновление
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

# Просмотр логов
./deploy.sh logs

# Статус
./deploy.sh status
```

## 🔐 Безопасность

### SSL сертификаты

Для production используйте настоящие SSL сертификаты:

```bash
# Let's Encrypt (рекомендуется)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Копирование сертификатов
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/key.pem
sudo chown $USER:$USER ssl/*.pem

# Перезапуск nginx
./deploy.sh restart
```

### Настройка файрвола

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Firewalld (CentOS)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## 📈 Мониторинг и логи

### Автоматический мониторинг

```bash
# Запуск мониторинга каждые 30 секунд
./monitor.sh monitor 30
```

### Логи приложения

```bash
# Все логи
docker-compose -f docker-compose.prod.yml logs -f

# Конкретный сервис
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f postgres
```

### Системные логи

```bash
# Docker логи
sudo journalctl -u docker.service -f

# Системные логи
sudo journalctl -f
```

## 🗄️ База данных

### Бэкапы

```bash
# Ручной бэкап
docker-compose -f docker-compose.prod.yml exec postgres pg_dump -U felix_prod_user -d agb_felix_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Автоматические бэкапы (cron)
echo "0 2 * * * cd /path/to/agb-production && ./update.sh backup" | crontab -
```

### Восстановление

```bash
# Восстановление из бэкапа
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U felix_prod_user -d agb_felix_prod < backup_file.sql
```

## 🔧 Настройка производительности

### PostgreSQL

Настройки в `scripts/init-production-db.sh`:

```sql
-- Увеличить для больших нагрузок
ALTER SYSTEM SET shared_buffers = '512MB';
ALTER SYSTEM SET effective_cache_size = '2GB';
ALTER SYSTEM SET max_connections = 300;
```

### Nginx

Настройки в `nginx/nginx.prod.conf`:

```nginx
# Увеличить для больших нагрузок
worker_processes auto;
worker_connections 2048;
```

## 🚨 Устранение неполадок

### Проблемы с запуском

```bash
# Проверка логов
./monitor.sh logs

# Проверка ресурсов
./monitor.sh resources

# Перезапуск всех сервисов
./deploy.sh restart
```

### Проблемы с базой данных

```bash
# Проверка подключения
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U felix_prod_user -d agb_felix_prod

# Проверка логов БД
docker-compose -f docker-compose.prod.yml logs postgres
```

### Проблемы с производительностью

```bash
# Мониторинг ресурсов
./monitor.sh monitor 10

# Проверка использования диска
df -h
docker system df
```

## 📞 Поддержка

### Полезные команды

```bash
# Информация о системе
./monitor.sh database
./monitor.sh resources

# Проверка здоровья
./monitor.sh health

# Логи всех сервисов
./monitor.sh logs
```

### Контакты

- **Техническая поддержка**: support@almazgeobur.ru
- **Документация**: [ссылка на документацию]
- **Репозиторий**: [ссылка на репозиторий]

## 📝 Changelog

### v1.0.0
- ✅ Автоматическая инициализация БД
- ✅ Production-ready конфигурация
- ✅ SSL поддержка
- ✅ Мониторинг и логирование
- ✅ Автоматические бэкапы
- ✅ Скрипты управления

---

**🎉 Поздравляем! Ваша система AGB готова к работе в production!**
