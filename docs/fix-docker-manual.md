# 🔧 Ручное исправление проблемы ContainerConfig

Если автоматический скрипт не помог, выполните команды вручную:

## Шаг 1: Полная очистка Docker
```bash
# Остановить все контейнеры
docker-compose down -v --remove-orphans

# Очистить все контейнеры
docker container prune -f

# Очистить все volumes
docker volume prune -f

# Очистить все networks
docker network prune -f

# Очистить всю систему (включая неиспользуемые образы)
docker system prune -a -f
```

## Шаг 2: Перезапуск Docker
```bash
# Перезапустить Docker демон
sudo systemctl restart docker

# Проверить статус
sudo systemctl status docker
```

## Шаг 3: Запуск системы
```bash
# Перейти в директорию проекта
cd ~/agb_proj

# Запустить с пересборкой
docker-compose up --build -d

# Проверить статус
docker-compose ps
```

## Шаг 4: Диагностика
```bash
# Проверить логи
docker-compose logs

# Проверить конкретный сервис
docker-compose logs postgres
docker-compose logs backend

# Проверить порты
netstat -tlnp | grep -E '(8000|3000|80|5432)'
```

## Шаг 5: Экстренная очистка (если ничего не помогает)
```bash
# Полностью остановить Docker
sudo systemctl stop docker

# Удалить все Docker данные (ВНИМАНИЕ: это удалит ВСЕ образы и контейнеры!)
sudo rm -rf /var/lib/docker/*

# Запустить Docker заново
sudo systemctl start docker

# Пересобрать и запустить
docker-compose up --build -d
```

## Проверка работоспособности

После успешного запуска проверьте:

1. **API бэкенда**: `curl http://localhost:8000/api/health`
2. **Через Nginx**: `curl http://localhost/api/health`
3. **База данных**: `docker-compose exec postgres psql -U test_user -d test_platform_db -c "SELECT COUNT(*) FROM users;"`

## Возможные проблемы

- **Недостаточно места на диске**: `df -h`
- **Недостаточно памяти**: `free -h`
- **Проблемы с правами**: проверьте права на директорию проекта
- **Старая версия Docker**: обновите Docker до последней версии
