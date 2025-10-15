# 🚀 Развертывание AGB Project на сервере

## 📋 Требования

- Ubuntu 20.04+ или CentOS 8+
- Docker 20.10+
- Docker Compose 2.0+
- Минимум 4GB RAM
- Минимум 20GB свободного места

## 🛠️ Установка Docker

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### CentOS/RHEL:
```bash
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

## 🚀 Быстрое развертывание

1. **Распакуйте архив:**
   ```bash
   tar -xzf agb_deployment.tar.gz
   cd agb_deployment
   ```

2. **Запустите восстановление:**
   ```bash
   ./restore_database.sh
   ```

3. **Откройте приложение:**
   - Frontend: http://YOUR_SERVER_IP
   - Backend API: http://YOUR_SERVER_IP:8000
   - API Docs: http://YOUR_SERVER_IP:8000/docs

## 🔑 Данные для входа

- **Администратор:** admin / admin123
- **Менеджер 1:** manager1 / ManagerPass123!
- **Менеджер 2:** manager2 / ManagerPass123!
- **Сотрудник 1:** employee1 / EmployeePass123!
- **Сотрудник 2:** employee2 / EmployeePass123!
- **ВЭД специалист:** ved_passport1 / VedPass123!
- **Пользователь:** user1 / UserPass123!

## 📊 Что включено

- ✅ Полная база данных с тестовыми данными
- ✅ 7 пользователей со всеми ролями
- ✅ 5 отделов компании
- ✅ 10 сотрудников для раздела "О нас"
- ✅ 7 чатов (общие и личные)
- ✅ 13 тестовых сообщений в чатах
- ✅ Функциональность сопоставления артикулов
- ✅ ИИ сопоставление

## 🛠️ Управление сервисами

```bash
# Просмотр статуса
docker ps

# Просмотр логов
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env logs

# Перезапуск сервисов
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart

# Остановка сервисов
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env down

# Обновление кода
git pull
docker-compose -f config/docker/docker-compose.prod.yml --env-file config/env/production.env restart
```

## 🔧 Настройка

### Изменение портов:
Отредактируйте `config/docker/docker-compose.prod.yml`:
```yaml
ports:
  - "80:80"      # Frontend
  - "8000:8000"  # Backend
```

### Изменение паролей:
Отредактируйте `config/env/production.env`:
```env
ADMIN_PASSWORD=your_new_password
```

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `docker logs CONTAINER_NAME`
2. Проверьте статус: `docker ps`
3. Перезапустите сервисы: `docker-compose restart`

## 🔒 Безопасность

После развертывания:
1. Измените пароли администратора
2. Настройте SSL сертификаты
3. Ограничьте доступ к портам
4. Настройте бэкапы базы данных
