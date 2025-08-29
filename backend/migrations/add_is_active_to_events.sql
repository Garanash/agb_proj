-- Добавление поля is_active в таблицу events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Создание индекса для is_active для улучшения производительности
CREATE INDEX IF NOT EXISTS ix_events_is_active ON events(is_active);
