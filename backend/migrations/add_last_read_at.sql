-- Добавление поля last_read_at для отслеживания непрочитанных сообщений
ALTER TABLE chat_room_participants ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP WITH TIME ZONE;

-- Обновление существующих записей
UPDATE chat_room_participants SET last_read_at = joined_at WHERE last_read_at IS NULL;
