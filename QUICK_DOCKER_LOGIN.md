# 🐳 Быстрый вход в Docker Hub

## 🚀 Решение за 1 минуту:

### 1. Создайте аккаунт Docker Hub (если нет)
- Перейдите на https://hub.docker.com
- Нажмите "Sign Up"
- Заполните форму и подтвердите email

### 2. Авторизуйтесь через скрипт
```bash
./docker-login.sh
```

### 3. Запустите развертывание
```bash
./fix-docker-limits.sh
```

## 🔧 Ручная авторизация:

```bash
# Войдите в Docker Hub
docker login

# Введите ваши данные:
# Username: ваш_username
# Password: ваш_пароль
```

## 📋 Проверка авторизации:

```bash
# Проверьте текущего пользователя
docker info | grep Username

# Проверьте лимиты
curl -I https://registry-1.docker.io/v2/
```

## 🎯 Лимиты после авторизации:

| Аккаунт | Лимит |
|---------|-------|
| Бесплатный | 200 запросов в 6 часов |
| Pro | 5000 запросов в день |

## 🚨 Если проблемы:

### Ошибка "unauthorized":
```bash
# Очистите кэш
rm ~/.docker/config.json
docker login
```

### Ошибка "rate limit":
```bash
# Подождите 1 час или создайте Pro аккаунт
```

### Нет интернета:
```bash
# Используйте offline конфигурацию
./fix-docker-limits.sh
```

## ✅ После успешной авторизации:

```bash
# Запустите развертывание
./fix-docker-limits.sh

# Или полное исправление
./fix-server-complete.sh

# Проверьте результат
docker-compose -f docker-compose.prod.yml ps
```

## 📞 Поддержка:

- 📋 Подробное руководство: [docker-login-guide.md](docker-login-guide.md)
- 🔧 Диагностика: [DOCKER_CONNECT.md](DOCKER_CONNECT.md)
- 🐳 Решение проблем: [DOCKER_HUB_FIX.md](DOCKER_HUB_FIX.md)
