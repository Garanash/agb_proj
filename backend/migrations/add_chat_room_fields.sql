-- Добавление недостающих полей в таблицу chat_rooms
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

