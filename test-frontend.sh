#!/bin/bash

# Скрипт для тестирования frontend API URL
# Запускать на сервере

echo "🧪 ТЕСТИРОВАНИЕ FRONTEND"
echo "======================="
echo ""

echo "1. 🔍 Проверка API URL в frontend:"
echo ""

# Получаем содержимое главной страницы
MAIN_PAGE=$(curl -s http://localhost/)

# Ищем в HTML код API URL
echo "   - Поиск API URL в HTML:"
echo "$MAIN_PAGE" | grep -i "api" | head -5

echo ""
echo "2. 🌐 Проверка из браузера:"
echo ""

# Создаем простую HTML страницу для тестирования
cat > /tmp/test-api.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>API URL Test</title>
    <script>
        function testApiUrl() {
            const apiUrl = window.location.origin;
            document.getElementById('result').innerHTML = `
                <p>Текущий origin: ${apiUrl}</p>
                <p>API endpoint: ${apiUrl}/api/auth/login</p>
            `;

            // Тестируем API
            fetch(`${apiUrl}/api/health`)
                .then(response => response.json())
                .then(data => {
                    document.getElementById('api-test').innerHTML = `
                        <p style="color: green;">✅ API доступен: ${JSON.stringify(data)}</p>
                    `;
                })
                .catch(error => {
                    document.getElementById('api-test').innerHTML = `
                        <p style="color: red;">❌ Ошибка API: ${error}</p>
                    `;
                });
        }

        window.onload = testApiUrl;
    </script>
</head>
<body>
    <h1>Тест API URL</h1>
    <div id="result"></div>
    <div id="api-test"></div>
</body>
</html>
EOF

echo "   - Создана тестовая страница: /tmp/test-api.html"
echo "   - Скопируйте ее содержимое и откройте в браузере"
echo ""

echo "3. 📋 Содержимое тестовой страницы:"
echo "----------------------------------"
cat /tmp/test-api.html
echo ""
echo "----------------------------------"

echo "4. 🌐 Инструкции:"
echo ""
echo "   1. Откройте браузер"
echo "   2. Создайте новую вкладку"
echo "   3. Откройте Developer Tools (F12)"
echo "   4. Вставьте HTML код выше в Console"
echo "   5. Или сохраните как .html файл и откройте"
echo ""
echo "   6. Проверьте, что API URL правильный: http://37.252.20.46/api/health"
echo ""

echo "5. 🔄 Перезапуск frontend (если нужно):"
echo ""
echo "   ./update-frontend.sh"

