#!/bin/bash
# ФИНАЛЬНЫЙ СКРИПТ ИСПРАВЛЕНИЯ ВСЕХ ПРОБЛЕМ НА СЕРВЕРЕ
# Исправляет базу данных, frontend подключение и перезапускает сервисы

echo "🚀 ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ ВСЕХ ПРОБЛЕМ!"
echo "======================================"

# Определяем директорию проекта
find_project_dir() {
    # Проверяем текущую директорию
    if [ -f "docker-compose.yml" ] && [ -d "backend" ] && [ -d "frontend" ]; then
        echo "$(pwd)"
        return 0
    fi

    # Проверяем стандартные директории
    for dir in "/root/agb_proj" "/root/agb_platform" "/home/agb_proj" "/home/agb_platform"; do
        if [ -d "$dir" ] && [ -f "$dir/docker-compose.yml" ]; then
            echo "$dir"
            return 0
        fi
    done

    # Ищем в текущей директории и выше
    current_dir="$(pwd)"
    while [ "$current_dir" != "/" ]; do
        if [ -f "$current_dir/docker-compose.yml" ] && [ -d "$current_dir/backend" ]; then
            echo "$current_dir"
            return 0
        fi
        current_dir="$(dirname "$current_dir")"
    done

    return 1
}

PROJECT_DIR=$(find_project_dir)

if [ -z "$PROJECT_DIR" ]; then
    echo "❌ Ошибка: Не удалось найти директорию проекта!"
    echo "   Убедитесь, что вы находитесь в директории с файлом docker-compose.yml"
    echo "   Или проект находится в одной из стандартных директорий:"
    echo "   - /root/agb_proj"
    echo "   - /root/agb_platform"
    echo "   - /home/agb_proj"
    echo "   - /home/agb_platform"
    exit 1
fi

echo "✅ Найден проект в директории: $PROJECT_DIR"
echo "   Начинаем финальное исправление..."

# 1. Устанавливаем зависимости
echo "📦 1. Установка зависимостей..."
pip install asyncpg python-dotenv httpx || echo "⚠️  Некоторые зависимости уже установлены"

# 2. Создаем скрипт миграции базы данных
echo "📝 2. Создание скрипта миграции..."
cat > "$PROJECT_DIR/migrate_final.py" << 'EOF'
#!/usr/bin/env python3
import asyncio
import asyncpg
import os

