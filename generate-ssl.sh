#!/bin/bash

echo "🔐 Генерация SSL сертификатов для Felix Platform..."

# Проверяем, установлен ли OpenSSL
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL не установлен. Установите OpenSSL и попробуйте снова."
    exit 1
fi

# Создаем директорию для SSL сертификатов
mkdir -p nginx/ssl

# Запрашиваем домен
read -p "Введите ваш домен (например: example.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "❌ Домен не может быть пустым"
    exit 1
fi

echo "🌐 Генерируем сертификаты для домена: $DOMAIN"

# Генерируем приватный ключ
echo "🔑 Генерация приватного ключа..."
openssl genrsa -out nginx/ssl/key.pem 2048

# Генерируем сертификат
echo "📜 Генерация сертификата..."
openssl req -new -x509 -key nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -subj "/C=KZ/ST=Almaty/L=Almaty/O=Almazgeobur/CN=$DOMAIN"

# Устанавливаем права доступа
chmod 600 nginx/ssl/key.pem
chmod 644 nginx/ssl/cert.pem

echo "✅ SSL сертификаты созданы успешно!"
echo ""
echo "📁 Файлы созданы в nginx/ssl/:"
echo "   - key.pem (приватный ключ)"
echo "   - cert.pem (сертификат)"
echo ""
echo "⚠️  ВАЖНО: Это самоподписанные сертификаты для разработки."
echo "   Для production используйте сертификаты от Let's Encrypt или другого CA."
echo ""
echo "🔒 Сертификаты действительны 365 дней."
echo "   Для продления запустите скрипт снова."
