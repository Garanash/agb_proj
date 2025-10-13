# 🚀 Быстрый деплой на сервер

## Подготовка сервера

```bash
# 1. Клонируем репозиторий
git clone https://github.com/Garanash/agb_proj.git
cd agb_proj

# 2. Исправляем проблемы с зависимостями (если есть ошибки)
sudo ./scripts/production/fix-server-issues.sh

# 3. Создаем .env файл
./create-env.sh

# 4. Редактируем конфигурацию
nano .env.production
```

## Исправление проблем

Если возникают ошибки типа:
- `pip: command not found`
- `Node.js не установлен`
- `Pool overlaps with other one on this address space`

```bash
# Быстрое исправление всех проблем
sudo ./scripts/production/fix-server-issues.sh

# Перезагрузка сервера
sudo reboot
```

## Запуск

```bash
# 1. Запускаем Docker сервисы (БД, Redis, N8N, Nginx)
./scripts/production/deploy-production.sh

# 2. В отдельном терминале - Backend
./scripts/production/start-backend.sh

# 3. В отдельном терминале - Frontend
./scripts/production/start-frontend.sh
```

## Проверка

```bash
# Проверяем статус
docker-compose -f docker-compose.production.yml ps

# Проверяем доступность
curl http://localhost/health
curl http://localhost/api/v1/auth/me
curl http://localhost/n8n/
```

## Архитектура

- **Frontend**: http://localhost:3000 → http://localhost/
- **Backend**: http://localhost:8000 → http://localhost/api/
- **N8N**: http://localhost:5678 → http://localhost/n8n/
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## Мониторинг

```bash
# Логи всех сервисов
docker-compose -f docker-compose.production.yml logs -f

# Логи приложения
tail -f logs/backend.log
tail -f logs/frontend.log
```

## Остановка

```bash
# Остановка Docker сервисов
docker-compose -f docker-compose.production.yml down

# Остановка приложения (Ctrl+C в терминалах backend/frontend)
```

## Диагностика проблем

Если возникают проблемы:

```bash
# Универсальное исправление всех проблем
./scripts/production/fix-all-issues.sh

# Диагностика всех проблем
./scripts/production/diagnose-server.sh

# Исправление конкретных проблем
./scripts/production/fix-redis.sh
./scripts/production/fix-nginx.sh
./scripts/production/fix-network-issues.sh

# Просмотр логов
docker-compose -f docker-compose.production.yml logs -f
```

### Типичные проблемы и решения:

- **Redis требует аутентификацию** → `./scripts/production/fix-redis.sh`
- **Nginx перезапускается** → `./scripts/production/fix-network-issues.sh`
- **N8N не отвечает** → Подождите инициализации (до 2 минут)
- **Все проблемы сразу** → `./scripts/production/fix-all-issues.sh`