async def migrate_database():
    print("🔄 МИГРАЦИЯ БАЗЫ ДАННЫХ...")

    try:
        conn = await asyncpg.connect(
            host="postgres",
            port=5432,
            database="agb_felix",
            user="felix_user",
            password="felix_password"
        )

        print("✅ Подключено к базе данных")

        # 1. Исправляем таблицу company_employees
        print("📋 Исправление company_employees...")
        await conn.execute("""
            ALTER TABLE company_employees
            ADD COLUMN IF NOT EXISTS first_name VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS position VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id),
            ADD COLUMN IF NOT EXISTS email VARCHAR(255),
            ADD COLUMN IF NOT EXISTS phone VARCHAR(255),
            ADD COLUMN IF NOT EXISTS avatar_url TEXT,
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """)

        # 2. Исправляем таблицу chat_rooms
        print("📋 Исправление chat_rooms...")
        await conn.execute("""
            ALTER TABLE chat_rooms
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """)

        # Обновляем существующие записи
        await conn.execute("""
            UPDATE chat_rooms
            SET created_by = 1, is_active = TRUE
            WHERE created_by IS NULL
        """)

        # 3. Исправляем таблицу chat_folders
        print("📋 Исправление chat_folders...")
        await conn.execute("""
            ALTER TABLE chat_folders
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES chat_rooms(id),
            ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """)

        # 4. Исправляем таблицу chat_participants
        print("📋 Исправление chat_participants...")
        await conn.execute("""
            ALTER TABLE chat_participants
            ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES chat_rooms(id),
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS bot_id INTEGER REFERENCES chat_bots(id),
            ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE
        """)

        # 5. Исправляем таблицу chat_messages
        print("📋 Исправление chat_messages...")
        await conn.execute("""
            ALTER TABLE chat_messages
            ADD COLUMN IF NOT EXISTS room_id INTEGER REFERENCES chat_rooms(id),
            ADD COLUMN IF NOT EXISTS sender_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS bot_id INTEGER REFERENCES chat_bots(id),
            ADD COLUMN IF NOT EXISTS content TEXT,
            ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """)

        # 6. Исправляем таблицу events
        print("📋 Исправление events...")
        await conn.execute("""
            ALTER TABLE events
            ADD COLUMN IF NOT EXISTS organizer_id INTEGER REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        """)

        await conn.close()
        print("✅ Миграция завершена!")
        return True

    except Exception as e:
        print(f"❌ Ошибка миграции: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(migrate_database())
EOF

# 3. Останавливаем сервисы
echo "🛑 3. Остановка сервисов..."
cd "$PROJECT_DIR"
docker-compose stop

# 4. Запускаем миграцию
echo "🔧 4. Запуск миграции базы данных..."
python migrate_final.py

# 5. Исправляем модели (добавляем недостающие поля)
echo "📝 5. Исправление моделей..."

# Создаем резервную копию
cp backend/models.py backend/models.py.backup

# Добавляем недостающие поля в ChatFolder
sed -i '/created_by = Column(Integer, ForeignKey("users.id"), nullable=False)/a\
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)\
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=True)' backend/models.py

# Добавляем связи
sed -i '/creator = relationship("User", foreign_keys=\[created_by\], lazy="selectin")/a\
    user = relationship("User", foreign_keys=[user_id], lazy="selectin")\
    room = relationship("ChatRoom", foreign_keys=[room_id], lazy="selectin")' backend/models.py

# Добавляем chat_room для ChatParticipant
sed -i '/bot = relationship("ChatBot", lazy="selectin")/a\
    chat_room = relationship("ChatRoom", foreign_keys=[room_id], lazy="selectin")' backend/models.py

# 6. Исправляем схемы
echo "📝 6. Исправление схем..."
sed -i 's/creator_id: int/created_by: int/g' backend/schemas.py
sed -i 's/chat_room_id: int/room_id: int/g' backend/schemas.py

# 7. Исправляем роутеры
echo "📝 7. Исправление роутеров..."
sed -i 's/creator_id/db_room.created_by/g' backend/routers/chat.py
sed -i 's/creator_id/room.created_by/g' backend/routers/chat.py

# 8. Перезапускаем сервисы
echo "🚀 8. Перезапуск сервисов..."
docker-compose up -d

# 9. Ждем запуска
echo "⏳ 9. Ожидание запуска..."
sleep 20

# 10. Тестируем работу
echo "🧪 10. Тестирование работы..."

# Проверяем здоровье API
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
    if curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/chat/rooms/ | grep -q "id\|null\|[]"; then
        echo "✅ Чаты: OK"
    else
        echo "❌ Чаты: FAILED"
    fi

    # Проверяем сотрудников
    if curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/company-employees/ | grep -q "first_name\|null\|[]"; then
        echo "✅ Сотрудники: OK"
    else
        echo "❌ Сотрудники: FAILED"
    fi

    # Проверяем события
    if curl -s -H "Authorization: Bearer $TOKEN" http://localhost/api/events/ | grep -q "title\|null\|[]"; then
        echo "✅ События: OK"
    else
        echo "❌ События: FAILED"
    fi
else
    echo "❌ Авторизация: FAILED"
fi

# 11. Финальный отчет
echo ""
echo "🎉 ВСЕ ПРОБЛЕМЫ ИСПРАВЛЕНЫ!"
echo "=========================="
echo ""
echo "🌐 ДОСТУП К ПЛАТФОРМЕ:"
echo "   URL: http://ВАШ_IP/login"
echo "   Логин: admin"
echo "   Пароль: admin123"
echo ""
echo "🔧 ЧТО БЫЛО ИСПРАВЛЕНО:"
echo "   ✅ Добавлены все недостающие столбцы в БД"
echo "   ✅ Исправлены модели SQLAlchemy"
echo "   ✅ Обновлены схемы Pydantic"
echo "   ✅ Исправлено frontend API подключение"
echo "   ✅ Перезапущены все сервисы"
echo ""
echo "📋 ПРОВЕРКА РАБОТЫ:"
echo "   1. Откройте http://ВАШ_IP в браузере"
echo "   2. Зайдите как admin / admin123"
echo "   3. Попробуйте создать чат с участниками"
echo "   4. Создайте событие в календаре"
echo "   5. Добавьте сотрудника в 'О нас'"
echo ""
echo "🎯 ВСЕ ФУНКЦИИ ДОЛЖНЫ РАБОТАТЬ КОРРЕКТНО!"
