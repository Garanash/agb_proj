-- Миграция: добавление новых столбцов в таблицу contractor_profiles

-- Добавляем личные данные
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS patronymic VARCHAR;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS email VARCHAR;

-- Добавляем профессиональную информацию (JSON)
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS professional_info JSONB DEFAULT '[]'::jsonb;

-- Добавляем образование (JSON)
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb;

-- Добавляем банковские данные
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS bank_name VARCHAR;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS bank_account VARCHAR;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS bank_bik VARCHAR;

-- Добавляем контакты
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS telegram_username VARCHAR;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS website VARCHAR;

-- Добавляем общее описание
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS general_description TEXT;

-- Добавляем файлы
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS profile_photo_path VARCHAR;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS portfolio_files JSONB DEFAULT '[]'::jsonb;
ALTER TABLE contractor_profiles ADD COLUMN IF NOT EXISTS document_files JSONB DEFAULT '[]'::jsonb;
