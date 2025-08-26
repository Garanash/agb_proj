-- Создаем таблицу папок чатов
CREATE TABLE IF NOT EXISTS chat_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(name, user_id)
);

-- Создаем таблицу связей чатов с папками
CREATE TABLE IF NOT EXISTS chat_room_folders (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES chat_folders(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(folder_id, room_id)
);
