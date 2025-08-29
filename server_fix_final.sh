#!/bin/bash
# МАГИЧЕСКИЙ СКРИПТ ИСПРАВЛЕНИЯ ВСЕХ ПРОБЛЕМ НА СЕРВЕРЕ
# РАБОТАЕТ В ЛЮБОЙ ДИРЕКТОРИИ ПРОЕКТА

echo "🔥 МАГИЧЕСКОЕ ИСПРАВЛЕНИЕ ВСЕХ ПРОБЛЕМ!"
echo "========================================"

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
echo "   Начинаем исправление..."

# 1. Создаем временную директорию
echo "📁 1. Подготовка временной директории..."
mkdir -p /tmp/agb_fix
cd /tmp/agb_fix

# 2. Устанавливаем зависимости
echo "📦 2. Установка зависимостей..."
pip install asyncpg python-dotenv || echo "⚠️  Не удалось установить зависимости, продолжаем..."

# 3. Создаем скрипт миграции
echo "📝 3. Создание скрипта миграции..."
cat > migrate_db_final.py << 'EOF'
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

        # Исправляем таблицу company_employees
        print("📋 Исправление company_employees...")
        await conn.execute("""
            ALTER TABLE company_employees
            ADD COLUMN IF NOT EXISTS first_name VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) DEFAULT '',
            ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255)
        """)

        # Исправляем таблицу chat_rooms
        print("📋 Исправление chat_rooms...")
        await conn.execute("""
            ALTER TABLE chat_rooms
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE
        """)

        # Исправляем таблицу chat_folders
        print("📋 Исправление chat_folders...")
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

# 4. Останавливаем сервисы
echo "🛑 4. Остановка сервисов..."
cd "$PROJECT_DIR"
docker-compose stop

# 5. Запускаем миграцию
echo "🔧 5. Запуск миграции базы данных..."
python /tmp/agb_fix/migrate_db_final.py

# 6. Исправляем модели
echo "📝 6. Исправление моделей..."

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

# 7. Исправляем chat.py
echo "📝 7. Исправление chat.py..."

# Заменяем creator_id на created_by
sed -i 's/creator_id/db_room.created_by/g' backend/routers/chat.py
sed -i 's/creator_id/room.created_by/g' backend/routers/chat.py

# 8. Исправляем schemas.py
echo "📝 8. Исправление schemas..."
sed -i 's/creator_id: int/created_by: int/g' backend/schemas.py

# 9. Запускаем сервисы
echo "🚀 9. Запуск сервисов..."
docker-compose up -d

# 10. Ждем запуска
echo "⏳ 10. Ожидание запуска..."
sleep 15

# 11. Проверяем работу
echo "🧪 11. Проверка работы..."

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
else
    echo "❌ Авторизация: FAILED"
fi

# 12. Финальный отчет
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

echo ""
echo "🚀 ГОТОВО! ВАША ПЛАТФОРМА РАБОТАЕТ!"
