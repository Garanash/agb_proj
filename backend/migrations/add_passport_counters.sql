-- Создание таблицы для счетчиков паспортов
CREATE TABLE IF NOT EXISTS passport_counters (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL UNIQUE,
    current_serial INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Создание индекса для быстрого поиска по году
CREATE INDEX IF NOT EXISTS idx_passport_counters_year ON passport_counters(year);

-- Вставка начального счетчика для текущего года
INSERT INTO passport_counters (year, current_serial) 
VALUES (EXTRACT(YEAR FROM CURRENT_DATE), 0)
ON CONFLICT (year) DO NOTHING;
