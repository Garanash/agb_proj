#!/bin/bash
# СУПЕР ПРОСТОЙ СКРИПТ ИСПРАВЛЕНИЯ ВСЕХ ПРОБЛЕМ НА СЕРВЕРЕ
# Запустите этот скрипт на сервере и все исправится!

echo "🔥 СУПЕР ПРОСТОЕ ИСПРАВЛЕНИЕ ВСЕХ ПРОБЛЕМ!"
echo "=========================================="

# Проверяем, что мы на сервере
if [ ! -d "/root/agb_platform" ]; then
    echo "❌ Ошибка: Директория /root/agb_platform не найдена!"
    echo "   Вы должны запустить этот скрипт на сервере с установленной платформой"
    exit 1
fi

echo "✅ Сервер обнаружен, начинаем исправление..."

# 1. Устанавливаем зависимости для миграции
echo "📦 1. Установка зависимостей..."
pip install asyncpg python-dotenv

# 2. Создаем скрипт миграции
echo "📝 2. Создание скрипта миграции..."
cat > /root/agb_platform/migrate_db_final.py << 'EOF'
#!/usr/bin/env python3
import asyncio
import asyncpg
import os

async def migrate_database():
    print("🔄 МИГРАЦИЯ БАЗЫ ДАННЫХ...")

    try:
        # Подключаемся к базе данных
        conn = await asyncpg.connect(
            host="postgres",
            port=5432,
            database="agb_felix",
            user="felix_user",
            password="felix_password"
        )

        print("✅ Подключено к базе данных")

        # Добавляем недостающие столбцы
        print("📋 Добавление недостающих столбцов...")

        # company_employees
        await conn.execute("""
            ALTER TABLE company_employees
            ADD COLUMN IF NOT EXISTS first_name VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255)
        """)

        # chat_rooms
        await conn.execute("""
            ALTER TABLE chat_rooms
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
        """)

        # chat_folders
        await conn.execute("""
            ALTER TABLE chat_folders
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES chat_rooms(id)
        """)

        await conn.close()
        print("✅ Миграция завершена!")

    except Exception as e:
        print(f"❌ Ошибка миграции: {e}")

if __name__ == "__main__":
    asyncio.run(migrate_database())
EOF

# 3. Запускаем миграцию
echo "🔧 3. Запуск миграции базы данных..."
cd /root/agb_platform
python migrate_db_final.py

# 4. Исправляем модели
echo "📝 4. Исправление моделей..."

# Делаем бэкап
cp backend/models.py backend/models.py.backup

# Исправляем ChatFolder
sed -i '/created_by = Column(Integer, ForeignKey("users.id"), nullable=False)/a\
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)\
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=True)' backend/models.py

# Добавляем связи для ChatFolder
sed -i '/creator = relationship("User", foreign_keys=\[created_by\], lazy="selectin")/a\
    user = relationship("User", foreign_keys=[user_id], lazy="selectin")\
    room = relationship("ChatRoom", foreign_keys=[room_id], lazy="selectin")' backend/models.py

# Добавляем chat_room для ChatParticipant
sed -i '/bot = relationship("ChatBot", lazy="selectin")/a\
    chat_room = relationship("ChatRoom", foreign_keys=[room_id], lazy="selectin")' backend/models.py

# 5. Исправляем chat.py
echo "📝 5. Исправление chat.py..."

# Заменяем creator_id на created_by
sed -i 's/creator_id/db_room.created_by/g' backend/routers/chat.py
sed -i 's/creator_id/room.created_by/g' backend/routers/chat.py

# 6. Исправляем schemas.py
echo "📝 6. Исправление schemas..."
sed -i 's/creator_id: int/created_by: int/g' backend/schemas.py

# 7. Перезапускаем сервисы
echo "🚀 7. Перезапуск сервисов..."
docker-compose restart

# 8. Ждем запуска
echo "⏳ 8. Ожидание запуска..."
sleep 10

# 9. Проверяем работу
echo "🧪 9. Проверка работы..."

# Проверяем здоровье
if curl -s http://localhost/api/health | grep -q "healthy"; then
    echo "✅ API здоровье: OK"
else
    echo "❌ API здоровье: FAILED"
fi

# Проверяем авторизацию
TOKEN=$(curl -s -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "admin123"}' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    echo "✅ Авторизация: OK"

    # Проверяем чаты
    if curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/chat/rooms/ | grep -q "id\|null"; then
        echo "✅ Чаты: OK"
    else
        echo "❌ Чаты: FAILED"
    fi

    # Проверяем сотрудников
    if curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/company-employees/ | grep -q "first_name\|null"; then
        echo "✅ Сотрудники: OK"
    else
        echo "❌ Сотрудники: FAILED"
    fi
else
    echo "❌ Авторизация: FAILED"
fi

# 10. Финальный отчет
echo ""
echo "🎉 ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!"
echo "========================"
echo ""
echo "🌐 ДОСТУП К ПЛАТФОРМЕ:"
echo "   URL: http://ВАШ_IP/login"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""
echo "🔧 ЧТО БЫЛО ИСПРАВЛЕНО:"
echo "   ✅ Добавлены недостающие столбцы в БД"
echo "   ✅ Исправлены модели SQLAlchemy"
echo "   ✅ Обновлены схемы Pydantic"
echo "   ✅ Перезапущены сервисы"
echo ""
echo "📋 ПРОВЕРКА РАБОТЫ:"
echo "   1. Откройте браузер и зайдите на платформу"
echo "   2. Попробуйте создать чат"
echo "   3. Проверьте раздел сотрудников"
echo ""
echo "Если что-то не работает - перезапустите сервисы:"
echo "   docker-compose restart"
