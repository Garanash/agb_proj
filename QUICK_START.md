# 🚀 Быстрый старт - AGB Production

## Развертывание на сервере

### 1. Загрузите архив на сервер
```bash
scp agb-production-*.tar.gz root@37.252.20.46:/root/
```

### 2. Подключитесь к серверу
```bash
ssh root@37.252.20.46
```

### 3. Распакуйте архив
```bash
cd /root
tar -xzf agb-production-*.tar.gz
cd agb-production
```

### 4. Запустите полное исправление
```bash
chmod +x fix-server-complete.sh
./fix-server-complete.sh
```

### 5. Проверьте результат
```bash
# Статус сервисов
docker-compose -f docker-compose.prod.yml ps

# Доступность приложения
curl http://localhost
```

## Что делает скрипт `fix-server-complete.sh`:

1. **Останавливает все контейнеры**
2. **Очищает Docker кэш** (освобождает место на диске)
3. **Очищает системные пакеты и логи**
4. **Создает `production.env`** с базовыми настройками
5. **Пересобирает все сервисы** с правильными конфигурациями
6. **Проверяет доступность** всех компонентов

## Решенные проблемы:

- ✅ `no space left on device` - освобождение места на диске
- ✅ `Module not found: Can't resolve '@/utils/api'` - исправление путей Next.js
- ✅ `WARNING: The DATABASE_URL variable is not set` - создание production.env
- ✅ Проблемы со сборкой фронтенда - оптимизированный Dockerfile

## Доступ к приложению:

- **Основной сайт**: http://localhost
- **Фронтенд**: http://localhost:3000  
- **Бекенд API**: http://localhost:8000

## Полезные команды:

```bash
# Мониторинг
docker-compose -f docker-compose.prod.yml logs -f

# Перезапуск
docker-compose -f docker-compose.prod.yml restart

# Остановка
docker-compose -f docker-compose.prod.yml down

# Обновление
./update.sh
```

## Если что-то пошло не так:

1. Проверьте логи: `docker-compose -f docker-compose.prod.yml logs`
2. Запустите скрипт еще раз: `./fix-server-complete.sh`
3. Проверьте место на диске: `df -h`

## Поддержка:

- 📋 Подробная документация: [README_PRODUCTION.md](README_PRODUCTION.md)
- 🔧 Быстрое исправление: [QUICK_FIX.md](QUICK_FIX.md)
- 📖 Полная документация: [DEPLOYMENT.md](DEPLOYMENT.md)
