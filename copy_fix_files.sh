#!/bin/bash
# Копирование файлов исправления на сервер

echo "📤 КОПИРОВАНИЕ ФАЙЛОВ ИСПРАВЛЕНИЯ НА СЕРВЕР"
echo "==========================================="

# Создаем временную директорию для файлов
mkdir -p /tmp/login_fix

# Копируем все файлы исправления
cp backend/debug_password.py /tmp/login_fix/
cp backend/quick_fix_password.py /tmp/login_fix/
cp backend/test_login_after_fix.py /tmp/login_fix/
cp diagnose_login_issue.sh /tmp/login_fix/
cp fix_login_issue.sh /tmp/login_fix/
cp FIX_LOGIN_README.md /tmp/login_fix/
cp docker-compose.yml /tmp/login_fix/
cp fix_frontend_api.sh /tmp/login_fix/

echo "✅ Файлы подготовлены в /tmp/login_fix/"
echo ""
echo "📋 Список файлов для копирования:"
ls -la /tmp/login_fix/
echo ""
echo "🔧 Команды для копирования на сервер:"
echo "scp -r /tmp/login_fix/* root@37.252.20.46:/root/agb_proj/"
echo ""
echo "📝 Или используйте rsync:"
echo "rsync -avz /tmp/login_fix/ root@37.252.20.46:/root/agb_proj/"
echo ""
echo "🎯 После копирования на сервере выполните:"
echo "cd /root/agb_proj"
echo "chmod +x *.sh"
echo ""
echo "📋 Доступные варианты исправления:"
echo "1. Полное исправление логина: ./fix_login_issue.sh"
echo "2. Исправление API URL фронтенда: ./fix_frontend_api.sh"
echo "3. Только диагностика: ./diagnose_login_issue.sh"
echo ""
echo "🔧 Рекомендуется выполнить:"
echo "./fix_frontend_api.sh"
