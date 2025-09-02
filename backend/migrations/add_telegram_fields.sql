-- Добавление новых полей в таблицу repair_requests
ALTER TABLE repair_requests 
ADD COLUMN IF NOT EXISTS manager_comment TEXT,
ADD COLUMN IF NOT EXISTS final_price INTEGER,
ADD COLUMN IF NOT EXISTS sent_to_bot_at TIMESTAMP WITH TIME ZONE;

-- Обновление enum для статусов заявок
-- Сначала создаем новый тип
CREATE TYPE request_status_new AS ENUM ('new', 'processing', 'sent_to_bot', 'assigned', 'completed', 'cancelled');

-- Обновляем существующие записи
UPDATE repair_requests SET status = 'processing' WHERE status = 'processing';

-- Изменяем тип колонки
ALTER TABLE repair_requests 
ALTER COLUMN status TYPE request_status_new USING status::request_status_new;

-- Удаляем старый тип и переименовываем новый
DROP TYPE IF EXISTS request_status;
ALTER TYPE request_status_new RENAME TO request_status;

-- Создание таблицы telegram_bots если не существует
CREATE TABLE IF NOT EXISTS telegram_bots (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    token VARCHAR NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    webhook_url VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы telegram_users если не существует
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

-- Создание таблицы telegram_notifications если не существует
CREATE TABLE IF NOT EXISTS telegram_notifications (
    id SERIAL PRIMARY KEY,
    telegram_user_id INTEGER NOT NULL REFERENCES telegram_users(id),
    message_type VARCHAR NOT NULL,
    message_text TEXT NOT NULL,
    message_id BIGINT,
    chat_id BIGINT NOT NULL,
    repair_request_id INTEGER REFERENCES repair_requests(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Добавление основного бота в таблицу
INSERT INTO telegram_bots (name, token, is_active) 
VALUES ('Main Bot', '8394091922:AAF2l0X7slM6apRNf2ju25aqklwSrG1ATNg', TRUE)
ON CONFLICT (token) DO NOTHING;
