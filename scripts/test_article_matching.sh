#!/bin/bash

echo "🧪 ТЕСТИРОВАНИЕ СОПОСТАВЛЕНИЯ АРТИКУЛОВ"
echo "========================================"

# Проверяем, что мы в правильной директории
if [ ! -f "scripts/test_article_matching.sh" ]; then
    echo "❌ Скрипт не найден. Убедитесь, что вы находитесь в корневой директории проекта."
    exit 1
fi

# Проверяем, что backend контейнер запущен
if ! docker ps | grep -q "agb_backend_local"; then
    echo "❌ Backend контейнер не запущен. Запустите сначала Docker среду."
    exit 1
fi

# Получаем токен авторизации
echo "🔑 Получение токена авторизации..."
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}' | \
    jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo "❌ Не удалось получить токен авторизации"
    exit 1
fi

echo "✅ Токен получен: ${TOKEN:0:20}..."

echo ""
echo "1. 📋 Тест получения списка запросов:"
curl -s http://localhost:8000/api/v1/article-matching/requests/ \
    -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "2. 📊 Тест получения результатов сопоставления:"
curl -s http://localhost:8000/api/v1/article-matching/results/ \
    -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "3. 🗄️ Тест получения статей из базы данных:"
curl -s http://localhost:8000/api/v1/article-matching/our-database/ \
    -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "4. 📤 Тест загрузки файла:"
UPLOAD_RESULT=$(curl -s -X POST http://localhost:8000/api/v1/article-matching/upload/ \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@README.md")

echo "$UPLOAD_RESULT" | jq '.'

# Извлекаем ID запроса
REQUEST_ID=$(echo "$UPLOAD_RESULT" | jq -r '.request_id')

if [ "$REQUEST_ID" != "null" ] && [ -n "$REQUEST_ID" ]; then
    echo ""
    echo "5. 🔄 Тест запуска сопоставления для запроса ID=$REQUEST_ID:"
    MATCH_RESULT=$(curl -s -X POST http://localhost:8000/api/v1/article-matching/match/ \
        -H "Authorization: Bearer $TOKEN" \
        -F "request_id=$REQUEST_ID")
    
    echo "$MATCH_RESULT" | jq '.'
    
    echo ""
    echo "6. 📊 Проверка результатов после сопоставления:"
    curl -s http://localhost:8000/api/v1/article-matching/results/ \
        -H "Authorization: Bearer $TOKEN" | jq '.'
    
    echo ""
    echo "7. 📋 Проверка статуса запроса после сопоставления:"
    curl -s http://localhost:8000/api/v1/article-matching/requests/ \
        -H "Authorization: Bearer $TOKEN" | jq '.'
else
    echo "❌ Не удалось получить ID запроса для тестирования сопоставления"
fi

echo ""
echo "8. 🔍 Тест поиска в базе данных:"
curl -s "http://localhost:8000/api/v1/article-matching/our-database/?search=AGB" \
    -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "9. 📈 Тест получения найденных сопоставлений:"
curl -s http://localhost:8000/api/v1/article-matching/found-matches/ \
    -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "10. 🧪 Тест подключения к базе данных:"
curl -s http://localhost:8000/api/v1/article-matching/test-our-database \
    -H "Authorization: Bearer $TOKEN" | jq '.'

echo ""
echo "✅ ВСЕ ТЕСТЫ СОПОСТАВЛЕНИЯ АРТИКУЛОВ ЗАВЕРШЕНЫ!"
echo ""
echo "📋 Доступные API endpoints:"
echo "  - GET  /api/v1/article-matching/requests/     - Список запросов"
echo "  - GET  /api/v1/article-matching/results/      - Результаты сопоставления"
echo "  - GET  /api/v1/article-matching/our-database/ - Статьи из базы данных"
echo "  - POST /api/v1/article-matching/upload/       - Загрузка файла"
echo "  - POST /api/v1/article-matching/match/        - Запуск сопоставления"
echo "  - GET  /api/v1/article-matching/found-matches/ - Найденные сопоставления"
echo "  - GET  /api/v1/article-matching/test-our-database - Тест БД"
echo ""
echo "🌐 Приложение доступно по адресу: http://localhost:3000"
