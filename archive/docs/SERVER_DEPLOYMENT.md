# 🚀 Развертывание AGB Project на сервере

## 📋 Быстрый старт

### 1. Подготовка сервера
```bash
# Скачайте проект на сервер
git clone https://github.com/Garanash/agb_proj.git
cd agb_proj

# Или если git не работает, скачайте архив
wget https://github.com/Garanash/agb_proj/archive/master.zip
unzip master.zip
mv agb_proj-master agb_proj
cd agb_proj
```

### 2. Автоматическое развертывание
```bash
# Запустите основной скрипт развертывания
sudo ./deploy-server.sh
```

### 3. Настройка API ключей (опционально)
```bash
# Настройте API ключи и домен
./setup-api-keys.sh
```

## 🔧 Что делает скрипт deploy-server.sh

1. **Проверяет права root** - скрипт должен запускаться с правами администратора
2. **Устанавливает Docker** - если не установлен
3. **Устанавливает Docker Compose** - если не установлен
4. **Создает production.env** - с автоматически сгенерированными паролями
5. **Исправляет OCR Dockerfile** - заменяет устаревшие пакеты
6. **Очищает старые контейнеры** - удаляет предыдущие версии
7. **Собирает и запускает проект** - создает все Docker образы и запускает сервисы
8. **Проверяет статус** - показывает состояние всех сервисов
9. **Показывает информацию о доступе** - логины, пароли, URL

## 🌐 Доступ к приложению

После успешного развертывания:

- **Главная страница**: http://localhost
- **API**: http://localhost/api
- **Backend (прямой)**: http://localhost:8000
- **Frontend (прямой)**: http://localhost:3000

### Данные для входа:
- **Логин**: admin
- **Пароль**: (автоматически сгенерирован, показывается в конце скрипта)

## 🔑 Настройка API ключей

После развертывания настройте API ключи:

```bash
./setup-api-keys.sh
```

Скрипт запросит:
- OpenAI API Key
- Polza API Key
- Домен (для production)
- Email для SSL сертификатов

## 🛠️ Управление сервисами

```bash
# Просмотр статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down

# Перезапуск
docker-compose restart

# Полная пересборка
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 🔍 Диагностика проблем

### Проверка логов
```bash
# Все сервисы
docker-compose logs

# Конкретный сервис
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Проверка статуса
```bash
# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker stats

# Проверка портов
netstat -tlnp | grep -E ':(80|3000|8000|5432|6379)'
```

### Перезапуск проблемного сервиса
```bash
# Перезапуск конкретного сервиса
docker-compose restart backend
docker-compose restart frontend
docker-compose restart nginx
```

## 📁 Структура проекта

```
agb_proj/
├── deploy-server.sh          # Основной скрипт развертывания
├── setup-api-keys.sh         # Скрипт настройки API ключей
├── docker-compose.yml        # Конфигурация Docker Compose
├── config/
│   └── env/
│       └── production.env    # Переменные окружения
├── backend/                  # Backend (FastAPI)
├── frontend/                 # Frontend (Next.js)
├── infrastructure/
│   ├── nginx/               # Nginx конфигурация
│   └── ocr/                 # OCR сервис
└── scripts/                 # Вспомогательные скрипты
```

## 🔒 Безопасность

### Обязательно измените:
1. **Пароли администратора** в `config/env/production.env`
2. **SECRET_KEY** для JWT токенов
3. **Пароли базы данных**
4. **API ключи** на реальные

### Для production:
1. Настройте SSL сертификаты
2. Используйте сильные пароли
3. Настройте файрвол
4. Регулярно обновляйте зависимости

## 🆘 Поддержка

Если возникли проблемы:

1. Проверьте логи: `docker-compose logs -f`
2. Проверьте статус: `docker-compose ps`
3. Перезапустите сервисы: `docker-compose restart`
4. Очистите и пересоберите: `docker-compose down -v && docker-compose up -d --build`

## 📝 Логи

Логи сохраняются в:
- **Docker логи**: `docker-compose logs`
- **Файлы логов**: `logs/` (если настроено)
- **Системные логи**: `journalctl -u docker`

---

**Удачного развертывания! 🚀**
