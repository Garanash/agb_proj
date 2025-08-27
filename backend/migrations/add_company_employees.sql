-- Создание таблицы для сотрудников компании
CREATE TABLE IF NOT EXISTS company_employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    middle_name VARCHAR,
    position VARCHAR NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    email VARCHAR,
    phone VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Создание индексов для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_company_employees_department_id ON company_employees(department_id);
CREATE INDEX IF NOT EXISTS idx_company_employees_is_active ON company_employees(is_active);
CREATE INDEX IF NOT EXISTS idx_company_employees_name ON company_employees(last_name, first_name);

