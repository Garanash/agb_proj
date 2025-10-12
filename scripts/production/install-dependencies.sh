#!/bin/bash

# Скрипт установки зависимостей для продакшн сервера
# Использование: ./install-dependencies.sh

set -e

echo "🚀 Установка зависимостей для продакшн сервера"
echo "============================================="

# Обновляем систему
echo "📦 Обновление системы..."
apt update && apt upgrade -y

# Устанавливаем Python3 и pip
echo "🐍 Установка Python3 и pip..."
apt install -y python3 python3-pip python3-venv python3-dev

# Устанавливаем Node.js и npm
echo "📦 Установка Node.js и npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Устанавливаем Docker и Docker Compose
echo "🐳 Установка Docker и Docker Compose..."
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Запускаем Docker
systemctl start docker
systemctl enable docker

# Устанавливаем дополнительные зависимости
echo "🔧 Установка дополнительных зависимостей..."
apt install -y git curl wget unzip build-essential

# Проверяем установку
echo "✅ Проверка установки..."
echo "Python3: $(python3 --version)"
echo "pip3: $(pip3 --version)"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker compose version)"

echo ""
echo "🎉 Все зависимости установлены успешно!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Перезагрузите сервер: sudo reboot"
echo "2. Клонируйте проект: git clone <repository-url>"
echo "3. Запустите деплой: ./scripts/production/deploy-production.sh"
