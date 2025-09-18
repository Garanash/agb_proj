# Интеграция с n8n

## Обзор

n8n - это платформа автоматизации с открытым исходным кодом, которая позволяет создавать сложные рабочие процессы (workflows) для автоматизации бизнес-процессов. Интеграция с AGB Platform позволяет автоматизировать уведомления, обработку данных и другие процессы.

## Архитектура интеграции

```
AGB Platform → n8n Webhook → Workflow → External Services
     ↓              ↓            ↓
  Events      Processing    Notifications
```

## Компоненты интеграции

### 1. Docker контейнеры
- **n8n**: Основной сервис автоматизации
- **Redis**: Очереди для выполнения задач
- **PostgreSQL**: База данных для n8n (отдельная от основной платформы)

### 2. API Endpoints
- `/api/v1/n8n/webhook/trigger` - Отправка данных в n8n
- `/api/v1/n8n/workflow/execute` - Выполнение workflow
- `/api/v1/n8n/workflow/status/{execution_id}` - Статус выполнения
- `/api/v1/n8n/workflows` - Список доступных workflows
- `/api/v1/n8n/events/*` - Обработчики событий платформы

### 3. Webhook Events
- `passport_created` - Создание паспорта ВЭД
- `user_registered` - Регистрация пользователя
- `request_created` - Создание заявки на ремонт

## Установка и запуск

### 1. Быстрый запуск

```bash
# Запуск n8n с интеграцией
./scripts/start-n8n.sh
```

### 2. Ручной запуск

```bash
# 1. Запуск основных сервисов
docker-compose -f config/docker/docker-compose.yml up -d postgres

# 2. Запуск n8n
docker-compose -f config/docker/docker-compose.n8n.yml up -d

# 3. Проверка статуса
docker ps | grep n8n
```

### 3. Полный запуск платформы с n8n

```bash
# Запуск всей платформы включая n8n
docker-compose -f config/docker/docker-compose.yml up -d
```

## Конфигурация

### 1. Переменные окружения

Создайте файл `config/env/n8n.env`:

```env
# n8n Configuration
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_WEBHOOK_URL=http://localhost:5678

# n8n Database Configuration
N8N_DB_NAME=n8n
N8N_DB_USER=n8n_user
N8N_DB_PASSWORD=n8n_password

# n8n Authentication
N8N_USER=admin
N8N_PASSWORD=admin123

# n8n API Configuration
N8N_API_KEY=your-n8n-api-key-here

# Telegram Integration
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_CHAT_ID=your-telegram-chat-id
```

### 2. Настройка webhook

Webhook URL для интеграции: `http://localhost:5678/webhook/agb-platform`

## Использование

### 1. Доступ к n8n

- **URL**: http://localhost:5678
- **Логин**: admin
- **Пароль**: admin123

### 2. Создание workflow

1. Откройте n8n в браузере
2. Создайте новый workflow
3. Добавьте Webhook trigger с путем `/agb-platform`
4. Настройте обработку данных
5. Добавьте действия (уведомления, API вызовы и т.д.)

### 3. Тестирование интеграции

```bash
# Отправка тестового события
curl -X POST http://localhost:8000/api/v1/n8n/events/passport-created \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "passport_number": "TEST-001",
    "order_number": "ORDER-001",
    "creator": {
      "first_name": "Иван",
      "last_name": "Иванов"
    }
  }'
```

### 4. Мониторинг

```bash
# Логи n8n
docker logs agb_n8n

# Статус сервисов
docker ps | grep -E "(n8n|redis)"

# Проверка здоровья
curl http://localhost:5678/healthz
```

## Примеры workflows

### 1. Уведомления в Telegram

```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "agb-platform",
        "httpMethod": "POST"
      }
    },
    {
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://api.telegram.org/bot{{ $credentials.telegramBotToken }}/sendMessage",
        "method": "POST",
        "body": {
          "chat_id": "{{ $credentials.telegramChatId }}",
          "text": "🆕 Новый паспорт ВЭД: {{ $json.data.passport_number }}"
        }
      }
    }
  ]
}
```

### 2. Отправка email уведомлений

```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "agb-platform",
        "httpMethod": "POST"
      }
    },
    {
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "toEmail": "admin@company.com",
        "subject": "Новое событие в AGB Platform",
        "message": "Событие: {{ $json.event_type }}"
      }
    }
  ]
}
```

## API Reference

### Webhook Trigger

**POST** `/webhook/agb-platform`

```json
{
  "event_type": "passport_created",
  "data": {
    "passport_number": "PASSPORT-001",
    "order_number": "ORDER-001",
    "creator": {
      "id": 1,
      "first_name": "Иван",
      "last_name": "Иванов"
    }
  },
  "timestamp": "2024-01-01T12:00:00Z",
  "source": "agb_platform"
}
```

### Workflow Execution

**POST** `/api/v1/n8n/workflow/execute`

```json
{
  "workflow_id": "workflow-123",
  "data": {
    "custom_field": "value"
  },
  "wait_for_result": false
}
```

## Troubleshooting

### 1. n8n не запускается

```bash
# Проверьте логи
docker logs agb_n8n

# Проверьте переменные окружения
docker exec agb_n8n env | grep N8N

# Перезапустите с очисткой
docker-compose -f config/docker/docker-compose.n8n.yml down
docker-compose -f config/docker/docker-compose.n8n.yml up -d
```

### 2. Webhook не работает

```bash
# Проверьте доступность n8n
curl http://localhost:5678/healthz

# Проверьте webhook URL
curl -X POST http://localhost:5678/webhook/agb-platform \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### 3. База данных недоступна

```bash
# Проверьте PostgreSQL
docker exec test_platform_postgres psql -U test_user -d n8n -c "SELECT 1;"

# Создайте базу данных вручную
docker exec test_platform_postgres psql -U test_user -d test_platform_db -c "CREATE DATABASE n8n;"
```

## Безопасность

### 1. Аутентификация
- n8n использует Basic Auth (admin/admin123 по умолчанию)
- API endpoints требуют JWT токен от AGB Platform

### 2. Сетевая безопасность
- n8n доступен только внутри Docker сети
- Внешний доступ только через порт 5678

### 3. Данные
- Все данные n8n хранятся в отдельной базе данных
- Workflows и credentials изолированы

## Мониторинг и логирование

### 1. Логи n8n
```bash
# Просмотр логов
docker logs agb_n8n -f

# Логи с фильтрацией
docker logs agb_n8n 2>&1 | grep ERROR
```

### 2. Метрики
- n8n предоставляет встроенные метрики
- Доступны через `/metrics` endpoint

### 3. Мониторинг workflows
- Статус выполнения в n8n UI
- API для получения статуса через AGB Platform

## Расширение функциональности

### 1. Добавление новых событий
1. Создайте новый endpoint в `n8n_integration.py`
2. Добавьте обработку в workflow
3. Обновите документацию

### 2. Интеграция с внешними сервисами
1. Добавьте credentials в n8n
2. Создайте новый workflow
3. Настройте webhook trigger

### 3. Кастомные ноды
1. Создайте кастомную ноду в `/data/custom`
2. Перезапустите n8n
3. Используйте в workflows

## Поддержка

При возникновении проблем:
1. Проверьте логи: `docker logs agb_n8n`
2. Проверьте статус: `docker ps | grep n8n`
3. Проверьте конфигурацию: `config/env/n8n.env`
4. Обратитесь к документации n8n: https://docs.n8n.io
