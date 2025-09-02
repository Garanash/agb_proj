# 🚀 Быстрое исправление проблем на сервере

## Если у вас проблемы с развертыванием:

### 1. Зайдите на сервер
```bash
ssh root@37.252.20.46
cd /root/agb_proj
```

### 2. Запустите полный скрипт исправления
```bash
./fix-server-complete.sh
```

Этот скрипт автоматически:
- ✅ Остановит все контейнеры
- ✅ Очистит Docker кэш и освободит место на диске
- ✅ Очистит системные пакеты и логи
- ✅ Создаст `production.env` если его нет
- ✅ Пересоберет и запустит все сервисы
- ✅ Проверит доступность всех компонентов

### 3. Проверьте результат
```bash
# Статус сервисов
docker-compose -f docker-compose.prod.yml ps

# Логи
docker-compose -f docker-compose.prod.yml logs -f

# Доступность
curl http://localhost
```

## Если проблемы остались:

### Проверьте место на диске
```bash
df -h
```

### Очистите вручную
```bash
docker system prune -af --volumes
apt-get clean && apt-get autoremove -y
```

### Перезапустите
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build
```

## Основные проблемы и решения:

| Проблема | Решение |
|----------|---------|
| `no space left on device` | Запустите `./fix-server-complete.sh` |
| `Module not found: Can't resolve '@/utils/api'` | Скрипт исправит конфигурацию Next.js |
| `WARNING: The DATABASE_URL variable is not set` | Скрипт создаст `production.env` |
| Фронтенд не собирается | Скрипт пересоберет с правильными настройками |

## Контакты для поддержки:
- 📧 Email: support@yourdomain.com
- 📱 Telegram: @your_support_bot
