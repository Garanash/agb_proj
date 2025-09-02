# 🚨 Ручное исправление проблемы с местом на сервере

## Проблема
Ошибка: `no space left on device` при сборке Docker образов.

## 🔧 Пошаговое решение

### Шаг 1: Подключитесь к серверу
```bash
ssh root@37.252.20.46
```

### Шаг 2: Проверьте использование диска
```bash
df -h
```

### Шаг 3: Очистите Docker (ОБЯЗАТЕЛЬНО!)
```bash
# Остановите все контейнеры
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Очистите все неиспользуемые образы и кэш
docker system prune -a -f --volumes
docker builder prune -a -f

# Удалите все образы
docker image prune -a -f
```

### Шаг 4: Очистите системные кэши
```bash
# Очистите кэш пакетов
apt-get clean
apt-get autoclean
apt-get autoremove -y

# Очистите временные файлы
rm -rf /tmp/*
rm -rf /var/tmp/*

# Очистите логи
find /var/log -type f -name "*.log" -exec truncate -s 0 {} \;
find /var/log -type f -name "*.gz" -delete 2>/dev/null || true
```

### Шаг 5: Проверьте результат
```bash
df -h
```

### Шаг 6: Перейдите в директорию проекта
```bash
cd /root/agb_proj
```

### Шаг 7: Создайте .dockerignore для оптимизации
```bash
cat > frontend/.dockerignore << 'EOF'
node_modules
npm-debug.log
.next
.git
.gitignore
README.md
.env
.env.local
.env.production.local
.env.development.local
.vercel
.DS_Store
*.log
coverage
.nyc_output
.cache
dist
build
EOF
```

### Шаг 8: Запустите развертывание
```bash
./deploy-root.sh
```

## 🚨 Если места все еще мало

### Вариант A: Минимальная сборка
```bash
# Остановите существующие контейнеры
docker-compose -f docker-compose.prod.yml down

# Создайте минимальную конфигурацию
cat > docker-compose.minimal.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: agb_postgres_minimal
    environment:
      POSTGRES_DB: agb_felix_prod
      POSTGRES_USER: felix_prod_user
      POSTGRES_PASSWORD: felix_password_secure_2024
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: agb_backend_minimal
    environment:
      - DATABASE_URL=postgresql://felix_prod_user:felix_password_secure_2024@postgres:5432/agb_felix_prod
      - SECRET_KEY=your-secret-key-change-in-production
      - AUTO_INIT_DATA=true
    volumes:
      - ./uploads:/app/uploads
    ports:
      - "8000:8000"
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    container_name: agb_frontend_minimal
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# Запустите минимальную конфигурацию
docker-compose -f docker-compose.minimal.yml up -d --build
```

### Вариант B: Сборка по частям
```bash
# Сначала соберите только backend
docker-compose -f docker-compose.prod.yml build backend

# Затем frontend
docker-compose -f docker-compose.prod.yml build frontend

# Запустите все
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Мониторинг

### Проверка статуса
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Проверка логов
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Проверка здоровья
```bash
curl http://localhost:8000/api/health
curl http://localhost:3000
```

## 🛠️ Долгосрочные решения

### 1. Настройка автоматической очистки
```bash
# Создайте скрипт очистки
cat > /root/cleanup-docker.sh << 'EOF'
#!/bin/bash
docker system prune -f
docker builder prune -f
EOF

chmod +x /root/cleanup-docker.sh

# Добавьте в cron (очистка каждый день в 2:00)
echo "0 2 * * * /root/cleanup-docker.sh" | crontab -
```

### 2. Мониторинг места на диске
```bash
# Создайте скрипт мониторинга
cat > /root/check-disk.sh << 'EOF'
#!/bin/bash
USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
    echo "WARNING: Disk usage is ${USAGE}%"
    docker system prune -f
fi
EOF

chmod +x /root/check-disk.sh

# Проверка каждые 6 часов
echo "0 */6 * * * /root/check-disk.sh" | crontab -
```

## 🚨 Экстренные меры

Если система не запускается:

### 1. Удалите все Docker данные
```bash
docker system prune -a -f --volumes
rm -rf /var/lib/docker
systemctl restart docker
```

### 2. Очистите все кэши
```bash
rm -rf /var/cache/*
rm -rf /tmp/*
rm -rf /var/tmp/*
```

### 3. Перезапустите Docker
```bash
systemctl restart docker
```

## 📞 Если ничего не помогает

1. **Увеличьте диск сервера** - обратитесь к провайдеру
2. **Используйте внешний Docker registry** - загружайте образы на внешний сервис
3. **Оптимизируйте приложение** - уменьшите размер зависимостей

---

**💡 Важно:** После успешного развертывания настройте автоматическую очистку для предотвращения подобных проблем в будущем!
