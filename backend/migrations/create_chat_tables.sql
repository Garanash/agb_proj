-- Создание таблиц для системы чатов

-- Таблица чатов
CREATE TABLE IF NOT EXISTS chat_rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    creator_id INTEGER NOT NULL REFERENCES users(id),
    is_private BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Таблица участников чатов
CREATE TABLE IF NOT EXISTS chat_room_participants (
    id SERIAL PRIMARY KEY,
    chat_room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    bot_id INTEGER REFERENCES chat_bots(id),
    is_admin BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_participant CHECK (
        (user_id IS NOT NULL AND bot_id IS NULL) OR 
        (user_id IS NULL AND bot_id IS NOT NULL)
    )
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    chat_room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id INTEGER REFERENCES users(id),
    bot_id INTEGER REFERENCES chat_bots(id),
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_sender CHECK (
        (sender_id IS NOT NULL AND bot_id IS NULL) OR 
        (sender_id IS NULL AND bot_id IS NOT NULL) OR
        (sender_id IS NULL AND bot_id IS NULL)
    )
);

-- Таблица ИИ ботов
CREATE TABLE IF NOT EXISTS chat_bots (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    api_key VARCHAR NOT NULL,
    bot_model_id VARCHAR NOT NULL,
    system_prompt TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Таблица папок для чатов
CREATE TABLE IF NOT EXISTS chat_folders (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Таблица связи чатов с папками
CREATE TABLE IF NOT EXISTS chat_room_folders (
    id SERIAL PRIMARY KEY,
    folder_id INTEGER NOT NULL REFERENCES chat_folders(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(folder_id, room_id)
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_chat_rooms_creator ON chat_rooms(creator_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_active ON chat_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_participants_room ON chat_room_participants(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_bot ON chat_room_participants(bot_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_bot ON chat_messages(bot_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_folders_user ON chat_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_folders_folder ON chat_room_folders(folder_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_folders_room ON chat_room_folders(room_id);

-- Добавление комментариев к таблицам
COMMENT ON TABLE chat_rooms IS 'Таблица чатов';
COMMENT ON TABLE chat_room_participants IS 'Таблица участников чатов';
COMMENT ON TABLE chat_messages IS 'Таблица сообщений в чатах';
COMMENT ON TABLE chat_bots IS 'Таблица ИИ ботов';
COMMENT ON TABLE chat_folders IS 'Таблица папок для организации чатов';
COMMENT ON TABLE chat_room_folders IS 'Таблица связи чатов с папками';
