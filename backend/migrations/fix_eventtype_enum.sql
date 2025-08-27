-- Исправление enum eventtype - добавление недостающих значений
-- Сначала удаляем существующий enum если он пустой
DROP TYPE IF EXISTS eventtype CASCADE;

-- Создаем enum заново с правильными значениями
CREATE TYPE eventtype AS ENUM (
    'meeting',      -- Встреча
    'call',         -- Созвон
    'briefing',     -- Планерка
    'conference',   -- Совещание
    'other'         -- Другое
);

-- Обновляем колонку event_type в таблице events
ALTER TABLE events ALTER COLUMN event_type TYPE eventtype USING event_type::text::eventtype;

