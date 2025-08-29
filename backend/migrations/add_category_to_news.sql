-- Добавление поля category в таблицу news
ALTER TABLE news 
ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'general';

-- Создание индекса для category для улучшения производительности
CREATE INDEX IF NOT EXISTS ix_news_category ON news(category);
