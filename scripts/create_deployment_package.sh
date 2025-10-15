#!/bin/bash

echo "📦 СОЗДАНИЕ АРХИВА ДЛЯ РАЗВЕРТЫВАНИЯ НА СЕРВЕРЕ"
echo "=============================================="

# Проверяем наличие необходимых файлов
REQUIRED_FILES=(
    "database_backup_full.sql"
    "scripts/restore_database.sh"
    "config/docker/docker-compose.prod.yml"
    "config/env/production.env"
    "backend/"
    "frontend/"
    "infrastructure/"
)

echo "🔍 Проверка необходимых файлов..."
for file in "${REQUIRED_FILES[@]}"; do
    if [ -e "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - НЕ НАЙДЕН!"
        exit 1
    fi
done

# Создаем директорию для архива
ARCHIVE_DIR="deployment_package"
echo ""
echo "📁 Создание директории архива: $ARCHIVE_DIR"
rm -rf "$ARCHIVE_DIR"
mkdir -p "$ARCHIVE_DIR"

# Копируем необходимые файлы
echo ""
echo "📋 Копирование файлов в архив..."

# Основные файлы
cp database_backup_full.sql "$ARCHIVE_DIR/"
cp scripts/restore_database.sh "$ARCHIVE_DIR/"
chmod +x "$ARCHIVE_DIR/restore_database.sh"

# Docker конфигурация
mkdir -p "$ARCHIVE_DIR/config/docker"
cp config/docker/docker-compose.prod.yml "$ARCHIVE_DIR/config/docker/"

# Environment файлы
mkdir -p "$ARCHIVE_DIR/config/env"
cp config/env/production.env "$ARCHIVE_DIR/config/env/"

# Backend
echo "📦 Копирование backend..."
cp -r backend "$ARCHIVE_DIR/"

# Frontend
echo "📦 Копирование frontend..."
cp -r frontend "$ARCHIVE_DIR/"

# Infrastructure
echo "📦 Копирование infrastructure..."
cp -r infrastructure "$ARCHIVE_DIR/"

# Создаем README для развертывания
echo ""
echo "📝 Создание README для развертывания..."
cat > "$ARCHIVE_DIR/README_DEPLOYMENT.md" << 'EOF'
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
EOF

# Создаем скрипт быстрого развертывания
echo ""
echo "📝 Создание скрипта быстрого развертывания..."
cat > "$ARCHIVE_DIR/quick_deploy.sh" << 'EOF'
#!/bin/bash

echo "🚀 БЫСТРОЕ РАЗВЕРТЫВАНИЕ AGB PROJECT"
echo "===================================="

# Проверяем права
if [ "$EUID" -eq 0 ]; then
    echo "❌ Не запускайте скрипт от root!"
    echo "   Используйте обычного пользователя с правами sudo"
    exit 1
fi

# Проверяем Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен!"
    echo "   Установите Docker и Docker Compose"
    exit 1
fi

# Проверяем права на Docker
if ! docker ps &> /dev/null; then
    echo "❌ Нет прав на Docker!"
    echo "   Добавьте пользователя в группу docker:"
    echo "   sudo usermod -aG docker $USER"
    echo "   Затем перелогиньтесь"
    exit 1
fi

echo "✅ Docker готов к работе"

# Запускаем восстановление
echo ""
echo "🔄 Запуск восстановления базы данных..."
./restore_database.sh

echo ""
echo "🎉 РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
echo ""
echo "🌐 Приложение доступно по адресу:"
echo "   Frontend: http://$(curl -s ifconfig.me || echo 'YOUR_SERVER_IP')"
echo "   Backend: http://$(curl -s ifconfig.me || echo 'YOUR_SERVER_IP'):8000"
EOF

chmod +x "$ARCHIVE_DIR/quick_deploy.sh"

# Создаем архив
echo ""
echo "📦 Создание архива..."
ARCHIVE_NAME="agb_deployment_$(date +%Y%m%d_%H%M%S).tar.gz"
tar -czf "$ARCHIVE_NAME" "$ARCHIVE_DIR"

# Проверяем размер архива
ARCHIVE_SIZE=$(ls -lh "$ARCHIVE_NAME" | awk '{print $5}')
echo "✅ Архив создан: $ARCHIVE_NAME ($ARCHIVE_SIZE)"

# Создаем checksum
echo ""
echo "🔐 Создание checksum..."
sha256sum "$ARCHIVE_NAME" > "${ARCHIVE_NAME}.sha256"
echo "✅ Checksum создан: ${ARCHIVE_NAME}.sha256"

# Показываем содержимое архива
echo ""
echo "📋 Содержимое архива:"
tar -tzf "$ARCHIVE_NAME" | head -20
echo "... (всего файлов: $(tar -tzf "$ARCHIVE_NAME" | wc -l))"

echo ""
echo "🎉 ПАКЕТ ДЛЯ РАЗВЕРТЫВАНИЯ ГОТОВ!"
echo ""
echo "📦 Файлы:"
echo "  - $ARCHIVE_NAME ($ARCHIVE_SIZE)"
echo "  - ${ARCHIVE_NAME}.sha256"
echo ""
echo "🚀 Для развертывания на сервере:"
echo "  1. Скопируйте архив на сервер"
echo "  2. Распакуйте: tar -xzf $ARCHIVE_NAME"
echo "  3. Перейдите в директорию: cd agb_deployment"
echo "  4. Запустите: ./quick_deploy.sh"
echo ""
echo "📋 Или вручную:"
echo "  1. tar -xzf $ARCHIVE_NAME"
echo "  2. cd agb_deployment"
echo "  3. ./restore_database.sh"
echo ""
echo "🔑 Данные для входа после развертывания:"
echo "  - Администратор: admin / admin123"
echo "  - Менеджер 1: manager1 / ManagerPass123!"
echo "  - Менеджер 2: manager2 / ManagerPass123!"
echo "  - Сотрудник 1: employee1 / EmployeePass123!"
echo "  - Сотрудник 2: employee2 / EmployeePass123!"
echo "  - ВЭД специалист: ved_passport1 / VedPass123!"
echo "  - Пользователь: user1 / UserPass123!"
