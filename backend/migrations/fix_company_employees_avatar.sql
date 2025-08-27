-- Добавление недостающей колонки avatar_url в таблицу company_employees
ALTER TABLE company_employees 
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;

-- Обновление существующих записей (устанавливаем NULL для существующих записей)
UPDATE company_employees 
SET avatar_url = NULL 
WHERE avatar_url IS NULL;
