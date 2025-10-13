#!/bin/bash

# Скрипт быстрого исправления проблем на сервере
# Использование: ./fix-server-issues.sh

set -e

echo "🔧 Быстрое исправление проблем на сервере"
echo "========================================"

# Проверяем права root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Запустите скрипт с правами root: sudo ./fix-server-issues.sh"
    exit 1
fi

echo "📦 Обновление системы..."
apt update

echo "🐍 Установка Python3 и pip..."
apt install -y python3 python3-pip python3-venv python3-dev

echo "📦 Установка Node.js..."
# Удаляем старые версии Node.js если есть
apt remove -y nodejs npm 2>/dev/null || true

# Устанавливаем Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo "🐳 Установка Docker..."
# Удаляем старые версии Docker если есть
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Устанавливаем Docker
apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "🔧 Настройка Docker..."
systemctl start docker
systemctl enable docker
usermod -aG docker $USER

echo "🧹 Очистка Docker..."
docker system prune -f
docker network prune -f

echo "✅ Проверка установки..."
echo "Python3: $(python3 --version)"
echo "pip3: $(pip3 --version)"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Docker: $(docker --version)"

echo ""
echo "🎉 Проблемы исправлены!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Перезагрузите сервер: sudo reboot"
echo "2. Или перелогиньтесь: su - $USER"
echo "3. Запустите деплой: ./scripts/production/deploy-production.sh"
