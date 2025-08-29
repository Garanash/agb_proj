-- Добавление недостающих колонок в таблицу departments
ALTER TABLE departments 
ADD COLUMN IF NOT EXISTS head_id INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Создание индекса для head_id для улучшения производительности
CREATE INDEX IF NOT EXISTS ix_departments_head_id ON departments(head_id);
