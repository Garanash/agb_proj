# 🚀 AGB Platform + n8n Integration

## Быстрый старт

### 1. Запуск n8n

```bash
# Простой запуск
./scripts/start-n8n.sh

# Или через Makefile
make -f Makefile.n8n n8n-start
```

### 2. Доступ к n8n

- **URL**: http://localhost:5678
- **Логин**: admin
- **Пароль**: admin123

### 3. Тестирование интеграции

```bash
# Тест webhook
make -f Makefile.n8n n8n-test

# Проверка статуса
make -f Makefile.n8n n8n-status

# Просмотр логов
make -f Makefile.n8n n8n-logs
```

## Что включено

### 🔧 Компоненты
- **n8n** - платформа автоматизации
- **Redis** - очереди для выполнения задач
- **PostgreSQL** - база данных для n8n
- **API интеграция** - endpoints для взаимодействия

### 📡 API Endpoints
- `POST /api/v1/n8n/webhook/trigger` - отправка данных в n8n
- `POST /api/v1/n8n/workflow/execute` - выполнение workflow
- `GET /api/v1/n8n/workflow/status/{id}` - статус выполнения
- `GET /api/v1/n8n/workflows` - список workflows
- `GET /api/v1/n8n/health` - проверка здоровья

### 🎯 Автоматические события
- **Создание паспорта ВЭД** → уведомление в Telegram
- **Регистрация пользователя** → email уведомление
- **Создание заявки** → уведомление менеджеру

## Примеры использования

### 1. Создание уведомления в Telegram

1. Откройте n8n: http://localhost:5678
2. Создайте новый workflow
3. Добавьте Webhook trigger с путем `/agb-platform`
4. Добавьте HTTP Request для отправки в Telegram
5. Сохраните и активируйте workflow

### 2. Отправка email при создании паспорта

1. В n8n создайте workflow
2. Настройте фильтр по `event_type = "passport_created"`
3. Добавьте Email Send ноду
4. Настройте шаблон письма

### 3. Интеграция с внешними API

1. Создайте workflow в n8n
2. Добавьте HTTP Request ноду
3. Настройте авторизацию
4. Обработайте данные от AGB Platform

## Управление

### Основные команды

```bash
# Запуск
make -f Makefile.n8n n8n-start

# Остановка
make -f Makefile.n8n n8n-stop

# Перезапуск
make -f Makefile.n8n n8n-restart

# Логи
make -f Makefile.n8n n8n-logs

# Статус
make -f Makefile.n8n n8n-status

# Тест
make -f Makefile.n8n n8n-test
```

### Резервное копирование

```bash
# Создание резервной копии
make -f Makefile.n8n n8n-backup

# Восстановление
make -f Makefile.n8n n8n-restore
```

## Конфигурация

### Переменные окружения

Создайте файл `config/env/n8n.env`:

```env
# n8n Configuration
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_WEBHOOK_URL=http://localhost:5678

# Database
N8N_DB_NAME=n8n
N8N_DB_USER=n8n_user
N8N_DB_PASSWORD=n8n_password

# Authentication
N8N_USER=admin
N8N_PASSWORD=admin123

# Telegram (для уведомлений)
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHAT_ID=your-chat-id
```

## Troubleshooting

### n8n не запускается

```bash
# Проверьте логи
docker logs agb_n8n

# Проверьте зависимости
docker ps | grep postgres
docker ps | grep redis
```

### Webhook не работает

```bash
# Проверьте доступность
curl http://localhost:5678/healthz

# Проверьте webhook
curl -X POST http://localhost:5678/webhook/agb-platform \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### База данных недоступна

```bash
# Создайте БД вручную
docker exec test_platform_postgres psql -U test_user -d test_platform_db -c "CREATE DATABASE n8n;"
```

## Документация

- [Полная документация](docs/N8N_INTEGRATION.md)
- [n8n Documentation](https://docs.n8n.io)
- [API Reference](docs/N8N_INTEGRATION.md#api-reference)

## Поддержка

При возникновении проблем:
1. Проверьте логи: `make -f Makefile.n8n n8n-logs`
2. Проверьте статус: `make -f Makefile.n8n n8n-status`
3. Обратитесь к документации n8n
