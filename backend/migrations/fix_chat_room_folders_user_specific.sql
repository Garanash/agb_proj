-- Миграция для исправления проблемы с папками чатов
-- Теперь каждый пользователь может независимо добавлять чаты в свои папки

-- Сначала удаляем существующую таблицу chat_room_folders
DROP TABLE IF EXISTS chat_room_folders CASCADE;

-- Создаем новую таблицу с поддержкой пользователь-специфичных связей
CREATE TABLE chat_room_folders (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES chat_folders(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(folder_id, room_id, user_id)
);

-- Создаем индексы для оптимизации
CREATE INDEX idx_chat_room_folders_folder ON chat_room_folders(folder_id);
CREATE INDEX idx_chat_room_folders_room ON chat_room_folders(room_id);
CREATE INDEX idx_chat_room_folders_user ON chat_room_folders(user_id);
CREATE INDEX idx_chat_room_folders_folder_user ON chat_room_folders(folder_id, user_id);

-- Добавляем комментарий к таблице
COMMENT ON TABLE chat_room_folders IS 'Таблица связи чатов с папками для каждого пользователя отдельно';
