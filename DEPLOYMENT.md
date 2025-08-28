# Инструкции по деплою Felix на сервер

## Подготовка сервера

### 1. Требования к серверу
- **ОС**: Ubuntu 20.04+ или CentOS 8+
- **RAM**: минимум 4GB (рекомендуется 8GB)
- **CPU**: минимум 2 ядра
- **Диск**: минимум 20GB свободного места
- **Сеть**: статический IP адрес

### 2. Установка Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# CentOS/RHEL
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Перезагрузка сессии
newgrp docker
```

### 3. Установка Docker Compose
```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Деплой на сервер

### 1. Клонирование проекта
```bash
git clone <repository-url>
cd agb_proj
```

### 2. Настройка домена
```bash
# Установка переменной окружения
export DOMAIN=your-domain.com

# Или добавить в ~/.bashrc для постоянного хранения
echo 'export DOMAIN=your-domain.com' >> ~/.bashrc
source ~/.bashrc
```

### 3. Запуск production деплоя
```bash
# Автоматический деплой с nginx и SSL
./deploy-prod.sh

# Или ручной запуск
docker-compose -f docker-compose.prod.yml up --build -d
```

### 4. Проверка статуса
```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи
docker-compose -f docker-compose.prod.yml logs -f

# Проверка здоровья
curl -f https://$DOMAIN/api/health
```

## Настройка домена и DNS

### 1. Настройка DNS записей
```
A    @     <IP-адрес-сервера>
A    www   <IP-адрес-сервера>
```

### 2. Проверка DNS
```bash
nslookup your-domain.com
dig your-domain.com
```

## SSL сертификаты

### 1. Автоматические сертификаты (рекомендуется)
```bash
# Установка Certbot
sudo apt install certbot

# Получение сертификата
sudo certbot certonly --standalone -d your-domain.com

# Обновление nginx.conf для использования Let's Encrypt
```

### 2. Ручные сертификаты
```bash
# Создание самоподписанного сертификата
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/nginx.key -out ssl/nginx.crt \
    -subj "/C=KZ/ST=Almaty/L=Almaty/O=Almazgeobur/CN=your-domain.com"
```

## Настройка файрвола

### 1. UFW (Ubuntu)
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. Firewalld (CentOS)
```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Мониторинг и логирование

### 1. Просмотр логов
```bash
# Все сервисы
docker-compose -f docker-compose.prod.yml logs -f

# Отдельные сервисы
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 2. Мониторинг ресурсов
```bash
# Использование ресурсов контейнерами
docker stats

# Использование диска
df -h

# Использование памяти
free -h
```

## Резервное копирование

### 1. База данных
```bash
# Создание резервной копии
docker-compose -f docker-compose.prod.yml exec db pg_dump -U felix_user agb_felix > backup_$(date +%Y%m%d_%H%M%S).sql

# Автоматическое резервное копирование (cron)
echo "0 2 * * * docker-compose -f /path/to/docker-compose.prod.yml exec -T db pg_dump -U felix_user agb_felix > /backups/backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql" | crontab -
```

### 2. Файлы приложения
```bash
# Создание архива
tar -czf felix_backup_$(date +%Y%m%d_%H%M%S).tar.gz . --exclude=node_modules --exclude=.git
```

## Обновление приложения

### 1. Остановка
```bash
docker-compose -f docker-compose.prod.yml down
```

### 2. Обновление кода
```bash
git pull origin main
```

### 3. Пересборка и запуск
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

### 4. Проверка обновлений БД
```bash
docker-compose -f docker-compose.prod.yml exec backend python create_tables.py
```

## Устранение неполадок

### 1. Проблемы с подключением
```bash
# Проверка портов
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Проверка Docker
docker ps
docker network ls
```

### 2. Проблемы с базой данных
```bash
# Проверка подключения
docker-compose -f docker-compose.prod.yml exec db psql -U felix_user -d agb_felix -c "SELECT 1;"

# Перезапуск БД
docker-compose -f docker-compose.prod.yml restart db
```

### 3. Проблемы с nginx
```bash
# Проверка конфигурации
docker-compose -f docker-compose.prod.yml exec nginx nginx -t

# Перезапуск nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## Безопасность

### 1. Обновление паролей
```bash
# Изменение пароля БД
docker-compose -f docker-compose.prod.yml exec db psql -U felix_user -d agb_felix -c "ALTER USER felix_user PASSWORD 'new_password';"

# Обновление переменных окружения
# Отредактировать docker-compose.prod.yml
```

### 2. Ограничение доступа
```bash
# Только локальный доступ к БД
# В docker-compose.prod.yml уже настроено: "127.0.0.1:5432:5432"
```

### 3. Регулярные обновления
```bash
# Обновление Docker образов
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Производительность

### 1. Оптимизация nginx
```bash
# Добавить в nginx.conf
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. Кеширование
```bash
# Настройка кеширования в nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Автоматизация

### 1. Скрипт мониторинга
```bash
#!/bin/bash
# health_check.sh
if ! curl -f https://$DOMAIN/api/health > /dev/null 2>&1; then
    echo "Service is down, restarting..."
    docker-compose -f docker-compose.prod.yml restart
    echo "Service restarted at $(date)" >> /var/log/felix_restart.log
fi
```

### 2. Cron задачи
```bash
# Проверка здоровья каждые 5 минут
*/5 * * * * /path/to/health_check.sh

# Резервное копирование каждый день в 2:00
0 2 * * * /path/to/backup.sh
```

---

**Важно**: После деплоя обязательно проверьте:
1. Доступность приложения по домену
2. Работу SSL сертификатов
3. Создание администратора в системе
4. Логи всех сервисов
5. Настройки файрвола
