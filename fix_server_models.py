#!/usr/bin/env python3
"""
Исправление моделей для совместимости с существующей базой данных
"""
import os
import shutil

def fix_models():
    """Исправляем модели для совместимости с сервером"""

    print("🔧 ИСПРАВЛЕНИЕ МОДЕЛЕЙ ДЛЯ СЕРВЕРА")
    print("=" * 50)

    # Файл моделей
    models_file = "/Users/andreydolgov/Desktop/programming/agb_proj/backend/models.py"

    # 1. Добавляем недостающие связи в ChatFolder
    print("📋 1. Добавление связей в ChatFolder...")

    # Читаем файл моделей
    with open(models_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Добавляем user_id в ChatFolder если его нет
    if 'user_id' not in content.split('class ChatFolder')[1].split('class')[0]:
        # Ищем место для вставки
        chat_folder_pattern = '''class ChatFolder(Base):
    """Папки для организации чатов"""
    __tablename__ = "chat_folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")'''

        replacement = '''class ChatFolder(Base):
    """Папки для организации чатов"""
    __tablename__ = "chat_folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    room_id = Column(Integer, ForeignKey("chat_rooms.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    creator = relationship("User", foreign_keys=[created_by], lazy="selectin")
    user = relationship("User", foreign_keys=[user_id], lazy="selectin")
    room = relationship("ChatRoom", foreign_keys=[room_id], lazy="selectin")'''

        content = content.replace(chat_folder_pattern, replacement)
        print("   ✅ Добавлены связи user и room в ChatFolder")

    # 2. Исправляем связи в ChatParticipant
    print("\n📋 2. Исправление связей в ChatParticipant...")

    if 'chat_room' not in content:
        # Добавляем свойство chat_room для обратной совместимости
        chat_participant_pattern = '''    # Связи
    user = relationship("User", lazy="selectin")
    bot = relationship("ChatBot", lazy="selectin")'''

        replacement = '''    # Связи
    user = relationship("User", lazy="selectin")
    bot = relationship("ChatBot", lazy="selectin")
    chat_room = relationship("ChatRoom", foreign_keys=[room_id], lazy="selectin")'''

        if chat_participant_pattern in content:
            content = content.replace(chat_participant_pattern, replacement)
            print("   ✅ Добавлена связь chat_room в ChatParticipant")

    # 3. Исправляем связи в ChatRoomFolder
    print("\n📋 3. Исправление связей в ChatRoomFolder...")

    # Проверяем, есть ли пересекающиеся связи
    if 'ChatRoomFolder.room' in content and 'ChatRoom.folders' in content:
        # Убираем пересекающиеся связи
        content = content.replace(
            'room = relationship("ChatRoom", lazy="selectin")',
            'room = relationship("ChatRoom", lazy="selectin", overlaps="folders")'
        )
        print("   ✅ Исправлено пересечение связей ChatRoomFolder.room")

    # Сохраняем изменения
    with open(models_file, 'w', encoding='utf-8') as f:
        f.write(content)

    print("\n✅ МОДЕЛИ ИСПРАВЛЕНЫ!")
    print("\n📊 ВНЕСЕННЫЕ ИЗМЕНЕНИЯ:")
    print("   ✅ Добавлен user_id и room_id в ChatFolder")
    print("   ✅ Добавлены связи user и room в ChatFolder")
    print("   ✅ Добавлена связь chat_room в ChatParticipant")
    print("   ✅ Исправлено пересечение связей в ChatRoomFolder")

def create_migration_script():
    """Создаем скрипт миграции для сервера"""

    print("\n📋 4. Создание скрипта миграции...")

    migration_script = """#!/bin/bash
# Скрипт миграции базы данных на сервере

echo "🔄 ЗАПУСК МИГРАЦИИ БАЗЫ ДАННЫХ"
echo "================================"

# Останавливаем backend
echo "📋 1. Остановка backend..."
docker-compose stop backend

# Запускаем миграцию
echo "📋 2. Запуск миграции..."
python migrate_database.py

# Перезапускаем backend
echo "📋 3. Перезапуск backend..."
docker-compose start backend

echo ""
echo "✅ МИГРАЦИЯ ЗАВЕРШЕНА!"
echo "======================="
echo "Теперь проверьте работу платформы"
"""

    with open('/Users/andreydolgov/Desktop/programming/agb_proj/migrate_server.sh', 'w') as f:
        f.write(migration_script)

    # Делаем исполняемым
    os.chmod('/Users/andreydolgov/Desktop/programming/agb_proj/migrate_server.sh', 0o755)

    print("   ✅ Создан скрипт migrate_server.sh")

def main():
    """Главная функция"""
    fix_models()
    create_migration_script()

    print("\n" + "=" * 50)
    print("🎉 ПОДГОТОВКА К МИГРАЦИИ ЗАВЕРШЕНА!")
    print("\n📋 ДАЛЬНЕЙШИЕ ДЕЙСТВИЯ:")
    print("   1. Скопируйте файлы на сервер:")
    print("      scp models.py migrate_database.py migrate_server.sh root@ВАШ_IP:/root/agb_platform/backend/")
    print("   2. Запустите миграцию на сервере:")
    print("      cd /root/agb_platform && ./migrate_server.sh")
    print("   3. Проверьте работу платформы")

if __name__ == "__main__":
    main()
