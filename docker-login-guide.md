# 🐳 Вход в Docker Hub через команду

## 🔐 Авторизация в Docker Hub

### 1. Создайте аккаунт Docker Hub
Если у вас еще нет аккаунта:
1. Перейдите на https://hub.docker.com
2. Нажмите "Sign Up"
3. Заполните форму регистрации
4. Подтвердите email

### 2. Войдите через команду
```bash
# Авторизация в Docker Hub
docker login

# Введите ваши данные:
# Username: ваш_username
# Password: ваш_пароль
```

### 3. Альтернативный способ (с параметрами)
```bash
# Прямая авторизация с параметрами
docker login -u ваш_username -p ваш_пароль

# Или с токеном (более безопасно)
docker login -u ваш_username --password-stdin
# Затем введите пароль
```

## 🚀 После авторизации

### Проверьте статус авторизации:
```bash
# Проверка текущего пользователя
docker info | grep Username

# Или
cat ~/.docker/config.json
```

### Теперь можете запустить развертывание:
```bash
# Запустите исправление проблем
./fix-docker-limits.sh

# Или полное исправление
./fix-server-complete.sh
```

## 🔧 Автоматизация авторизации

### Создайте скрипт для автоматического входа:
```bash
#!/bin/bash
# auto-docker-login.sh

echo "Введите ваш Docker Hub username:"
read DOCKER_USERNAME

echo "Введите ваш Docker Hub password:"
read -s DOCKER_PASSWORD

echo "Авторизация в Docker Hub..."
echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin

if [ $? -eq 0 ]; then
    echo "✅ Успешная авторизация в Docker Hub!"
    echo "Теперь можете запустить: ./fix-docker-limits.sh"
else
    echo "❌ Ошибка авторизации. Проверьте данные."
fi
```

## 📋 Лимиты после авторизации

| Тип аккаунта | Лимит |
|--------------|-------|
| Бесплатный | 200 запросов в 6 часов |
| Pro | 5000 запросов в день |
| Team | 5000 запросов в день |

## 🚨 Безопасность

### Не храните пароли в скриптах!
```bash
# ❌ НЕ ДЕЛАЙТЕ ТАК:
docker login -u username -p password

# ✅ ДЕЛАЙТЕ ТАК:
docker login
# Или используйте токены
```

### Используйте токены доступа:
1. Перейдите в Docker Hub → Account Settings → Security
2. Создайте "New Access Token"
3. Используйте токен вместо пароля:
```bash
echo "ваш_токен" | docker login -u ваш_username --password-stdin
```

## 🔍 Проверка лимитов

### После авторизации проверьте лимиты:
```bash
# Проверка оставшихся запросов
curl -I https://registry-1.docker.io/v2/

# В заголовке X-RateLimit-Remaining будет показано количество оставшихся запросов
```

## 🎯 Полный процесс

```bash
# 1. Авторизуйтесь в Docker Hub
docker login

# 2. Проверьте авторизацию
docker info | grep Username

# 3. Запустите исправление проблем
./fix-docker-limits.sh

# 4. Проверьте результат
docker-compose -f docker-compose.prod.yml ps
```

## 📞 Если проблемы с авторизацией

### Ошибка "unauthorized":
```bash
# Очистите кэш авторизации
rm ~/.docker/config.json

# Попробуйте снова
docker login
```

### Ошибка "network":
```bash
# Проверьте интернет соединение
ping registry-1.docker.io

# Попробуйте через VPN
```

### Ошибка "rate limit":
```bash
# Подождите 1 час или создайте Pro аккаунт
# Проверьте лимиты:
curl -I https://registry-1.docker.io/v2/
```
