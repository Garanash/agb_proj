-- Создание таблиц для Telegram интеграции

-- Таблица для хранения настроек Telegram ботов
CREATE TABLE IF NOT EXISTS telegram_bots (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    token VARCHAR NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    webhook_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица для связи пользователей системы с Telegram аккаунтами
CREATE TABLE IF NOT EXISTS telegram_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    telegram_id BIGINT NOT NULL UNIQUE,
    username VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    is_bot_user BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица для хранения уведомлений, отправленных в Telegram
CREATE TABLE IF NOT EXISTS telegram_notifications (
    id SERIAL PRIMARY KEY,
    telegram_user_id INTEGER NOT NULL REFERENCES telegram_users(id),
    message_type VARCHAR NOT NULL, -- 'new_request', 'response_received', etc.
    message_text TEXT NOT NULL,
    message_id BIGINT, -- ID сообщения в Telegram
    chat_id BIGINT NOT NULL,
    repair_request_id INTEGER REFERENCES repair_requests(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON telegram_users(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_chat_id ON telegram_notifications(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_repair_request_id ON telegram_notifications(repair_request_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_created_at ON telegram_notifications(created_at);

-- Обновление триггеров для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для таблиц
DROP TRIGGER IF EXISTS update_telegram_bots_updated_at ON telegram_bots;
CREATE TRIGGER update_telegram_bots_updated_at
    BEFORE UPDATE ON telegram_bots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_telegram_users_updated_at ON telegram_users;
CREATE TRIGGER update_telegram_users_updated_at
    BEFORE UPDATE ON telegram_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
