# Быстрое исправление проблем на сервере

## Проблема
Сервер не может собрать фронтенд из-за:
1. Ошибок в коде (дублирование функций)
2. Нехватки места на диске
3. Проблем с конфигурацией Next.js

## Решение

### Автоматическое исправление (рекомендуется)
```bash
./fix-server-issues.sh
```

### Ручное исправление
Если автоматическое исправление не работает:

1. **Подключитесь к серверу:**
   ```bash
   ssh root@37.252.20.46
   ```

2. **Очистите сервер:**
   ```bash
   cd /root/agb_proj
   docker-compose -f docker-compose.prod.yml down
   docker system prune -a -f --volumes
   apt-get clean && apt-get autoremove -y
   ```

3. **Запустите минимальную версию:**
   ```bash
   chmod +x deploy-minimal.sh
   ./deploy-minimal.sh
   ```

## Что было исправлено

### 1. Код фронтенда
- Удалено дублирование функции `getStatusText` в `service-engineer/page.tsx`
- Исправлена конфигурация Next.js (`next.config.js`)

### 2. Docker
- Создан оптимизированный `Dockerfile.prod.minimal`
- Создан `docker-compose.minimal.yml` без Nginx
- Уменьшено использование места на диске

### 3. Скрипты
- `fix-server-issues.sh` - автоматическое исправление
- `cleanup-server.sh` - очистка сервера
- `deploy-minimal.sh` - развертывание минимальной версии

## Проверка результата
```bash
# Статус контейнеров
ssh root@37.252.20.46 'cd /root/agb_proj && docker-compose -f docker-compose.minimal.yml ps'

# Логи
ssh root@37.252.20.46 'cd /root/agb_proj && docker-compose -f docker-compose.minimal.yml logs -f'

# Доступность
curl http://37.252.20.46:3000
curl http://37.252.20.46:8000/api/health
```

## Если проблемы остаются
1. Проверьте место на диске: `df -h`
2. Очистите системные кэши: `apt-get clean && apt-get autoremove -y`
3. Обратитесь к администратору сервера для увеличения места на диске