# Исправление проблем с местом на сервере

## Проблема
При развертывании на сервере возникают ошибки:
1. `Module not found: Can't resolve '@/utils/api'` - проблемы с путями в Next.js
2. `no space left on device` - нехватка места на диске

## Решение

### 1. Автоматическое исправление
Запустите скрипт для автоматического исправления:
```bash
chmod +x fix-server-space.sh
./fix-server-space.sh
```

### 2. Ручное исправление
Если автоматическое исправление не работает, выполните команды вручную:

#### На локальной машине:
```bash
# Передаем скрипт очистки на сервер
scp cleanup-server.sh root@37.252.20.46:/tmp/

# Передаем оптимизированный Dockerfile
scp frontend/Dockerfile.prod.minimal root@37.252.20.46:/tmp/Dockerfile.prod

# Подключаемся к серверу
ssh root@37.252.20.46
```

#### На сервере:
```bash
# Переходим в директорию проекта
cd /root/agb_proj

# Выполняем очистку
chmod +x /tmp/cleanup-server.sh
/tmp/cleanup-server.sh

# Копируем оптимизированный Dockerfile
cp /tmp/Dockerfile.prod frontend/

# Останавливаем контейнеры
docker-compose -f docker-compose.prod.yml down

# Очищаем Docker кэш
docker system prune -a -f --volumes

# Запускаем развертывание
chmod +x deploy-root.sh
./deploy-root.sh
```

### 3. Минимальная версия
Если места на диске все еще не хватает, используйте минимальную версию:
```bash
# На сервере
cd /root/agb_proj
chmod +x deploy-minimal.sh
./deploy-minimal.sh
```

## Что было исправлено

### 1. Конфигурация Next.js
- Добавлен `output: 'standalone'` для Docker
- Исправлены пути для модулей
- Добавлены настройки для production

### 2. Оптимизированный Dockerfile
- Создан `Dockerfile.prod.minimal` с минимальным использованием места
- Использует multi-stage build
- Удаляет неиспользуемые зависимости

### 3. Скрипты очистки
- `cleanup-server.sh` - очистка сервера
- `fix-server-space.sh` - автоматическое исправление
- `deploy-minimal.sh` - развертывание минимальной версии

## Проверка результата
После исправления проверьте:
```bash
# Статус контейнеров
docker-compose -f docker-compose.prod.yml ps

# Логи
docker-compose -f docker-compose.prod.yml logs -f

# Доступное место на диске
df -h
```

## Если проблемы остаются
1. Проверьте доступное место на диске: `df -h`
2. Очистите системные кэши: `apt-get clean && apt-get autoremove -y`
3. Используйте минимальную версию: `./deploy-minimal.sh`
4. Обратитесь к администратору сервера для увеличения места на диске