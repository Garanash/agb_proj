# 🚀 AGB Project - Быстрый запуск

## Одна команда для запуска всего!

### 🚀 Запуск продакшн среды
```bash
./quick-start.sh
```

### 🛑 Остановка всех сервисов
```bash
./stop-all.sh
```

### 📊 Проверка статуса
```bash
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env ps
```

### 📋 Логи сервисов
```bash
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env logs -f
```

## Что делает `quick-start.sh`:

1. ✅ Проверяет системные требования
2. 📝 Создает конфигурацию (если не существует)
3. 🛑 Останавливает существующие контейнеры
4. 🚀 Запускает все сервисы
5. ⏳ Ждет готовности (3 минуты)
6. 📊 Показывает статус
7. 🎉 Готово!

## Доступные сервисы после запуска:

- 🌐 **Frontend**: http://localhost
- 🔧 **Backend API**: http://localhost:8000
- 📚 **Swagger UI**: http://localhost:8000/docs
- ❤️ **Health Check**: http://localhost/api/health

## Учетные данные:

- 👤 **Логин**: `admin`
- 🔑 **Пароль**: генерируется автоматически и показывается в консоли

## Управление:

- 🚀 **Запуск**: `./quick-start.sh`
- 🛑 **Остановка**: `./stop-all.sh`
- 🔄 **Перезапуск**: `./stop-all.sh && ./quick-start.sh`

## Требования:

- Docker
- Docker Compose
- Интернет для скачивания образов

---

**Теперь запуск всего проекта - это одна команда!** 🎉
