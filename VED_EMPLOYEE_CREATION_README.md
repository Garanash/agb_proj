# 👤 Создание сотрудника ВЭД

## 📋 Обзор

Созданы скрипты для быстрого создания сотрудника ВЭД с логином `d.li` и паролем `123456`.

## 🚀 Быстрое создание

### Вариант 1: Самая простая команда
```bash
./create_ved.sh
```

### Вариант 2: С указанием параметров
```bash
./create_ved.sh d.li 123456
./create_ved.sh username password
```

## 🔧 Детальные скрипты

### Полный скрипт с диагностикой
```bash
./scripts/create_ved_employee.sh
./scripts/create_ved_employee.sh d.li 123456
```

### Серверный скрипт (на сервере)
```bash
./scripts/server_create_ved_employee.sh
./scripts/server_create_ved_employee.sh d.li 123456
```

## 📋 Параметры по умолчанию

| Параметр | Значение | Описание |
|----------|----------|----------|
| Логин | `d.li` | Имя пользователя |
| Пароль | `123456` | Пароль для входа |
| Email | `d.li@example.com` | Email адрес |
| Имя | `Дмитрий` | Имя |
| Фамилия | `Ли` | Фамилия |
| Роль | `ved_passport` | Роль ВЭД специалиста |
| Должность | `Специалист ВЭД` | Должность |

## 🎯 Как использовать

### На сервере:
```bash
# 1. Перейдите в директорию проекта
cd /root/agb_proj

# 2. Запустите простой скрипт
./create_ved.sh

# 3. Или полный скрипт
./scripts/server_create_ved_employee.sh
```

### На локальной машине:
```bash
# 1. Запустите простой скрипт
./create_ved.sh

# 2. Или полный скрипт
./scripts/create_ved_employee.sh
```

## 🔍 Проверка создания

После создания пользователя проверьте:

```bash
# Проверка в списке пользователей
curl -X GET "http://localhost:8000/api/v1/users/list" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Тестирование логина
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "d.li", "password": "123456"}'
```

## 📊 Результат

После успешного выполнения скрипта:

✅ **Создан пользователь:**
- Логин: `d.li`
- Пароль: `123456`
- Роль: `ВЭД специалист`
- Email: `d.li@example.com`

✅ **Доступ к системе:**
- Frontend: http://your-server-ip:3000
- API: http://your-server-ip:8000

✅ **Возможности:**
- Работа с ВЭД паспортами
- Управление номенклатурой
- Доступ к административным функциям ВЭД

## 🔧 Настройка

### Изменение параметров по умолчанию:

Отредактируйте скрипты:
```bash
# В create_ved.sh измените переменные:
USERNAME=${1:-d.li}    # Логин по умолчанию
PASSWORD=${2:-123456}  # Пароль по умолчанию

# В scripts/create_ved_employee.sh измените переменные:
USERNAME="${1:-d.li}"
PASSWORD="${2:-123456}"
```

### Создание других сотрудников:

```bash
# Создать менеджера
./create_ved_employee.sh manager1 ManagerPass123!

# Создать сотрудника
./create_ved_employee.sh employee1 EmployeePass123!

# Создать администратора
./create_ved_employee.sh admin2 AdminPass123!
```

## 🚨 Важные замечания

- **Пароль администратора:** `admin` / `rNHVZ29Xcpi6`
- **API URL:** `http://localhost:8000`
- **Требуются права администратора** для создания пользователей
- **Пользователь создается активным** и с флагом `is_password_changed: true`

## 📞 Поддержка

При возникновении проблем:

1. **Проверьте логи backend:**
   ```bash
   docker logs agb_backend_prod
   ```

2. **Проверьте доступность API:**
   ```bash
   curl http://localhost:8000/api/health
   ```

3. **Проверьте токен администратора:**
   ```bash
   curl -X POST "http://localhost:8000/api/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"username": "admin", "password": "rNHVZ29Xcpi6"}'
   ```

---

**Создано:** $(date)  \
**Версия:** v1.0  \
**Репозиторий:** https://github.com/Garanash/agb_proj
