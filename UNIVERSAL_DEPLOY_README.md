# 🚀 Универсальное развертывание AGB проекта

## 📋 Особенности универсального развертывания

✅ **Автоматическое определение сервера** - система сама определяет IP и hostname
✅ **Работает на любом сервере** - localhost, VPS, облако, etc.
✅ **Нет жестко закодированных URL** - все роуты настраиваются автоматически
✅ **Гибкая конфигурация** - через переменные окружения

## 🛠️ Быстрое развертывание

### Шаг 1: Подготовка
```bash
# Клонируйте или скопируйте проект на сервер
git clone <your-repo> agb_project
cd agb_project

# Сделайте скрипты исполняемыми
chmod +x *.sh
```

### Шаг 2: Универсальное развертывание
```bash
# Запустите универсальный скрипт развертывания
./universal_deploy.sh
```

### Шаг 3: Доступ к системе
После развертывания скрипт покажет URL для доступа:
```
🌐 Веб-интерфейс: http://ВАШ_IP/login
👤 Логин: admin
🔑 Пароль: admin123
```

## 📁 Структура файлов

```
agb_project/
├── universal_deploy.sh      # 🆕 Универсальный скрипт развертывания
├── env.example              # 📋 Пример конфигурации
├── docker-compose.yml       # 🔧 Обновлен для переменных окружения
├── frontend/utils/api.ts    # 🔧 Исправлен для автоопределения URL
├── nginx/nginx.conf         # 🔧 CORS исправлен
└── backend/main.py          # 🔧 CORS отключен (дублирование)
```

## ⚙️ Ручная настройка (опционально)

### Создание .env файла
```bash
# Скопируйте пример конфигурации
cp env.example .env

# Отредактируйте под свои нужды
nano .env
```

### Пример .env файла
```bash
# Настройки сервера
SERVER_IP=192.168.1.100
SERVER_DOMAIN=your-domain.com

# Настройки базы данных
POSTGRES_DB=agb_felix
POSTGRES_USER=felix_user
POSTGRES_PASSWORD=secure_password

# Настройки админа
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@your-domain.com

# Фронтенд (оставить пустым для автоопределения)
NEXT_PUBLIC_API_URL=
```

## 🌐 Как работает автоопределение

### Frontend API URL
```typescript
// В frontend/utils/api.ts
export const getApiUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin; // Автоматически определяет текущий сервер
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://backend:8000';
};
```

### Результат:
- **Локально**: `http://localhost` → `http://localhost/api/auth/login`
- **По IP**: `http://192.168.1.100` → `http://192.168.1.100/api/auth/login`
- **По домену**: `http://your-domain.com` → `http://your-domain.com/api/auth/login`

## 🔧 Управление системой

### Остановить проект
```bash
docker-compose down
```

### Перезапустить
```bash
docker-compose restart
```

### Просмотр логов
```bash
# Все сервисы
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только nginx
docker-compose logs -f nginx
```

### Обновление проекта
```bash
# Остановить
docker-compose down

# Обновить код
git pull

# Перезапустить
./universal_deploy.sh
```

## 🌍 Развертывание на разных платформах

### VPS/VDS сервер
```bash
# На вашем VPS
./universal_deploy.sh
# Система автоматически определит IP и настроится
```

### Локальная машина
```bash
# Для разработки
./universal_deploy.sh
# Доступ: http://localhost/login
```

### Docker сервер
```bash
# На Docker хосте
./universal_deploy.sh
# Система определит внешний IP
```

### За прокси/Nginx
```bash
# Если у вас есть внешний Nginx
./universal_deploy.sh
# Настройте внешний Nginx для проксирования на порт 80
```

## 🔒 Безопасность

### Измените пароли
```bash
# В .env файле
ADMIN_PASSWORD=your_secure_password
POSTGRES_PASSWORD=your_secure_db_password
SECRET_KEY=your_super_secret_key
```

### Настройте домен (опционально)
```bash
# В .env файле
SERVER_DOMAIN=your-domain.com

# Настройте DNS для домена
```

### SSL/HTTPS (рекомендуется)
```bash
# В nginx.conf раскомментируйте HTTPS секцию
# Настройте SSL сертификаты
```

## 🚨 Устранение проблем

### Проблема: Не удается определить IP
```bash
# Ручная настройка
echo "SERVER_IP=192.168.1.100" >> .env
./universal_deploy.sh
```

### Проблема: CORS ошибки
```bash
# Проверьте nginx конфигурацию
docker exec agb_nginx nginx -T
```

### Проблема: База данных не запускается
```bash
# Проверьте логи PostgreSQL
docker-compose logs postgres

# Пересоздайте базу
docker-compose down
docker volume rm agb_proj_postgres_data
./universal_deploy.sh
```

### Проблема: Frontend не загружается
```bash
# Очистите кеш Next.js
docker exec agb_frontend rm -rf /app/.next
docker-compose restart frontend
```

## 📞 Поддержка

При проблемах:
1. Проверьте логи: `docker-compose logs`
2. Проверьте переменные: `cat .env`
3. Проверьте сеть: `docker network ls`

## 🎯 Преимущества универсального развертывания

✅ **Автоматическая настройка** - не нужно вручную настраивать IP
✅ **Гибкость** - работает на любом сервере
✅ **Безопасность** - переменные окружения
✅ **Простота** - один скрипт для всего
✅ **Масштабируемость** - легко переносить между серверами

---

**🚀 Готово к развертыванию на любом сервере!** 🎉
