# 🚨 Исправление проблемы с местом на сервере

## Проблема
На сервере закончилось место на диске, что приводит к ошибке:
```
write /app/node_modules/@next/swc-linux-x64-musl/next-swc.linux-x64-musl.node: no space left on device
```

## 🔧 Решение

### Вариант 1: Автоматическое исправление (рекомендуется)

Запустите скрипт исправления:
```bash
./fix-server-space.sh
```

Этот скрипт:
1. ✅ Подключится к серверу
2. ✅ Очистит Docker кэш и неиспользуемые образы
3. ✅ Очистит системные кэши и временные файлы
4. ✅ Отправит оптимизированные Dockerfile
5. ✅ Выполнит оптимизированную сборку

### Вариант 2: Ручное исправление

Если автоматический скрипт не работает, выполните команды вручную:

#### 1. Подключитесь к серверу
```bash
ssh root@37.252.20.46
```

#### 2. Очистите место на диске
```bash
# Остановите все контейнеры
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true

# Очистите Docker
docker system prune -a -f --volumes
docker builder prune -a -f

# Очистите системные кэши
apt-get clean
apt-get autoclean
apt-get autoremove -y

# Очистите временные файлы
rm -rf /tmp/*
rm -rf /var/tmp/*
```

#### 3. Проверьте свободное место
```bash
df -h
```

#### 4. Запустите развертывание
```bash
cd /root/agb_proj
./deploy-root.sh
```

### Вариант 3: Минимальная сборка

Если места все еще мало, используйте минимальную конфигурацию:

```bash
# На сервере
cd /root/agb_proj

# Остановите существующие контейнеры
docker-compose -f docker-compose.prod.yml down

# Используйте минимальную конфигурацию
docker-compose -f docker-compose.minimal.yml up -d --build
```

## 📊 Мониторинг места на диске

### Проверка использования диска
```bash
df -h
```

### Проверка размеров директорий
```bash
du -sh /var/lib/docker
du -sh /tmp
du -sh /var/log
du -sh /var/cache
```

### Очистка Docker
```bash
# Очистка неиспользуемых образов
docker image prune -a -f

# Очистка неиспользуемых volumes
docker volume prune -f

# Полная очистка системы
docker system prune -a -f --volumes
```

## 🛠️ Долгосрочные решения

### 1. Увеличение диска
- Обратитесь к провайдеру для увеличения размера диска
- Рекомендуемый минимум: 20GB для production

### 2. Настройка автоматической очистки
```bash
# Создайте cron задачу для автоматической очистки
echo "0 2 * * * docker system prune -f" | crontab -
```

### 3. Оптимизация Docker образов
- Используйте `.dockerignore` для исключения ненужных файлов
- Используйте multi-stage builds
- Используйте alpine образы

### 4. Мониторинг места
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
echo "0 */6 * * * /root/check-disk.sh" | crontab -
```

## 🚨 Экстренные меры

Если система не запускается из-за нехватки места:

### 1. Очистка логов
```bash
find /var/log -type f -name "*.log" -exec truncate -s 0 {} \;
find /var/log -type f -name "*.gz" -delete
```

### 2. Очистка кэша
```bash
rm -rf /var/cache/apt/archives/*
rm -rf /var/cache/apt/lists/*
```

### 3. Удаление старых ядер
```bash
apt-get autoremove --purge -y
```

## 📞 Поддержка

Если проблемы продолжаются:
1. Проверьте логи: `docker-compose -f docker-compose.prod.yml logs`
2. Проверьте статус: `docker-compose -f docker-compose.prod.yml ps`
3. Обратитесь к провайдеру для увеличения диска

---

**💡 Совет:** Регулярно очищайте Docker кэш и мониторьте использование диска для предотвращения подобных проблем в будущем.
