#!/usr/bin/env python3
"""
Исправляем все ссылки на ChatRoomParticipant в chat.py
"""
import re

def fix_chat_references():
    """Заменяем все ChatRoomParticipant на ChatParticipant"""

    # Читаем файл
    with open('/Users/andreydolgov/Desktop/programming/agb_proj/backend/routers/chat.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Заменяем ссылки на модели
    replacements = [
        ('ChatRoomParticipant', 'ChatParticipant'),
        ('chat_room_id', 'room_id'),
    ]

    for old, new in replacements:
        content = re.sub(r'\b' + re.escape(old) + r'\b', new, content)

    # Пишем обратно
    with open('/Users/andreydolgov/Desktop/programming/agb_proj/backend/routers/chat.py', 'w', encoding='utf-8') as f:
        f.write(content)

    print("✅ Все ссылки исправлены!")

if __name__ == "__main__":
    fix_chat_references()
