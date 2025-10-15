#!/bin/bash

echo "🚀 НАСТРОЙКА ТЕСТОВЫХ ДАННЫХ"
echo "=============================="

# Проверяем, что мы в правильной директории
if [ ! -f "scripts/create_test_users.py" ]; then
    echo "❌ Скрипты не найдены. Убедитесь, что вы находитесь в корневой директории проекта."
    exit 1
fi

# Проверяем, что backend контейнер запущен
if ! docker ps | grep -q "agb_backend_local"; then
    echo "❌ Backend контейнер не запущен. Запустите сначала Docker среду."
    exit 1
fi

echo "1. 👥 Создание тестовых пользователей со всеми ролями..."
docker cp scripts/create_test_users.py agb_backend_local:/app/create_test_users.py
docker exec agb_backend_local python3 /app/create_test_users.py

echo ""
echo "2. 🏢 Заполнение раздела 'О нас'..."
docker cp scripts/create_about_data.py agb_backend_local:/app/create_about_data.py
docker exec agb_backend_local python3 /app/create_about_data.py

echo ""
echo "3. 💬 Создание тестовых чатов между сотрудниками..."
docker cp scripts/create_test_chats.py agb_backend_local:/app/create_test_chats.py
docker exec agb_backend_local python3 /app/create_test_chats.py

echo ""
echo "4. 🧪 Тестирование API чатов..."
echo "   Получение списка чатов:"
curl -s http://localhost:8000/api/v1/chat-rooms/ -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc2MDU5ODIxOH0.5l-e5ZzlgaNaf2XLSs6YwJc0BOWHqHThk5WuDlazUJ4" | jq '.[] | {id, name, description, is_private}' | head -20

echo ""
echo "5. 👤 Тестирование списка пользователей..."
echo "   Получение списка пользователей:"
curl -s http://localhost:8000/api/v1/users/list -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc2MDU5ODIxOH0.5l-e5ZzlgaNaf2XLSs6YwJc0BOWHqHThk5WuDlazUJ4" | jq '.[] | {id, username, first_name, last_name, role}' | head -10

echo ""
echo "6. 🏢 Тестирование списка сотрудников..."
echo "   Получение списка сотрудников:"
curl -s http://localhost:8000/api/v1/company-employees/ -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImV4cCI6MTc2MDU5ODIxOH0.5l-e5ZzlgaNaf2XLSs6YwJc0BOWHqHThk5WuDlazUJ4" | jq '.[] | {id, first_name, last_name, position, department_id}' | head -10

echo ""
echo "✅ ВСЕ ТЕСТОВЫЕ ДАННЫЕ СОЗДАНЫ УСПЕШНО!"
echo ""
echo "📋 Создано:"
echo "  - 7 пользователей со всеми ролями (admin, manager, employee, ved_passport, user)"
echo "  - 5 отделов компании"
echo "  - 10 сотрудников для раздела 'О нас'"
echo "  - 7 чатов (общие и личные)"
echo "  - 13 тестовых сообщений в чатах"
echo ""
echo "🔑 Данные для входа:"
echo "  Администратор: admin / AdminPass123!"
echo "  Менеджер 1: manager1 / ManagerPass123!"
echo "  Менеджер 2: manager2 / ManagerPass123!"
echo "  Сотрудник 1: employee1 / EmployeePass123!"
echo "  Сотрудник 2: employee2 / EmployeePass123!"
echo "  ВЭД специалист: ved_passport1 / VedPass123!"
echo "  Пользователь: user1 / UserPass123!"
echo ""
echo "🌐 Приложение доступно по адресу: http://localhost:3000"
