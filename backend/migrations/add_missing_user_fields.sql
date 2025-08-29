-- Добавление недостающих колонок в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR,
ADD COLUMN IF NOT EXISTS phone VARCHAR,
ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS position VARCHAR;

-- Создание индекса для department_id для улучшения производительности
CREATE INDEX IF NOT EXISTS ix_users_department_id ON users(department_id);
