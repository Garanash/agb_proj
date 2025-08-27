-- Добавление поля is_public в таблицу events
ALTER TABLE events ADD COLUMN is_public BOOLEAN DEFAULT FALSE;

-- Обновление существующих событий: все события по умолчанию не являются общими
UPDATE events SET is_public = FALSE WHERE is_public IS NULL;
