-- Добавление поля author_name в таблицу news
ALTER TABLE news 
ADD COLUMN IF NOT EXISTS author_name VARCHAR;

-- Обновление существующих записей (устанавливаем NULL для существующих записей)
UPDATE news 
SET author_name = NULL 
WHERE author_name IS NULL;
