#!/bin/bash
# Универсальный скрипт развертывания для любого сервера

echo "🚀 УНИВЕРСАЛЬНОЕ РАЗВЕРТЫВАНИЕ ПРОЕКТА"
echo "======================================="

# Определяем IP сервера
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
    SERVER_IP=$(ip route get 1 | awk '{print $7}')
fi

# Определяем домен/hostname
SERVER_HOSTNAME=$(hostname)
EXTERNAL_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo "")

echo "📋 Информация о сервере:"
echo "   IP адрес: $SERVER_IP"
echo "   Hostname: $SERVER_HOSTNAME"
if [ -n "$EXTERNAL_IP" ]; then
    echo "   Внешний IP: $EXTERNAL_IP"
fi
echo ""

# Шаг 1: Останавливаем старые контейнеры
echo "📋 1. Останавливаем старые контейнеры..."
docker-compose down 2>/dev/null || true

# Шаг 2: Очищаем старые образы (опционально)
echo "📋 2. Очищаем старые образы..."
docker system prune -f

# Шаг 3: Создаем .env файл для универсальной настройки
echo "📋 3. Создаем конфигурацию..."
cat > .env << EOF
# Автоматически определенные настройки сервера
SERVER_IP=$SERVER_IP
SERVER_HOSTNAME=$SERVER_HOSTNAME
EXTERNAL_IP=$EXTERNAL_IP

# Настройки базы данных
POSTGRES_DB=agb_felix
POSTGRES_USER=felix_user
POSTGRES_PASSWORD=felix_password

# Настройки приложения
SECRET_KEY=your-super-secret-key-change-this-in-production-$(date +%s)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Настройки админа
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_EMAIL=admin@$SERVER_HOSTNAME
ADMIN_FIRST_NAME=Администратор
ADMIN_LAST_NAME=Системы
EOF

# Шаг 4: Пересобираем и запускаем контейнеры
echo "📋 4. Пересобираем и запускаем контейнеры..."
docker-compose up --build -d

# Шаг 5: Ждем запуска сервисов
echo "📋 5. Ждем запуска сервисов..."
sleep 20

# Шаг 6: Проверяем статус
echo "📋 6. Проверяем статус контейнеров..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Шаг 7: Тестируем работу
echo -e "\n📋 7. Тестируем работу..."

# Определяем URL для тестирования
if [ -n "$EXTERNAL_IP" ]; then
    TEST_URL="http://$EXTERNAL_IP"
else
    TEST_URL="http://$SERVER_IP"
fi

echo "Тестируем на URL: $TEST_URL"

# Тестируем health
echo "Health check:"
curl -s "$TEST_URL/api/health" || echo "❌ Health check failed"

# Тестируем логин
echo -e "\nЛогин тест:"
curl -s -X POST "$TEST_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq . 2>/dev/null || echo "❌ Login test failed"

echo -e "\n✅ РАЗВЕРТЫВАНИЕ ЗАВЕРШЕНО!"
echo -e "\n🔑 ДОСТУП К СИСТЕМЕ:"
echo "   🌐 Веб-интерфейс: $TEST_URL/login"
echo "   👤 Логин: admin"
echo "   🔑 Пароль: admin123"
echo ""
echo "📝 URL для разных случаев:"
echo "   - Локально: http://localhost/login"
echo "   - По IP: http://$SERVER_IP/login"
if [ -n "$EXTERNAL_IP" ]; then
    echo "   - Внешний доступ: http://$EXTERNAL_IP/login"
fi
echo ""
echo "🔧 Управление:"
echo "   Остановить: docker-compose down"
echo "   Перезапустить: docker-compose restart"
echo "   Логи: docker-compose logs -f"
echo ""
echo "⚠️  ВАЖНО: Если у вас есть домен, настройте его в nginx.conf"
echo "   и укажите его в переменной SERVER_DOMAIN"
