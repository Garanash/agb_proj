#!/bin/bash
# Исправление проблемы с логином админа

echo "🔧 ИСПРАВЛЕНИЕ ПРОБЛЕМЫ С ЛОГИНОМ АДМИНА"
echo "========================================"

# Шаг 1: Отладка текущего состояния
echo -e "\n📋 ШАГ 1: Отладка текущего состояния"
docker exec -it agb_backend python debug_password.py

# Шаг 2: Исправление пароля
echo -e "\n📋 ШАГ 2: Исправление пароля"
docker exec -it agb_backend python quick_fix_password.py

# Шаг 3: Тестирование после исправления
echo -e "\n📋 ШАГ 3: Тестирование после исправления"
docker exec -it agb_backend python test_login_after_fix.py

# Шаг 4: Финальный тест через curl
echo -e "\n📋 ШАГ 4: Финальный тест через curl"
echo "Тестируем логин через nginx:"
curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq .

echo -e "\nТестируем логин через backend напрямую:"
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | jq .

echo -e "\n✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo -e "\n🔑 ДАННЫЕ ДЛЯ ВХОДА:"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo "   URL: http://ВАШ_СЕРВЕР/login"
echo -e "\n🎉 Попробуйте войти в систему!"
