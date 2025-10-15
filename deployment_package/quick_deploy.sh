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
