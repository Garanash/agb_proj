# 🔧 Решение проблемы отключения SSH после сборки

## Проблема
После запуска `deploy-server.sh` происходит отключение от SSH сессии, что не позволяет завершить развертывание.

## Причины
1. **Нехватка памяти** - Docker сборка потребляет много RAM
2. **Нехватка места на диске** - Образы Docker занимают много места
3. **Одновременная сборка всех сервисов** - Создает пиковую нагрузку
4. **Отсутствие ограничений ресурсов** - Контейнеры могут "съесть" всю память

## Решения

### 1. 🚀 Быстрое решение - Безопасное развертывание

```bash
# Запустите безопасный скрипт развертывания
./safe-deploy.sh
```

Этот скрипт:
- Проверяет системные ресурсы
- Создает swap файл если нужно
- Собирает сервисы поэтапно
- Ограничивает потребление ресурсов

### 2. 🔍 Диагностика проблем

```bash
# Запустите диагностику
./diagnose-server.sh
```

Этот скрипт покажет:
- Использование памяти и диска
- Статус Docker контейнеров
- Логи ошибок
- Рекомендации по исправлению

### 3. 🛠️ Ручное исправление

#### Создание swap файла:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

#### Очистка Docker:
```bash
docker system prune -a -f
docker volume prune -f
```

#### Поэтапная сборка:
```bash
# 1. Только база данных
docker-compose -f docker-compose.optimized.yml up -d postgres
sleep 30

# 2. Redis
docker-compose -f docker-compose.optimized.yml up -d redis
sleep 15

# 3. Backend
docker-compose -f docker-compose.optimized.yml up -d backend
sleep 60

# 4. Frontend
docker-compose -f docker-compose.optimized.yml up -d frontend
sleep 30

# 5. Nginx
docker-compose -f docker-compose.optimized.yml up -d nginx
```

### 4. 🔄 Использование screen для безопасности

```bash
# Установите screen если не установлен
sudo apt-get install screen

# Запустите развертывание в screen сессии
screen -S deploy
./safe-deploy.sh

# Отключитесь от screen (Ctrl+A, затем D)
# Вернуться к сессии: screen -r deploy
```

### 5. 📊 Мониторинг ресурсов

```bash
# Следите за использованием памяти
htop

# Следите за Docker
docker stats

# Проверяйте логи
docker-compose -f docker-compose.optimized.yml logs -f
```

## Оптимизированная конфигурация

Используйте `docker-compose.optimized.yml` вместо стандартного `docker-compose.yml`:

- Ограничения памяти для каждого контейнера
- Оптимизированные настройки PostgreSQL
- Отключение ненужных сервисов (OCR, N8N) по умолчанию
- Улучшенные health checks

## Минимальные требования к серверу

- **RAM**: 2GB (рекомендуется 4GB)
- **Диск**: 10GB свободного места
- **CPU**: 2 ядра
- **Swap**: 2GB

## Проверка после развертывания

```bash
# Проверьте статус всех сервисов
docker-compose -f docker-compose.optimized.yml ps

# Проверьте доступность
curl http://localhost/api/health
curl http://localhost

# Проверьте логи на ошибки
docker-compose -f docker-compose.optimized.yml logs | grep -i error
```

## Если проблема повторяется

1. Увеличьте swap до 4GB
2. Остановите ненужные сервисы на сервере
3. Используйте более мощный сервер
4. Рассмотрите использование Docker BuildKit для оптимизации сборки

## Дополнительные команды

```bash
# Остановить все сервисы
docker-compose -f docker-compose.optimized.yml down

# Перезапустить сервисы
docker-compose -f docker-compose.optimized.yml restart

# Просмотр логов конкретного сервиса
docker-compose -f docker-compose.optimized.yml logs backend

# Обновление образов
docker-compose -f docker-compose.optimized.yml pull
```

## Поддержка

Если проблема не решается, запустите диагностику и отправьте результаты:

```bash
./diagnose-server.sh > diagnosis.log 2>&1
```
