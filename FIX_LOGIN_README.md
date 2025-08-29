# 🔧 Исправление проблемы с логином админа

## 📋 Диагностика проблемы

Если у вас проблема с входом админа, выполните полную диагностику:

```bash
cd /root/agb_proj
./diagnose_login_issue.sh
```

## 🎯 Найденная проблема

Из диагностики видно, что:
- ✅ Все сервисы работают (nginx, backend, postgres)
- ✅ API доступно через оба пути
- ❌ Логин возвращает 401 Unauthorized
- ❌ Причина: неправильный хеш пароля в базе данных

## 🚀 Решение проблемы

### Способ 1: Автоматическое исправление (рекомендуется)

```bash
cd /root/agb_proj
chmod +x fix_login_issue.sh
./fix_login_issue.sh
```

### Способ 2: Ручное исправление

```bash
# 1. Подключитесь к backend контейнеру
docker exec -it agb_backend bash

# 2. Отладьте проблему с паролем
python debug_password.py

# 3. Исправьте пароль
python quick_fix_password.py

# 4. Протестируйте исправление
python test_login_after_fix.py

# 5. Выйдите из контейнера
exit
```

### Способ 3: Ручное исправление через базу данных

```bash
# Подключитесь к PostgreSQL
docker exec -it agb_postgres psql -U felix_user -d agb_felix

# Исправьте пароль (замените на правильный хеш)
UPDATE users SET hashed_password = '$2b$12$3hUFZdySaUzOeoGhfU7mseCvReNSdWuoEymkZHz8/ycZHzAHLtgQm' WHERE username = 'admin';

# Проверьте результат
SELECT username, hashed_password FROM users WHERE username = 'admin';

# Выйдите из PostgreSQL
\q
```

## 🔑 Данные для входа

После исправления используйте:

- **Логин:** `admin`
- **Пароль:** `admin123`
- **Email:** `admin@almazgeobur.ru`

## 🧪 Тестирование

### Тест через браузер:
1. Откройте http://ВАШ_СЕРВЕР/login
2. Введите логин: `admin`
3. Введите пароль: `admin123`
4. Нажмите "Войти"

### Тест через API:
```bash
# Через nginx
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Через backend напрямую
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Ожидаемый результат:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "username": "admin",
    "email": "admin@almazgeobur.ru",
    "first_name": "Администратор",
    "last_name": "Системы",
    "role": "admin",
    "is_active": true
  }
}
```

## 🔍 Дополнительная диагностика

Если проблема сохраняется, проверьте:

1. **Логи backend:**
   ```bash
   docker logs agb_backend
   ```

2. **Логи nginx:**
   ```bash
   docker logs agb_nginx
   ```

3. **Состояние базы данных:**
   ```bash
   docker exec agb_postgres psql -U felix_user -d agb_felix -c "SELECT * FROM users WHERE username = 'admin';"
   ```

## 💡 Возможные дополнительные проблемы

### Проблема 1: CORS блокирует запросы
```bash
# Проверьте CORS headers
curl -I http://localhost/api/auth/login
```

### Проблема 2: Nginx не проксирует запросы
```bash
# Проверьте конфигурацию nginx
docker exec agb_nginx nginx -T | grep -A 10 "location /api"
```

### Проблема 3: Backend не отвечает
```bash
# Проверьте здоровье backend
curl http://localhost:8000/api/health
```

## 📞 Поддержка

Если проблема не решена, предоставьте:
1. Вывод команды `./diagnose_login_issue.sh`
2. Логи backend: `docker logs agb_backend`
3. Логи nginx: `docker logs agb_nginx`

---

**✅ Статус:** Проблема диагностирована и исправлена
**🎯 Решение:** Исправлен хеш пароля админа в базе данных
