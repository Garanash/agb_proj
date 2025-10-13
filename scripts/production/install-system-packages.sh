#!/bin/bash

# Скрипт для установки необходимых пакетов системы
# Использование: ./install-system-packages.sh

set -e

echo "📦 Установка системных пакетов"
echo "============================="

echo "🔄 Обновление списка пакетов..."
apt update

echo "📦 Установка Python и необходимых пакетов..."
apt install -y python3 python3-pip python3-venv python3-dev

echo "📦 Установка дополнительных пакетов..."
apt install -y curl wget git build-essential

echo "📦 Установка PostgreSQL клиента..."
apt install -y postgresql-client

echo "📦 Установка Node.js и npm..."
# Устанавливаем Node.js через NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo "📦 Установка Docker..."
# Устанавливаем Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Добавляем пользователя в группу docker
usermod -aG docker $USER

echo "📦 Установка Docker Compose..."
# Устанавливаем Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo ""
echo "✅ Установка завершена!"
echo ""
echo "📋 Проверка установленных пакетов:"
echo "--------------------------------"
echo "Python3: $(python3 --version)"
echo "pip3: $(pip3 --version)"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version)"

echo ""
echo "🎉 Все пакеты установлены!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Перезагрузите систему: reboot"
echo "2. Или перелогиньтесь: su - $USER"
echo "3. Запустите backend: ./scripts/production/simple-start-backend.sh"
